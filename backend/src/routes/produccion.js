import {Router} from 'express';
import Decimal from 'decimal.js';
import {asyncRoute,fail,audit,dateValue,entero,numero,texto,fecha,uno,transicion} from '../http.js';
import {exigir,distinto} from '../permisos.js';
import {moverStock,salidaFIFO,almacenId,crearLote,ALMACEN} from '../stock.js';
import {explotar} from './maestros.js';
// RF-11..RF-19 y observaciones del docente: plan de producción con detalle, órdenes con varios productos y firmas
// (elaborado, revisado, autorizado), requisiciones base/adicionales, avances, control de calidad, lotes y cierre.
const n=v=>v===null||v===undefined?null:Number(v);
const anio=()=>new Date().getFullYear();
async function siguiente(tx,seq,prefijo){const v=(await tx.query(`SELECT nextval('${seq}') AS n`)).rows[0].n;return `${prefijo}-${anio()}-${String(v).padStart(4,'0')}`;}
async function fichaVigente(tx,productoId){
  const f=(await tx.query("SELECT f.id,p.nombre FROM productos p LEFT JOIN fichas_tecnicas f ON f.producto_id=p.id AND f.estado='Vigente' WHERE p.id=$1",[productoId])).rows[0];
  if(!f) fail(400,'Hay un producto inexistente.'); if(!f.id) fail(409,`${f.nombre} no tiene una ficha técnica vigente.`); return Number(f.id);
}
export default function produccion(db){
  const r=Router();
  const leer=req=>exigir(req.user,'produccion','leer'), escribir=req=>exigir(req.user,'produccion','escribir');
  const soloAdmin=(req,accion)=>{if(req.user.role!=='admin') fail(403,`Solo administración / gerencia puede ${accion}.`);};

  // ---------- Planes ----------
  async function planes(tx,where='',p=[]){
    const head=(await tx.query(`SELECT pl.*,ue.nombre AS elaborado,ur.nombre AS revisado,ua.nombre AS autorizado FROM planes_produccion pl JOIN usuarios ue ON ue.id=pl.elaborado_por
      LEFT JOIN usuarios ur ON ur.id=pl.revisado_por LEFT JOIN usuarios ua ON ua.id=pl.autorizado_por ${where} ORDER BY pl.inicio DESC,pl.id DESC`,p)).rows;
    if(!head.length) return [];
    const det=(await tx.query(`SELECT d.*,pr.nombre AS producto,pr.codigo,li.nombre AS linea,
      COALESCE((SELECT SUM(od.cantidad_planificada) FROM orden_produccion_detalles od JOIN ordenes_produccion o ON o.id=od.orden_id WHERE od.plan_detalle_id=d.id AND o.estado<>'Cancelada'),0) AS ordenado,
      COALESCE((SELECT SUM(od.cantidad_producida) FROM orden_produccion_detalles od JOIN ordenes_produccion o ON o.id=od.orden_id WHERE od.plan_detalle_id=d.id AND o.estado<>'Cancelada'),0) AS producido,
      COALESCE((SELECT SUM(od.aprobada) FROM orden_produccion_detalles od JOIN ordenes_produccion o ON o.id=od.orden_id WHERE od.plan_detalle_id=d.id AND o.estado<>'Cancelada'),0) AS aprobado
      FROM plan_detalles d JOIN productos pr ON pr.id=d.producto_id LEFT JOIN lineas_produccion li ON li.id=d.linea_id WHERE d.plan_id=ANY($1) ORDER BY pr.nombre`,[head.map(h=>h.id)])).rows;
    return head.map(h=>{const detalles=det.filter(d=>d.plan_id===h.id).map(d=>({id:Number(d.id),productoId:Number(d.producto_id),producto:d.producto,codigo:d.codigo,fichaId:n(d.ficha_id),lineaId:n(d.linea_id),linea:d.linea,cantidad:Number(d.cantidad),notas:d.notas,ordenado:Number(d.ordenado),producido:Number(d.producido),aprobado:Number(d.aprobado),pendiente:Math.max(0,Number(d.cantidad)-Number(d.ordenado)),cumplimientoPct:Math.round(Number(d.aprobado)*1000/Number(d.cantidad))/10}));
      const tp=detalles.reduce((s,d)=>s+d.cantidad,0),ta=detalles.reduce((s,d)=>s+d.aprobado,0);
      return {id:h.id,fecha:dateValue(h.fecha),inicio:dateValue(h.inicio),fin:dateValue(h.fin),estado:h.estado,notas:h.notas,elaboradoPor:h.elaborado,elaboradoPorId:Number(h.elaborado_por),revisadoPor:h.revisado,revisadoEn:h.revisado_en,autorizadoPor:h.autorizado,autorizadoEn:h.autorizado_en,_version:Number(h.version),
        detalles,totalPlanificado:tp,totalProducido:detalles.reduce((s,d)=>s+d.producido,0),totalAprobado:ta,cumplimientoPct:tp?Math.round(ta*1000/tp)/10:0};});
  }
  async function datosPlan(tx,b){
    const d={inicio:fecha(b.inicio,'inicio',{opcional:false}),fin:fecha(b.fin,'fin',{opcional:false}),notas:texto(b.notas,'notas',{max:2000})};
    if(d.fin<d.inicio) fail(400,'La fecha final no puede ser anterior al inicio.');
    if(!Array.isArray(b.detalles)||!b.detalles.length||b.detalles.length>100) fail(400,'El plan debe detallar entre 1 y 100 productos.');
    const seen=new Set();
    d.detalles=[];
    for(const x of b.detalles){const p=entero(x.productoId,'producto'); if(seen.has(p)) fail(400,'No repitas productos en el plan.'); seen.add(p);
      d.detalles.push({productoId:p,cantidad:entero(x.cantidad,'cantidad'),lineaId:entero(x.lineaId,'línea',{opcional:true}),notas:texto(x.notas,'notas',{max:500}),fichaId:await fichaVigente(tx,p)});}
    return d;
  }
  async function guardarDetallePlan(tx,id,d){
    await tx.query('DELETE FROM plan_detalles WHERE plan_id=$1',[id]);
    for(const x of d.detalles) await tx.query('INSERT INTO plan_detalles(plan_id,producto_id,ficha_id,linea_id,cantidad,notas) VALUES($1,$2,$3,$4,$5,$6)',[id,x.productoId,x.fichaId,x.lineaId,x.cantidad,x.notas]);
  }
  r.get('/produccion/planes',asyncRoute(async(req,res)=>{leer(req);res.json({data:await planes(db)})}));
  r.post('/produccion/planes',asyncRoute(async(req,res)=>{
    escribir(req);
    const id=await db.transaction(async tx=>{const d=await datosPlan(tx,req.body||{}),id=await siguiente(tx,'plan_produccion_seq','PLAN');
      await tx.query('INSERT INTO planes_produccion(id,inicio,fin,notas,elaborado_por) VALUES($1,$2,$3,$4,$5)',[id,d.inicio,d.fin,d.notas,req.user.id]);
      await guardarDetallePlan(tx,id,d); await audit(tx,req.user,'crear','planes-produccion',id); return id;});
    res.status(201).json({data:(await planes(db,'WHERE pl.id=$1',[id]))[0]});
  }));
  r.put('/produccion/planes/:id',asyncRoute(async(req,res)=>{
    escribir(req);
    await db.transaction(async tx=>{
      const p=(await tx.query('SELECT estado,version FROM planes_produccion WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0]; if(!p) fail(404,'Plan no encontrado.');
      if(p.estado!=='Borrador') fail(409,'Solo se edita un plan en borrador.'); if(Number(p.version)!==entero(req.body?._version,'_version')) fail(409,'El plan cambió. Vuelve a cargar la página.');
      const d=await datosPlan(tx,req.body||{});
      await tx.query('UPDATE planes_produccion SET inicio=$1,fin=$2,notas=$3,version=version+1 WHERE id=$4',[d.inicio,d.fin,d.notas,req.params.id]);
      await guardarDetallePlan(tx,req.params.id,d); await audit(tx,req.user,'editar','planes-produccion',req.params.id);
    });
    res.json({data:(await planes(db,'WHERE pl.id=$1',[req.params.id]))[0]});
  }));
  r.patch('/produccion/planes/:id/:accion',asyncRoute(async(req,res)=>{
    const accion=uno(req.params.accion,['revisar','autorizar','cancelar','cerrar','devolver'],'acción');
    await db.transaction(async tx=>{
      const p=(await tx.query('SELECT * FROM planes_produccion WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0]; if(!p) fail(404,'Plan no encontrado.');
      if(accion==='revisar'){escribir(req);distinto(req.user,p.elaborado_por,'revisar');await transicion(tx,'planes_produccion',p.id,['Borrador'],'Revisado',',revisado_por=$4,revisado_en=now()',[req.user.id]);}
      if(accion==='devolver'){escribir(req);await transicion(tx,'planes_produccion',p.id,['Revisado'],'Borrador',',revisado_por=NULL,revisado_en=NULL');}
      if(accion==='autorizar'){soloAdmin(req,'autorizar planes');distinto(req.user,p.elaborado_por,'autorizar');await transicion(tx,'planes_produccion',p.id,['Revisado'],'Autorizado',',autorizado_por=$4,autorizado_en=now()',[req.user.id]);}
      if(accion==='cancelar'){escribir(req);await transicion(tx,'planes_produccion',p.id,['Borrador','Revisado'],'Cancelado');}
      if(accion==='cerrar'){escribir(req);const abiertas=(await tx.query("SELECT COUNT(*) AS n FROM ordenes_produccion WHERE plan_id=$1 AND estado NOT IN ('Cerrada','Cancelada')",[p.id])).rows[0].n;
        if(Number(abiertas)>0) fail(409,'El plan tiene órdenes abiertas.'); await transicion(tx,'planes_produccion',p.id,['Autorizado'],'Cerrado');}
      await audit(tx,req.user,accion,'planes-produccion',p.id);
    });
    res.json({data:(await planes(db,'WHERE pl.id=$1',[req.params.id]))[0]});
  }));

  // ---------- Órdenes ----------
  async function ordenes(tx,where='',p=[],completo=false){
    const head=(await tx.query(`SELECT o.*,li.nombre AS linea,ue.nombre AS elaborado,ur.nombre AS revisado,ua.nombre AS autorizado,am.nombre AS almacen_materiales,ad.nombre AS almacen_destino
      FROM ordenes_produccion o LEFT JOIN lineas_produccion li ON li.id=o.linea_id LEFT JOIN usuarios ue ON ue.id=o.elaborado_por LEFT JOIN usuarios ur ON ur.id=o.revisado_por LEFT JOIN usuarios ua ON ua.id=o.autorizado_por
      LEFT JOIN almacenes am ON am.id=o.almacen_materiales_id LEFT JOIN almacenes ad ON ad.id=o.almacen_destino_id ${where} ORDER BY o.fecha DESC,o.id DESC`,p)).rows;
    if(!head.length) return [];
    const ids=head.map(h=>h.id);
    const det=(await tx.query(`SELECT d.*,pr.nombre AS producto,pr.codigo,f.codigo AS ficha,l.codigo AS lote FROM orden_produccion_detalles d JOIN productos pr ON pr.id=d.producto_id JOIN fichas_tecnicas f ON f.id=d.ficha_id LEFT JOIN lotes l ON l.id=d.lote_id WHERE d.orden_id=ANY($1) ORDER BY d.id`,[ids])).rows;
    const reqs=(await tx.query(`SELECT q.*,us.nombre AS solicitado,ua.nombre AS aprobado,ue.nombre AS entregado FROM requisiciones_material q JOIN usuarios us ON us.id=q.solicitado_por LEFT JOIN usuarios ua ON ua.id=q.aprobado_por LEFT JOIN usuarios ue ON ue.id=q.entregado_por WHERE q.orden_id=ANY($1) ORDER BY q.id`,[ids])).rows;
    const rdet=reqs.length?(await tx.query('SELECT rd.*,m.nombre AS material,m.unidad,m.existencia FROM requisicion_detalles rd JOIN materiales m ON m.id=rd.material_id WHERE rd.requisicion_id=ANY($1) ORDER BY m.nombre',[reqs.map(q=>q.id)])).rows:[];
    let extra={};
    if(completo){
      const regs=(await tx.query('SELECT r.*,u.nombre AS usuario,d.orden_id FROM produccion_registros r JOIN orden_produccion_detalles d ON d.id=r.orden_detalle_id JOIN usuarios u ON u.id=r.usuario_id WHERE d.orden_id=ANY($1) ORDER BY r.fecha',[ids])).rows;
      const qc=(await tx.query('SELECT c.*,u.nombre AS inspector,d.orden_id,pr.nombre AS producto FROM control_calidad c JOIN orden_produccion_detalles d ON d.id=c.orden_detalle_id JOIN productos pr ON pr.id=d.producto_id JOIN usuarios u ON u.id=c.inspector_id WHERE d.orden_id=ANY($1) ORDER BY c.fecha',[ids])).rows;
      const res=(await tx.query('SELECT r.*,m.nombre AS material,m.unidad FROM produccion_resumen_materiales r JOIN materiales m ON m.id=r.material_id WHERE r.orden_id=ANY($1) ORDER BY m.nombre',[ids])).rows;
      const cons=(await tx.query('SELECT c.*,m.nombre AS material,l.codigo AS lote FROM produccion_consumos c JOIN materiales m ON m.id=c.material_id LEFT JOIN lotes l ON l.id=c.lote_id WHERE c.orden_id=ANY($1) ORDER BY c.fecha',[ids])).rows;
      extra={regs,qc,res,cons};
    }
    return head.map(o=>{
      const detalles=det.filter(d=>d.orden_id===o.id).map(d=>({id:Number(d.id),productoId:Number(d.producto_id),producto:d.producto,codigo:d.codigo,fichaId:Number(d.ficha_id),ficha:d.ficha,planDetalleId:n(d.plan_detalle_id),planificada:Number(d.cantidad_planificada),producida:Number(d.cantidad_producida),aprobada:Number(d.aprobada),rechazada:Number(d.rechazada),pendienteCalidad:Number(d.cantidad_producida)-Number(d.aprobada)-Number(d.rechazada),lote:d.lote}));
      const requisiciones=reqs.filter(q=>q.orden_id===o.id).map(q=>({id:Number(q.id),codigo:q.codigo,tipo:q.tipo,estado:q.estado,justificacion:q.justificacion,solicitadoPor:q.solicitado,solicitadoPorId:Number(q.solicitado_por),solicitadoEn:q.solicitado_en,aprobadoPor:q.aprobado,entregadoPor:q.entregado,entregadoEn:q.entregado_en,_version:Number(q.version),
        materiales:rdet.filter(x=>Number(x.requisicion_id)===Number(q.id)).map(x=>({materialId:Number(x.material_id),material:x.material,unidad:x.unidad,teorica:Number(x.cantidad_teorica),cantidad:Number(x.cantidad),entregada:Number(x.cantidad_entregada),devuelta:Number(x.cantidad_devuelta),disponibleTotal:Number(x.existencia)}))}));
      const tp=detalles.reduce((s,d)=>s+d.planificada,0),tpr=detalles.reduce((s,d)=>s+d.producida,0),ta=detalles.reduce((s,d)=>s+d.aprobada,0);
      const out={id:o.id,fecha:dateValue(o.fecha),planId:o.plan_id,lineaId:n(o.linea_id),linea:o.linea,fueraPlan:o.fuera_plan,justificacion:o.justificacion,observaciones:o.observaciones,prioridad:o.prioridad,fechaEntrega:dateValue(o.fecha_entrega),responsable:o.responsable,estado:o.estado,etapa:o.etapa,progreso:Number(o.progreso),
        elaboradoPor:o.elaborado,elaboradoPorId:n(o.elaborado_por),revisadoPor:o.revisado,revisadoEn:o.revisado_en,autorizadoPor:o.autorizado,autorizadoEn:o.autorizado_en,almacenMateriales:o.almacen_materiales,almacenMaterialesId:n(o.almacen_materiales_id),almacenDestino:o.almacen_destino,almacenDestinoId:n(o.almacen_destino_id),fechaInicio:o.fecha_inicio,fechaCierre:o.fecha_cierre,
        legado:!o.elaborado_por,producto:o.producto,cantidad:Number(o.cantidad),_version:Number(o.version),detalles,requisiciones,totalPlanificado:tp||Number(o.cantidad),totalProducido:tpr,totalAprobado:ta,totalRechazado:detalles.reduce((s,d)=>s+d.rechazada,0),cumplimientoPct:tp?Math.round(ta*1000/tp)/10:0};
      if(completo){const ids2=new Set(detalles.map(d=>d.id));
        out.registros=extra.regs.filter(x=>ids2.has(Number(x.orden_detalle_id))).map(x=>({id:Number(x.id),ordenDetalleId:Number(x.orden_detalle_id),cantidad:Number(x.cantidad),etapa:x.etapa,notas:x.notas,fecha:x.fecha,usuario:x.usuario}));
        out.calidad=extra.qc.filter(x=>x.orden_id===o.id).map(x=>({id:Number(x.id),ordenDetalleId:Number(x.orden_detalle_id),producto:x.producto,revisada:Number(x.revisada),aprobada:Number(x.aprobada),rechazada:Number(x.rechazada),defecto:x.defecto,observaciones:x.observaciones,inspector:x.inspector,fecha:x.fecha}));
        out.resumenMateriales=extra.res.filter(x=>x.orden_id===o.id).map(x=>({materialId:Number(x.material_id),material:x.material,unidad:x.unidad,teorico:Number(x.teorico),entregado:Number(x.entregado),devuelto:Number(x.devuelto),consumoReal:Number(x.consumo_real),desperdicio:Number(x.desperdicio),costoUnitario:Number(x.costo_unitario)}));
        out.consumos=extra.cons.filter(x=>x.orden_id===o.id).map(x=>({id:Number(x.id),material:x.material,lote:x.lote,cantidad:Number(x.cantidad),tipo:x.tipo,fecha:x.fecha}));}
      return out;
    });
  }
  const unaOrden=async(tx,id,completo=true)=>{const o=(await ordenes(tx,'WHERE o.id=$1',[id],completo))[0]; if(!o) fail(404,'Orden de producción no encontrada.'); return o;};
  r.get('/produccion/ordenes',asyncRoute(async(req,res)=>{leer(req);res.json({data:await ordenes(db)})}));
  r.get('/produccion/ordenes/:id',asyncRoute(async(req,res)=>{leer(req);res.json({data:await unaOrden(db,req.params.id)})}));
  async function datosOrden(tx,b){
    const d={planId:texto(b.planId,'plan',{max:40})||null,lineaId:entero(b.lineaId,'línea',{opcional:true}),prioridad:uno(b.prioridad||'Media',['Alta','Media','Baja'],'prioridad'),fechaEntrega:fecha(b.fechaEntrega,'fecha de entrega'),
      responsable:texto(b.responsable,'responsable'),justificacion:texto(b.justificacion,'justificación',{max:1000}),observaciones:texto(b.observaciones,'observaciones',{max:1000}),
      almacenMaterialesId:await almacenId(tx,b.almacenMaterialesId,ALMACEN.TALLER),almacenDestinoId:await almacenId(tx,b.almacenDestinoId,ALMACEN.TALLER)};
    if(!Array.isArray(b.detalles)||!b.detalles.length||b.detalles.length>50) fail(400,'La orden debe incluir entre 1 y 50 productos.');
    let plan=null, planDet=[];
    if(d.planId){plan=(await tx.query('SELECT estado FROM planes_produccion WHERE id=$1',[d.planId])).rows[0]; if(!plan) fail(400,'El plan no existe.'); if(plan.estado!=='Autorizado') fail(409,'La orden solo puede referenciar un plan autorizado.');
      planDet=(await tx.query(`SELECT d.id,d.producto_id,d.cantidad,COALESCE((SELECT SUM(od.cantidad_planificada) FROM orden_produccion_detalles od JOIN ordenes_produccion o ON o.id=od.orden_id WHERE od.plan_detalle_id=d.id AND o.estado<>'Cancelada' AND o.id<>$2),0) AS ordenado FROM plan_detalles d WHERE d.plan_id=$1`,[d.planId,b.id||''])).rows;}
    const seen=new Set(); d.detalles=[]; let fuera=!d.planId;
    for(const x of b.detalles){const p=entero(x.productoId,'producto'); if(seen.has(p)) fail(400,'No repitas productos en la orden.'); seen.add(p);
      const cantidad=entero(x.cantidad,'cantidad'), pd=planDet.find(z=>Number(z.producto_id)===p);
      if(d.planId && (!pd || cantidad>Number(pd.cantidad)-Number(pd.ordenado))) fuera=true;
      d.detalles.push({productoId:p,cantidad,fichaId:await fichaVigente(tx,p),planDetalleId:pd?Number(pd.id):null});}
    // Observación del docente: lo que no está en el plan (o lo excede) requiere justificación.
    if(fuera && d.justificacion.length<10) fail(400,d.planId?'Hay productos fuera del plan o que exceden lo pendiente del plan: justifica la orden (mínimo 10 caracteres).':'Una orden sin plan autorizado requiere justificación (mínimo 10 caracteres).');
    d.fueraPlan=fuera;
    const nombres=(await tx.query('SELECT string_agg(nombre,\', \' ORDER BY nombre) AS n FROM productos WHERE id=ANY($1)',[[...seen]])).rows[0].n;
    d.resumen={producto:nombres.slice(0,300),cantidad:d.detalles.reduce((s,x)=>s+x.cantidad,0)};
    return d;
  }
  async function guardarDetalleOrden(tx,id,d){
    await tx.query('DELETE FROM orden_produccion_detalles WHERE orden_id=$1',[id]);
    for(const x of d.detalles) await tx.query('INSERT INTO orden_produccion_detalles(orden_id,producto_id,ficha_id,plan_detalle_id,cantidad_planificada) VALUES($1,$2,$3,$4,$5)',[id,x.productoId,x.fichaId,x.planDetalleId,x.cantidad]);
  }
  r.post('/produccion/ordenes',asyncRoute(async(req,res)=>{
    escribir(req);
    const id=await db.transaction(async tx=>{const d=await datosOrden(tx,req.body||{}),id=await siguiente(tx,'orden_produccion_seq','OP');
      await tx.query(`INSERT INTO ordenes_produccion(id,producto,cantidad,prioridad,fecha_entrega,responsable,estado,etapa,progreso,plan_id,linea_id,fuera_plan,justificacion,observaciones,elaborado_por,almacen_materiales_id,almacen_destino_id)
        VALUES($1,$2,$3,$4,$5,$6,'Borrador','Planificación',0,$7,$8,$9,$10,$11,$12,$13,$14)`,[id,d.resumen.producto,d.resumen.cantidad,d.prioridad,d.fechaEntrega,d.responsable,d.planId,d.lineaId,d.fueraPlan,d.justificacion,d.observaciones,req.user.id,d.almacenMaterialesId,d.almacenDestinoId]);
      await guardarDetalleOrden(tx,id,d); await audit(tx,req.user,'crear','ordenes-produccion',id); return id;});
    res.status(201).json({data:await unaOrden(db,id)});
  }));
  r.put('/produccion/ordenes/:id',asyncRoute(async(req,res)=>{
    escribir(req);
    await db.transaction(async tx=>{
      const o=(await tx.query('SELECT estado,version,elaborado_por FROM ordenes_produccion WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0]; if(!o) fail(404,'Orden no encontrada.');
      if(o.estado!=='Borrador'||!o.elaborado_por) fail(409,'Solo se edita una orden en borrador.'); if(Number(o.version)!==entero(req.body?._version,'_version')) fail(409,'La orden cambió. Vuelve a cargar la página.');
      const d=await datosOrden(tx,{...req.body,id:req.params.id});
      await tx.query('UPDATE ordenes_produccion SET producto=$1,cantidad=$2,prioridad=$3,fecha_entrega=$4,responsable=$5,plan_id=$6,linea_id=$7,fuera_plan=$8,justificacion=$9,observaciones=$10,almacen_materiales_id=$11,almacen_destino_id=$12,version=version+1 WHERE id=$13',
        [d.resumen.producto,d.resumen.cantidad,d.prioridad,d.fechaEntrega,d.responsable,d.planId,d.lineaId,d.fueraPlan,d.justificacion,d.observaciones,d.almacenMaterialesId,d.almacenDestinoId,req.params.id]);
      await guardarDetalleOrden(tx,req.params.id,d); await audit(tx,req.user,'editar','ordenes-produccion',req.params.id);
    });
    res.json({data:await unaOrden(db,req.params.id)});
  }));
  // Requisición base = explosión multinivel de la ficha vigente × cantidad de cada producto.
  async function requisicionBase(tx,user,orden){
    const acumulado=new Map();
    for(const d of (await tx.query('SELECT ficha_id,cantidad_planificada FROM orden_produccion_detalles WHERE orden_id=$1',[orden.id])).rows) await explotar(tx,d.ficha_id,d.cantidad_planificada,{acumulado});
    if(!acumulado.size) fail(409,'Las fichas técnicas no generan materiales para la requisición.');
    const codigo=await siguiente(tx,'requisicion_seq','REQ');
    const q=await tx.query("INSERT INTO requisiciones_material(codigo,orden_id,tipo,estado,almacen_id,solicitado_por,aprobado_por,aprobado_en) VALUES($1,$2,'Base','Aprobada',$3,$4,$4,now()) RETURNING id",[codigo,orden.id,orden.almacen_materiales_id,user.id]);
    for(const m of acumulado.values()){const c=m.cantidad.toDecimalPlaces(3,Decimal.ROUND_UP);
      await tx.query('INSERT INTO requisicion_detalles(requisicion_id,material_id,cantidad_teorica,cantidad) VALUES($1,$2,$3,$3)',[q.rows[0].id,m.materialId,c.toFixed(3)]);}
    return codigo;
  }
  r.patch('/produccion/ordenes/:id/:accion',asyncRoute(async(req,res)=>{
    const accion=uno(req.params.accion,['revisar','devolver','autorizar','cancelar'],'acción');
    await db.transaction(async tx=>{
      const o=(await tx.query('SELECT * FROM ordenes_produccion WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0]; if(!o) fail(404,'Orden no encontrada.');
      if(!o.elaborado_por) fail(409,'Esta orden es anterior al flujo de autorización; consúltala como registro histórico.');
      if(accion==='revisar'){escribir(req);distinto(req.user,o.elaborado_por,'revisar');await transicion(tx,'ordenes_produccion',o.id,['Borrador'],'Revisada',',revisado_por=$4,revisado_en=now()',[req.user.id]);}
      if(accion==='devolver'){escribir(req);await transicion(tx,'ordenes_produccion',o.id,['Revisada'],'Borrador',',revisado_por=NULL,revisado_en=NULL');}
      if(accion==='autorizar'){soloAdmin(req,'autorizar órdenes de producción');distinto(req.user,o.elaborado_por,'autorizar');
        await transicion(tx,'ordenes_produccion',o.id,['Revisada'],'Autorizada',',autorizado_por=$4,autorizado_en=now()',[req.user.id]);
        await requisicionBase(tx,req.user,o);}
      if(accion==='cancelar'){escribir(req);
        const ent=(await tx.query("SELECT COUNT(*) AS n FROM requisiciones_material WHERE orden_id=$1 AND estado='Entregada'",[o.id])).rows[0].n;
        if(Number(ent)>0) fail(409,'La orden ya recibió materiales; ciérrala devolviendo los sobrantes.');
        await transicion(tx,'ordenes_produccion',o.id,['Borrador','Revisada','Autorizada'],'Cancelada');
        await tx.query("UPDATE requisiciones_material SET estado='Rechazada',version=version+1 WHERE orden_id=$1 AND estado IN ('Pendiente','Aprobada')",[o.id]);}
      await audit(tx,req.user,accion,'ordenes-produccion',o.id);
    });
    res.json({data:await unaOrden(db,req.params.id)});
  }));

  // ---------- Requisiciones ----------
  r.get('/produccion/requisiciones',asyncRoute(async(req,res)=>{
    if(!['admin','produccion','inventario'].includes(req.user.role)) fail(403,'Tu rol no tiene permiso para esta operación.');
    const lista=(await ordenes(db,"WHERE EXISTS (SELECT 1 FROM requisiciones_material q WHERE q.orden_id=o.id)")).flatMap(o=>o.requisiciones.map(q=>({...q,ordenId:o.id,ordenEstado:o.estado,producto:o.producto,almacen:o.almacenMateriales,almacenId:o.almacenMaterialesId})));
    res.json({data:lista.sort((a,b)=>b.id-a.id)});
  }));
  r.post('/produccion/requisiciones/adicional',asyncRoute(async(req,res)=>{
    escribir(req);const b=req.body||{};
    const ordenId=texto(b.ordenId,'orden',{requerido:true,max:40}), justificacion=texto(b.justificacion,'justificación',{max:1000});
    if(justificacion.length<10) fail(400,'Los materiales adicionales requieren una justificación (mínimo 10 caracteres).');
    if(!Array.isArray(b.materiales)||!b.materiales.length||b.materiales.length>50) fail(400,'Indica los materiales adicionales.');
    const seen=new Set(); const mats=b.materiales.map(x=>{const m=entero(x.materialId,'material'); if(seen.has(m)) fail(400,'No repitas materiales.'); seen.add(m); return {materialId:m,cantidad:numero(x.cantidad,'cantidad',{positivo:true})};});
    const codigo=await db.transaction(async tx=>{
      const o=(await tx.query('SELECT * FROM ordenes_produccion WHERE id=$1 FOR UPDATE',[ordenId])).rows[0]; if(!o) fail(404,'Orden no encontrada.');
      if(!['Autorizada','En proceso','En calidad'].includes(o.estado)) fail(409,'Solo se solicitan materiales adicionales para órdenes autorizadas o en proceso.');
      for(const m of mats) if(!(await tx.query('SELECT 1 FROM materiales WHERE id=$1',[m.materialId])).rows.length) fail(400,'Hay un material inexistente.');
      const codigo=await siguiente(tx,'requisicion_seq','REQ');
      const q=await tx.query("INSERT INTO requisiciones_material(codigo,orden_id,tipo,estado,justificacion,almacen_id,solicitado_por) VALUES($1,$2,'Adicional','Pendiente',$3,$4,$5) RETURNING id",[codigo,ordenId,justificacion,o.almacen_materiales_id,req.user.id]);
      for(const m of mats) await tx.query('INSERT INTO requisicion_detalles(requisicion_id,material_id,cantidad) VALUES($1,$2,$3)',[q.rows[0].id,m.materialId,m.cantidad]);
      await audit(tx,req.user,'solicitar adicional','requisiciones',codigo); return codigo;
    });
    res.status(201).json({data:{codigo}});
  }));
  r.patch('/produccion/requisiciones/:id/:accion',asyncRoute(async(req,res)=>{
    const accion=uno(req.params.accion,['aprobar','rechazar','entregar'],'acción'), id=entero(req.params.id,'id');
    const out=await db.transaction(async tx=>{
      const q=(await tx.query('SELECT q.*,o.estado AS orden_estado,o.almacen_materiales_id FROM requisiciones_material q JOIN ordenes_produccion o ON o.id=q.orden_id WHERE q.id=$1 FOR UPDATE OF q',[id])).rows[0];
      if(!q) fail(404,'Requisición no encontrada.');
      if(accion==='aprobar'||accion==='rechazar'){
        if(!['admin','produccion'].includes(req.user.role)) fail(403,'Tu rol no tiene permiso para esta operación.');
        distinto(req.user,q.solicitado_por,accion);
        await transicion(tx,'requisiciones_material',id,['Pendiente'],accion==='aprobar'?'Aprobada':'Rechazada',',aprobado_por=$4,aprobado_en=now()',[req.user.id]);
      }
      if(accion==='entregar'){ // bodega entrega: salida FIFO por lote y consumo asociado a la orden
        if(!['admin','produccion','inventario'].includes(req.user.role)) fail(403,'Tu rol no tiene permiso para esta operación.');
        if(!['Autorizada','En proceso','En calidad'].includes(q.orden_estado)) fail(409,'La orden no admite entregas de material.');
        await transicion(tx,'requisiciones_material',id,['Aprobada'],'Entregada',',entregado_por=$4,entregado_en=now()',[req.user.id]);
        const alm=await almacenId(tx,req.body?.almacenId||q.almacen_id||q.almacen_materiales_id,ALMACEN.TALLER);
        const lineas=(await tx.query('SELECT * FROM requisicion_detalles WHERE requisicion_id=$1 ORDER BY material_id',[id])).rows;
        for(const l of lineas){
          const partes=await salidaFIFO(tx,{almacenId:alm,materialId:Number(l.material_id),cantidad:l.cantidad,tipo:'Consumo de producción',referencia:q.orden_id,motivo:`${q.codigo} (${q.tipo})`,usuarioId:req.user.id});
          for(const p of partes) await tx.query("INSERT INTO produccion_consumos(orden_id,material_id,cantidad,usuario_id,lote_id,requisicion_id,tipo) VALUES($1,$2,$3,$4,$5,$6,'Entrega')",[q.orden_id,l.material_id,p.cantidad,req.user.id,p.loteId,id]);
          await tx.query('UPDATE requisicion_detalles SET cantidad_entregada=cantidad WHERE id=$1',[l.id]);
        }
        if(q.orden_estado==='Autorizada') await tx.query("UPDATE ordenes_produccion SET estado='En proceso',etapa='Corte de cuero',fecha_inicio=now(),version=version+1 WHERE id=$1",[q.orden_id]);
      }
      await audit(tx,req.user,`${accion} requisición`,'requisiciones',q.codigo); return q.orden_id;
    });
    res.json({data:await unaOrden(db,out)});
  }));

  // ---------- Avance, calidad y cierre ----------
  async function lineaDeOrden(tx,ordenId,detalleId,estados){
    const o=(await tx.query('SELECT * FROM ordenes_produccion WHERE id=$1 FOR UPDATE',[ordenId])).rows[0]; if(!o) fail(404,'Orden no encontrada.');
    if(!estados.includes(o.estado)) fail(409,`La orden debe estar en estado ${estados.join(' o ')}.`);
    const d=(await tx.query('SELECT * FROM orden_produccion_detalles WHERE id=$1 AND orden_id=$2 FOR UPDATE',[detalleId,ordenId])).rows[0]; if(!d) fail(400,'El producto no pertenece a la orden.');
    return {o,d};
  }
  r.post('/produccion/ordenes/:id/registros',asyncRoute(async(req,res)=>{
    escribir(req);const b=req.body||{};
    const detalleId=entero(b.ordenDetalleId,'producto'),cantidad=entero(b.cantidad,'cantidad'),etapa=texto(b.etapa,'etapa',{max:80}),notas=texto(b.notas,'notas',{max:500});
    await db.transaction(async tx=>{
      const {o,d}=await lineaDeOrden(tx,req.params.id,detalleId,['En proceso','En calidad']);
      await tx.query('INSERT INTO produccion_registros(orden_detalle_id,cantidad,etapa,notas,usuario_id) VALUES($1,$2,$3,$4,$5)',[d.id,cantidad,etapa,notas,req.user.id]);
      await tx.query('UPDATE orden_produccion_detalles SET cantidad_producida=cantidad_producida+$1 WHERE id=$2',[cantidad,d.id]);
      const t=(await tx.query('SELECT SUM(cantidad_producida) AS p,SUM(cantidad_planificada) AS q FROM orden_produccion_detalles WHERE orden_id=$1',[o.id])).rows[0];
      await tx.query('UPDATE ordenes_produccion SET progreso=LEAST(100,ROUND($1::numeric*100/$2)),etapa=COALESCE(NULLIF($3,\'\'),etapa),version=version+1 WHERE id=$4',[t.p,t.q,etapa,o.id]);
      await audit(tx,req.user,'registrar avance','ordenes-produccion',o.id);
    });
    res.status(201).json({data:await unaOrden(db,req.params.id)});
  }));
  r.post('/produccion/ordenes/:id/calidad',asyncRoute(async(req,res)=>{
    escribir(req);const b=req.body||{};
    const detalleId=entero(b.ordenDetalleId,'producto'),aprobada=entero(b.aprobada,'aprobadas',{min:0}),rechazada=entero(b.rechazada,'rechazadas',{min:0}),observaciones=texto(b.observaciones,'observaciones',{max:1000}),defecto=texto(b.defecto,'defecto',{max:200});
    if(aprobada+rechazada<=0) fail(400,'Indica cuántas unidades se inspeccionaron.');
    if(rechazada>0 && !observaciones && !defecto) fail(400,'Describe el defecto de las unidades rechazadas.');
    await db.transaction(async tx=>{
      const {o,d}=await lineaDeOrden(tx,req.params.id,detalleId,['En proceso','En calidad']);
      const pendiente=Number(d.cantidad_producida)-Number(d.aprobada)-Number(d.rechazada);
      if(aprobada+rechazada>pendiente) fail(409,`Solo hay ${pendiente} unidades producidas pendientes de inspección.`);
      await tx.query('INSERT INTO control_calidad(orden_detalle_id,revisada,aprobada,rechazada,observaciones,defecto,inspector_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[d.id,aprobada+rechazada,aprobada,rechazada,observaciones,defecto,req.user.id]);
      await tx.query('UPDATE orden_produccion_detalles SET aprobada=aprobada+$1,rechazada=rechazada+$2 WHERE id=$3',[aprobada,rechazada,d.id]);
      await tx.query("UPDATE ordenes_produccion SET estado='En calidad',etapa='Control de calidad',version=version+1 WHERE id=$1",[o.id]);
      await audit(tx,req.user,'control de calidad','ordenes-produccion',o.id);
    });
    res.status(201).json({data:await unaOrden(db,req.params.id)});
  }));
  r.get('/produccion/calidad',asyncRoute(async(req,res)=>{
    leer(req);
    const q=await db.query(`SELECT c.*,d.orden_id,pr.nombre AS producto,u.nombre AS inspector FROM control_calidad c JOIN orden_produccion_detalles d ON d.id=c.orden_detalle_id JOIN productos pr ON pr.id=d.producto_id JOIN usuarios u ON u.id=c.inspector_id ORDER BY c.fecha DESC LIMIT 500`);
    res.json({data:q.rows.map(x=>({id:Number(x.id),ordenId:x.orden_id,producto:x.producto,revisada:Number(x.revisada),aprobada:Number(x.aprobada),rechazada:Number(x.rechazada),defecto:x.defecto,observaciones:x.observaciones,inspector:x.inspector,fecha:x.fecha}))});
  }));
  // Cierre: solo ingresa al inventario lo aprobado en calidad (RF-17 / regla del documento), con un lote por producto;
  // registra sobrantes devueltos y calcula consumo teórico vs. real y desperdicio por material.
  r.post('/produccion/ordenes/:id/cerrar',asyncRoute(async(req,res)=>{
    escribir(req);const b=req.body||{};
    const devoluciones=Array.isArray(b.devoluciones)?b.devoluciones.filter(x=>Number(x.cantidad)>0).map(x=>({materialId:entero(x.materialId,'material'),cantidad:numero(x.cantidad,'cantidad',{positivo:true})})):[];
    await db.transaction(async tx=>{
      const o=(await tx.query('SELECT * FROM ordenes_produccion WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0]; if(!o) fail(404,'Orden no encontrada.');
      if(!['En proceso','En calidad'].includes(o.estado)) fail(409,'Solo se cierra una orden en proceso o en control de calidad.');
      const det=(await tx.query('SELECT d.*,p.codigo FROM orden_produccion_detalles d JOIN productos p ON p.id=d.producto_id WHERE d.orden_id=$1 ORDER BY d.id',[o.id])).rows;
      if(det.every(d=>Number(d.aprobada)+Number(d.rechazada)===0)) fail(409,'No se puede cerrar sin control de calidad: inspecciona lo producido.');
      const sinInspeccion=det.filter(d=>Number(d.cantidad_producida)!==Number(d.aprobada)+Number(d.rechazada));
      if(sinInspeccion.length) fail(409,`Hay unidades producidas sin inspeccionar (${sinInspeccion.map(d=>d.codigo).join(', ')}).`);
      const destino=await almacenId(tx,b.almacenDestinoId||o.almacen_destino_id,ALMACEN.TALLER);
      for(const d of det){ if(Number(d.aprobada)<=0) continue;
        const lote=await crearLote(tx,{productoId:Number(d.producto_id),origen:'Producción',referencia:o.id,prefijo:'LP'});
        await moverStock(tx,{almacenId:destino,productoId:Number(d.producto_id),loteId:lote.id,cantidad:Number(d.aprobada),tipo:'Ingreso de producción',referencia:o.id,motivo:'Producto aprobado en control de calidad',usuarioId:req.user.id});
        await tx.query('UPDATE orden_produccion_detalles SET lote_id=$1 WHERE id=$2',[lote.id,d.id]);
      }
      // Entregado por material (todas las requisiciones entregadas de la orden).
      const ent=(await tx.query("SELECT rd.material_id,SUM(rd.cantidad_entregada) AS e,SUM(rd.cantidad_devuelta) AS dv FROM requisicion_detalles rd JOIN requisiciones_material q ON q.id=rd.requisicion_id WHERE q.orden_id=$1 AND q.estado='Entregada' GROUP BY rd.material_id",[o.id])).rows;
      const entregado=new Map(ent.map(x=>[Number(x.material_id),{e:new Decimal(x.e),dv:new Decimal(x.dv)}]));
      const almMat=await almacenId(tx,o.almacen_materiales_id,ALMACEN.TALLER);
      for(const dv of devoluciones){
        const m=entregado.get(dv.materialId); if(!m) fail(400,'Solo se devuelven materiales entregados a la orden.');
        if(m.dv.plus(dv.cantidad).greaterThan(m.e)) fail(409,'La devolución supera lo entregado a la orden.');
        await moverStock(tx,{almacenId:almMat,materialId:dv.materialId,cantidad:dv.cantidad,tipo:'Devolución de producción',referencia:o.id,motivo:'Sobrante devuelto al cierre',usuarioId:req.user.id});
        await tx.query("INSERT INTO produccion_consumos(orden_id,material_id,cantidad,usuario_id,tipo) VALUES($1,$2,$3,$4,'Devolución')",[o.id,dv.materialId,dv.cantidad,req.user.id]);
        // Registra la devolución en las líneas de requisición entregadas, en orden.
        let pend=new Decimal(dv.cantidad);
        for(const l of (await tx.query("SELECT rd.id,rd.cantidad_entregada,rd.cantidad_devuelta FROM requisicion_detalles rd JOIN requisiciones_material q ON q.id=rd.requisicion_id WHERE q.orden_id=$1 AND q.estado='Entregada' AND rd.material_id=$2 ORDER BY rd.id",[o.id,dv.materialId])).rows){
          if(pend.isZero()) break; const cabe=Decimal.min(pend,new Decimal(l.cantidad_entregada).minus(l.cantidad_devuelta));
          if(cabe.isPositive()){await tx.query('UPDATE requisicion_detalles SET cantidad_devuelta=cantidad_devuelta+$1 WHERE id=$2',[cabe.toFixed(3),l.id]);pend=pend.minus(cabe);}
        }
        m.dv=m.dv.plus(dv.cantidad);
      }
      // Teórico = ficha × unidades realmente producidas (aprobadas + rechazadas).
      const teorico=new Map();
      for(const d of det){const prod=Number(d.aprobada)+Number(d.rechazada); if(prod>0) await explotar(tx,d.ficha_id,prod,{acumulado:teorico});}
      const materiales=new Set([...entregado.keys(),...teorico.keys()]);
      await tx.query('DELETE FROM produccion_resumen_materiales WHERE orden_id=$1',[o.id]);
      for(const mid of materiales){
        const e=entregado.get(mid)||{e:new Decimal(0),dv:new Decimal(0)}, t=teorico.get(mid)?.cantidad||new Decimal(0), real=e.e.minus(e.dv);
        const costo=(await tx.query('SELECT costo FROM materiales WHERE id=$1',[mid])).rows[0].costo;
        await tx.query('INSERT INTO produccion_resumen_materiales(orden_id,material_id,teorico,entregado,devuelto,consumo_real,desperdicio,costo_unitario) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
          [o.id,mid,t.toFixed(3),e.e.toFixed(3),e.dv.toFixed(3),real.toFixed(3),Decimal.max(0,real.minus(t)).toFixed(3),costo]);
      }
      await transicion(tx,'ordenes_produccion',o.id,['En proceso','En calidad'],'Cerrada',",fecha_cierre=now(),progreso=100,etapa='Finalizada',almacen_destino_id=$4",[destino]);
      await audit(tx,req.user,'cerrar','ordenes-produccion',o.id);
    });
    res.json({data:await unaOrden(db,req.params.id)});
  }));
  return r;
}
