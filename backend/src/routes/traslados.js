import {Router} from 'express';
import Decimal from 'decimal.js';
import {asyncRoute,fail,audit,dateValue,entero,numero,texto,fecha,uno,transicion} from '../http.js';
import {exigir,distinto} from '../permisos.js';
import {moverStock,salidaFIFO} from '../stock.js';
// RF-22, RF-28..RF-31 y observaciones del docente: formulario formal de traslado, varios motivos, estados,
// revisión y autorización por personas distintas, salida en origen al despachar, entrada en destino al recibir
// (con diferencias justificadas) y evidencias adjuntas.
export const MOTIVOS=['Reabastecimiento de tienda','Devolución a taller','Producto defectuoso','Reubicación','Exhibición o evento','Otro'];
const MAX_EVIDENCIA=2*1024*1024;
const FIRMAS={'image/png':'89504e47','image/jpeg':'ffd8ff','application/pdf':'25504446'};
export default function traslados(db){
  const r=Router();
  const n=v=>v===null||v===undefined?null:Number(v);
  async function lista(tx,where='',p=[]){
    const head=(await tx.query(`SELECT t.*,ao.nombre AS origen,ad.nombre AS destino,ue.nombre AS elaborado,ur.nombre AS revisado,ua.nombre AS autorizado,ud.nombre AS despachado,urc.nombre AS recibido,
      (SELECT COUNT(*) FROM traslado_evidencias e WHERE e.traslado_id=t.id) AS evidencias
      FROM traslados t JOIN almacenes ao ON ao.id=t.origen_id JOIN almacenes ad ON ad.id=t.destino_id JOIN usuarios ue ON ue.id=t.elaborado_por
      LEFT JOIN usuarios ur ON ur.id=t.revisado_por LEFT JOIN usuarios ua ON ua.id=t.autorizado_por LEFT JOIN usuarios ud ON ud.id=t.despachado_por LEFT JOIN usuarios urc ON urc.id=t.recibido_por
      ${where} ORDER BY t.fecha DESC,t.id DESC`,p)).rows;
    if(!head.length) return [];
    const det=(await tx.query(`SELECT d.*,COALESCE(p.nombre,m.nombre) AS articulo,COALESCE(p.codigo,m.codigo) AS codigo,COALESCE(m.unidad,p.unidad) AS unidad,l.codigo AS lote,
      (SELECT string_agg(COALESCE(l2.codigo,'sin lote')||': '||(x.cantidad::float8)::text,', ') FROM traslado_despachos x LEFT JOIN lotes l2 ON l2.id=x.lote_id WHERE x.traslado_detalle_id=d.id) AS lotes_despachados
      FROM traslado_detalles d LEFT JOIN productos p ON p.id=d.producto_id LEFT JOIN materiales m ON m.id=d.material_id LEFT JOIN lotes l ON l.id=d.lote_id WHERE d.traslado_id=ANY($1) ORDER BY d.id`,[head.map(h=>h.id)])).rows;
    return head.map(t=>{const detalles=det.filter(d=>d.traslado_id===t.id).map(d=>({id:Number(d.id),productoId:n(d.producto_id),materialId:n(d.material_id),articulo:d.articulo,codigo:d.codigo,unidad:d.unidad,clase:d.producto_id?'Producto':'Material',loteId:n(d.lote_id),lote:d.lote,lotesDespachados:d.lotes_despachados,cantidad:Number(d.cantidad),recibida:d.cantidad_recibida===null?null:Number(d.cantidad_recibida),diferencia:d.cantidad_recibida===null?null:Number(new Decimal(d.cantidad).minus(d.cantidad_recibida)),diferenciaMotivo:d.diferencia_motivo}));
      return {id:t.id,fecha:dateValue(t.fecha),fechaRequerida:dateValue(t.fecha_requerida),origenId:Number(t.origen_id),origen:t.origen,destinoId:Number(t.destino_id),destino:t.destino,motivo:t.motivo,estado:t.estado,observaciones:t.observaciones,canceladoMotivo:t.cancelado_motivo,
        elaboradoPor:t.elaborado,elaboradoPorId:Number(t.elaborado_por),elaboradoEn:t.elaborado_en,revisadoPor:t.revisado,revisadoEn:t.revisado_en,autorizadoPor:t.autorizado,autorizadoEn:t.autorizado_en,despachadoPor:t.despachado,despachadoEn:t.despachado_en,recibidoPor:t.recibido,recibidoEn:t.recibido_en,
        evidencias:Number(t.evidencias),_version:Number(t.version),detalles,totalEnviado:detalles.reduce((s,d)=>s+d.cantidad,0),totalRecibido:detalles.reduce((s,d)=>s+(d.recibida||0),0)};});
  }
  const uno_=async(tx,id)=>{const t=(await lista(tx,'WHERE t.id=$1',[id]))[0]; if(!t) fail(404,'Traslado no encontrado.'); return t;};
  async function datos(tx,b){
    const d={origenId:entero(b.origenId,'almacén de origen'),destinoId:entero(b.destinoId,'almacén de destino'),motivo:uno(b.motivo,MOTIVOS,'motivo'),observaciones:texto(b.observaciones,'observaciones',{max:1000}),fechaRequerida:fecha(b.fechaRequerida,'fecha requerida')};
    if(d.origenId===d.destinoId) fail(400,'El origen y el destino deben ser almacenes distintos.');
    if(d.motivo==='Otro' && !d.observaciones) fail(400,'Describe el motivo del traslado en las observaciones.');
    for(const a of [d.origenId,d.destinoId]){const x=(await tx.query('SELECT activo FROM almacenes WHERE id=$1',[a])).rows[0]; if(!x) fail(400,'El almacén no existe.'); if(!x.activo) fail(409,'El almacén está inactivo.');}
    if(!Array.isArray(b.detalles)||!b.detalles.length||b.detalles.length>100) fail(400,'El traslado debe incluir entre 1 y 100 líneas.');
    const seen=new Set(); d.detalles=[];
    for(const x of b.detalles){
      const prod=entero(x.productoId,'producto',{opcional:true}),mat=entero(x.materialId,'material',{opcional:true}),lote=entero(x.loteId,'lote',{opcional:true});
      if((prod?1:0)+(mat?1:0)!==1) fail(400,'Cada línea debe indicar un producto o un material.');
      const key=`${prod||0}-${mat||0}-${lote||0}`; if(seen.has(key)) fail(400,'No repitas la misma línea.'); seen.add(key);
      const cantidad=numero(x.cantidad,'cantidad',{positivo:true}); if(prod && !Number.isInteger(cantidad)) fail(400,'Los productos se trasladan en unidades enteras.');
      // RF: un traslado no puede superar la existencia disponible en el origen.
      const disp=(await tx.query(`SELECT COALESCE(SUM(cantidad),0) AS s FROM existencias WHERE almacen_id=$1 AND ${prod?'producto_id':'material_id'}=$2 ${lote?'AND lote_id=$3':''}`,lote?[d.origenId,prod||mat,lote]:[d.origenId,prod||mat])).rows[0].s;
      if(new Decimal(disp).lessThan(cantidad)) fail(409,`La cantidad supera la existencia disponible en el origen (${disp}).`);
      d.detalles.push({productoId:prod,materialId:mat,loteId:lote,cantidad});
    }
    return d;
  }
  async function guardarDetalle(tx,id,d){
    await tx.query('DELETE FROM traslado_detalles WHERE traslado_id=$1',[id]);
    for(const x of d.detalles) await tx.query('INSERT INTO traslado_detalles(traslado_id,producto_id,material_id,lote_id,cantidad) VALUES($1,$2,$3,$4,$5)',[id,x.productoId,x.materialId,x.loteId,x.cantidad]);
  }
  r.get('/traslados',asyncRoute(async(req,res)=>{exigir(req.user,'traslados','leer');res.json({data:await lista(db)})}));
  r.get('/traslados/motivos',(req,res)=>res.json({data:MOTIVOS}));
  r.get('/traslados/:id',asyncRoute(async(req,res)=>{exigir(req.user,'traslados','leer');res.json({data:await uno_(db,req.params.id)})}));
  r.post('/traslados',asyncRoute(async(req,res)=>{
    exigir(req.user,'traslados','escribir');
    const id=await db.transaction(async tx=>{const d=await datos(tx,req.body||{});
      const v=(await tx.query("SELECT nextval('traslado_seq') AS n")).rows[0].n, id=`TR-${new Date().getFullYear()}-${String(v).padStart(4,'0')}`;
      await tx.query('INSERT INTO traslados(id,origen_id,destino_id,motivo,observaciones,fecha_requerida,elaborado_por) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,d.origenId,d.destinoId,d.motivo,d.observaciones,d.fechaRequerida,req.user.id]);
      await guardarDetalle(tx,id,d); await audit(tx,req.user,'crear','traslados',id); return id;});
    res.status(201).json({data:await uno_(db,id)});
  }));
  r.put('/traslados/:id',asyncRoute(async(req,res)=>{
    exigir(req.user,'traslados','escribir');
    await db.transaction(async tx=>{
      const t=(await tx.query('SELECT estado,version FROM traslados WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0]; if(!t) fail(404,'Traslado no encontrado.');
      if(t.estado!=='Borrador') fail(409,'Solo se edita un traslado en borrador.'); if(Number(t.version)!==entero(req.body?._version,'_version')) fail(409,'El traslado cambió. Vuelve a cargar la página.');
      const d=await datos(tx,req.body||{});
      await tx.query('UPDATE traslados SET origen_id=$1,destino_id=$2,motivo=$3,observaciones=$4,fecha_requerida=$5,version=version+1 WHERE id=$6',[d.origenId,d.destinoId,d.motivo,d.observaciones,d.fechaRequerida,req.params.id]);
      await guardarDetalle(tx,req.params.id,d); await audit(tx,req.user,'editar','traslados',req.params.id);
    });
    res.json({data:await uno_(db,req.params.id)});
  }));
  r.patch('/traslados/:id/:accion',asyncRoute(async(req,res)=>{
    const accion=uno(req.params.accion,['revisar','devolver','autorizar','despachar','recibir','cancelar'],'acción');
    exigir(req.user,'traslados','escribir');
    await db.transaction(async tx=>{
      const t=(await tx.query('SELECT * FROM traslados WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0]; if(!t) fail(404,'Traslado no encontrado.');
      if(accion==='revisar'){distinto(req.user,t.elaborado_por,'revisar');await transicion(tx,'traslados',t.id,['Borrador'],'Revisado',',revisado_por=$4,revisado_en=now()',[req.user.id]);}
      if(accion==='devolver') await transicion(tx,'traslados',t.id,['Revisado'],'Borrador',',revisado_por=NULL,revisado_en=NULL');
      if(accion==='autorizar'){
        if(!['admin','inventario'].includes(req.user.role)) fail(403,'Solo gerencia o el responsable de inventario autorizan traslados.');
        distinto(req.user,t.elaborado_por,'autorizar');
        await transicion(tx,'traslados',t.id,['Revisado'],'Autorizado',',autorizado_por=$4,autorizado_en=now()',[req.user.id]);}
      if(accion==='cancelar'){const motivo=texto(req.body?.motivo,'motivo de cancelación',{requerido:true,max:500});
        await transicion(tx,'traslados',t.id,['Borrador','Revisado','Autorizado'],'Cancelado',',cancelado_motivo=$4',[motivo]);}
      if(accion==='despachar'){ // salida del origen; el cambio de estado atómico impide despachar dos veces
        await transicion(tx,'traslados',t.id,['Autorizado'],'En tránsito',',despachado_por=$4,despachado_en=now()',[req.user.id]);
        for(const d of (await tx.query('SELECT * FROM traslado_detalles WHERE traslado_id=$1 ORDER BY id',[t.id])).rows){
          const partes=await salidaFIFO(tx,{almacenId:Number(t.origen_id),productoId:n(d.producto_id),materialId:n(d.material_id),loteId:n(d.lote_id),cantidad:d.cantidad,tipo:'Traslado salida',referencia:t.id,motivo:t.motivo,usuarioId:req.user.id});
          for(const p of partes) await tx.query('INSERT INTO traslado_despachos(traslado_detalle_id,lote_id,cantidad) VALUES($1,$2,$3)',[d.id,p.loteId,p.cantidad]);
        }}
      if(accion==='recibir'){ // entrada en destino por la cantidad recibida, conservando los lotes despachados
        const recibidos=Array.isArray(req.body?.detalles)?req.body.detalles:fail(400,'Indica las cantidades recibidas.');
        const lineas=(await tx.query('SELECT * FROM traslado_detalles WHERE traslado_id=$1 ORDER BY id',[t.id])).rows;
        let diferencias=false;
        for(const d of lineas){
          const x=recibidos.find(z=>Number(z.id)===Number(d.id)); if(!x) fail(400,'Indica la cantidad recibida de cada línea.');
          const rec=numero(x.recibida,'cantidad recibida'); if(new Decimal(rec).greaterThan(d.cantidad)) fail(400,'No se puede recibir más de lo despachado.');
          if(d.producto_id && !Number.isInteger(rec)) fail(400,'Los productos se reciben en unidades enteras.');
          const motivo=texto(x.motivo,'motivo de la diferencia',{max:500});
          if(!new Decimal(rec).equals(d.cantidad)){diferencias=true; if(!motivo) fail(400,'Explica el motivo de cada diferencia entre lo enviado y lo recibido.');}
          let pend=new Decimal(rec);
          for(const p of (await tx.query('SELECT * FROM traslado_despachos WHERE traslado_detalle_id=$1 ORDER BY id',[d.id])).rows){
            if(pend.isZero()) break; const toma=Decimal.min(pend,p.cantidad);
            await moverStock(tx,{almacenId:Number(t.destino_id),productoId:n(d.producto_id),materialId:n(d.material_id),loteId:n(p.lote_id),cantidad:toma,tipo:'Traslado entrada',referencia:t.id,motivo:t.motivo,usuarioId:req.user.id});
            await tx.query('UPDATE traslado_despachos SET recibido=$1 WHERE id=$2',[toma.toFixed(3),p.id]); pend=pend.minus(toma);
          }
          await tx.query('UPDATE traslado_detalles SET cantidad_recibida=$1,diferencia_motivo=$2 WHERE id=$3',[rec,motivo,d.id]);
        }
        await transicion(tx,'traslados',t.id,['En tránsito'],diferencias?'Recibido con diferencias':'Recibido',',recibido_por=$4,recibido_en=now()',[req.user.id]);
      }
      await audit(tx,req.user,accion,'traslados',t.id);
    });
    res.json({data:await uno_(db,req.params.id)});
  }));
  // Evidencias (fotografías o PDF) del traslado: se validan tipo, firma del archivo y tamaño.
  r.get('/traslados/:id/evidencias',asyncRoute(async(req,res)=>{
    exigir(req.user,'traslados','leer');
    const q=await db.query('SELECT e.id,e.etapa,e.nombre,e.tipo,e.tamano,e.descripcion,e.fecha,u.nombre AS usuario FROM traslado_evidencias e JOIN usuarios u ON u.id=e.subido_por WHERE e.traslado_id=$1 ORDER BY e.fecha',[req.params.id]);
    res.json({data:q.rows.map(x=>({...x,id:Number(x.id),tamano:Number(x.tamano)}))});
  }));
  r.post('/traslados/:id/evidencias',asyncRoute(async(req,res)=>{
    exigir(req.user,'traslados','escribir');const b=req.body||{};
    const etapa=uno(b.etapa||'Otro',['Preparación','Despacho','Recepción','Otro'],'etapa'), tipo=uno(b.tipo,Object.keys(FIRMAS),'tipo de archivo');
    const nombre=texto(b.nombre,'nombre',{requerido:true,max:150}).replace(/[^\w.\- áéíóúñÁÉÍÓÚÑ()]/g,'_'), descripcion=texto(b.descripcion,'descripción',{max:300});
    if(typeof b.contenido!=='string' || !/^[A-Za-z0-9+/=\s]+$/.test(b.contenido)) fail(400,'El archivo no es válido.');
    const buf=Buffer.from(b.contenido,'base64');
    if(!buf.length) fail(400,'El archivo está vacío.'); if(buf.length>MAX_EVIDENCIA) fail(400,'La evidencia no puede superar 2 MB.');
    if(!buf.subarray(0,4).toString('hex').startsWith(FIRMAS[tipo])) fail(400,'El contenido no corresponde al tipo de archivo indicado.');
    const id=await db.transaction(async tx=>{
      const t=(await tx.query('SELECT estado FROM traslados WHERE id=$1',[req.params.id])).rows[0]; if(!t) fail(404,'Traslado no encontrado.');
      if(t.estado==='Cancelado') fail(409,'No se agregan evidencias a un traslado cancelado.');
      const q=await tx.query('INSERT INTO traslado_evidencias(traslado_id,etapa,nombre,tipo,tamano,contenido,descripcion,subido_por) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',[req.params.id,etapa,nombre,tipo,buf.length,buf,descripcion,req.user.id]);
      await audit(tx,req.user,'adjuntar evidencia','traslados',req.params.id); return Number(q.rows[0].id);
    });
    res.status(201).json({data:{id}});
  }));
  r.get('/traslados/evidencias/:eid',asyncRoute(async(req,res)=>{
    exigir(req.user,'traslados','leer');
    const e=(await db.query('SELECT nombre,tipo,contenido FROM traslado_evidencias WHERE id=$1',[entero(req.params.eid,'evidencia')])).rows[0]; if(!e) fail(404,'Evidencia no encontrada.');
    res.set('Content-Type',e.tipo).set('Content-Disposition',`inline; filename="${encodeURIComponent(e.nombre)}"`).set('X-Content-Type-Options','nosniff').send(Buffer.from(e.contenido));
  }));
  return r;
}
