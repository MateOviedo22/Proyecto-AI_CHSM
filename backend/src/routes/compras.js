import {Router} from 'express';
import Decimal from 'decimal.js';
import {asyncRoute,fail,audit,dateValue,entero,numero,texto,fecha,uno,transicion} from '../http.js';
import {exigir} from '../permisos.js';
import {moverStock,almacenId,crearLote,ALMACEN} from '../stock.js';
const code=prefix=>`${prefix}-${Date.now()}-${Math.floor(Math.random()*100000)}`;
// FRQ-0009: solicitudes, órdenes de compra con varias líneas, recepción por línea con lote y almacén,
// devoluciones a proveedor e historial de cumplimiento (SLA). El módulo está protegido con guard('compras').
export default function compras(db){
  const r=Router();
  r.get('/compras',asyncRoute(async(req,res)=>{
    const solicitudes=(await db.query(`SELECT s.id,s.fecha,s.solicitante,s.area,s.material_id,m.nombre AS producto,s.cantidad,s.unidad,s.prioridad,s.estado,s.observaciones AS justificacion
      FROM solicitudes_compra s JOIN materiales m ON m.id=s.material_id ORDER BY s.fecha DESC,s.id DESC`)).rows;
    const ordenes=(await db.query(`SELECT o.id,d.id AS detalle_id,o.solicitud_id,o.fecha,o.fecha_entrega,o.estado,o.observaciones,p.nombre AS proveedor,p.id AS proveedor_id,m.nombre AS producto,m.unidad,m.id AS material_id,d.cantidad,d.precio,
      COALESCE((SELECT SUM(r.cantidad) FROM recepciones_compra r WHERE r.orden_detalle_id=d.id),0) AS recibido,
      (SELECT COUNT(*) FROM orden_compra_detalles x WHERE x.orden_id=o.id) AS lineas
      FROM ordenes_compra o JOIN proveedores p ON p.id=o.proveedor_id JOIN orden_compra_detalles d ON d.orden_id=o.id JOIN materiales m ON m.id=d.material_id ORDER BY o.fecha DESC,o.id DESC,d.id`)).rows;
    const recepciones=(await db.query(`SELECT r.id,r.fecha,r.cantidad,r.documento,r.observaciones,o.id AS orden_id,d.id AS detalle_id,m.id AS material_id,m.nombre AS producto,m.unidad,p.nombre AS proveedor,p.id AS proveedor_id,a.nombre AS almacen,r.almacen_id,l.codigo AS lote,
      COALESCE((SELECT SUM(dv.cantidad) FROM devoluciones_compra dv WHERE dv.recepcion_id=r.id AND dv.estado<>'Cancelada'),0) AS devuelto
      FROM recepciones_compra r JOIN orden_compra_detalles d ON d.id=r.orden_detalle_id JOIN ordenes_compra o ON o.id=d.orden_id
      JOIN proveedores p ON p.id=o.proveedor_id JOIN materiales m ON m.id=d.material_id LEFT JOIN almacenes a ON a.id=r.almacen_id LEFT JOIN lotes l ON l.id=r.lote_id ORDER BY r.fecha DESC`)).rows;
    res.json({data:{solicitudes:solicitudes.map(x=>({...x,fecha:dateValue(x.fecha),cantidad:Number(x.cantidad),material_id:Number(x.material_id)})),
      ordenes:ordenes.map(x=>({...x,detalle_id:Number(x.detalle_id),material_id:Number(x.material_id),proveedor_id:Number(x.proveedor_id),lineas:Number(x.lineas),fecha:dateValue(x.fecha),fecha_entrega:dateValue(x.fecha_entrega),cantidad:Number(x.cantidad),precio:Number(x.precio),recibido:Number(x.recibido),pendiente:Number(new Decimal(x.cantidad).minus(x.recibido)),total:Number(new Decimal(x.cantidad).times(x.precio))})),
      recepciones:recepciones.map(x=>({...x,id:Number(x.id),detalle_id:Number(x.detalle_id),material_id:Number(x.material_id),proveedor_id:Number(x.proveedor_id),almacen_id:x.almacen_id===null?null:Number(x.almacen_id),cantidad:Number(x.cantidad),devuelto:Number(x.devuelto)}))}});
  }));
  r.post('/compras/solicitudes',asyncRoute(async(req,res)=>{
    const {materialId,cantidad,solicitante,area='',prioridad='Media',justificacion=''}=req.body||{};
    if(!Number.isSafeInteger(Number(materialId))||Number(materialId)<=0||!Number.isFinite(Number(cantidad))||Number(cantidad)<=0||typeof solicitante!=='string'||!solicitante.trim()||solicitante.length>200||typeof area!=='string'||area.length>200||!['Alta','Media','Baja'].includes(prioridad)||typeof justificacion!=='string'||justificacion.length>1000) fail(400,'Revisa los datos de la solicitud.');
    const id=code('SOL');
    await db.transaction(async tx=>{
      const mat=(await tx.query('SELECT unidad FROM materiales WHERE id=$1',[Number(materialId)])).rows[0];if(!mat) fail(400,'El material no existe.');
      await tx.query('INSERT INTO solicitudes_compra(id,material_id,solicitante,cantidad,area,unidad,prioridad,observaciones) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,Number(materialId),solicitante.trim(),Number(cantidad),area,mat.unidad,prioridad,justificacion]);await audit(tx,req.user,'crear','solicitudes-compra',id);
    });res.status(201).json({data:{id}});
  }));
  r.patch('/compras/solicitudes/:id/estado',asyncRoute(async(req,res)=>{
    const estado=req.body?.estado;if(!['Aprobada','Rechazada'].includes(estado)) fail(400,'Estado inválido.');
    await db.transaction(async tx=>{
      const q=await tx.query("UPDATE solicitudes_compra SET estado=$1 WHERE id=$2 AND estado='Pendiente' RETURNING id",[estado,req.params.id]);if(!q.rows.length) fail(409,'La solicitud ya no está pendiente o no existe.');await audit(tx,req.user,'cambiar estado','solicitudes-compra',req.params.id);
    });res.json({data:{id:req.params.id,estado}});
  }));
  // Orden de compra con una o varias líneas; acepta el formato anterior de una sola línea.
  r.post('/compras/ordenes',asyncRoute(async(req,res)=>{
    const b=req.body||{};
    const supplier=entero(b.proveedorId,'proveedor'), fechaEntrega=fecha(b.fechaEntrega,'fecha de entrega'), solicitudId=b.solicitudId||null, observaciones=texto(b.observaciones,'observaciones',{max:1000});
    const raw=Array.isArray(b.lineas)?b.lineas:[{materialId:b.materialId,cantidad:b.cantidad,precio:b.precio}];
    if(!raw.length||raw.length>50) fail(400,'La orden debe tener entre 1 y 50 líneas.');
    const seen=new Set();
    const lineas=raw.map(l=>{ if(l.precio===''||l.precio===null||l.precio===undefined) fail(400,'Indica el precio unitario.');
      const m=entero(l.materialId,'material'); if(seen.has(m)) fail(400,'No repitas un material en la orden.'); seen.add(m);
      return {materialId:m,cantidad:numero(l.cantidad,'cantidad',{positivo:true}),precio:numero(l.precio,'precio')};});
    const id=code('OC');
    await db.transaction(async tx=>{
      if(!(await tx.query("SELECT id FROM proveedores WHERE id=$1 AND estado='Activo'",[supplier])).rows.length) fail(400,'El proveedor no existe o está inactivo.');
      for(const l of lineas) if(!(await tx.query('SELECT id FROM materiales WHERE id=$1',[l.materialId])).rows.length) fail(400,'El material no existe.');
      if(solicitudId){
        const sol=(await tx.query('SELECT estado,material_id FROM solicitudes_compra WHERE id=$1 FOR UPDATE',[solicitudId])).rows[0];
        if(!sol || sol.estado!=='Aprobada' || !seen.has(Number(sol.material_id))) fail(409,'La solicitud debe estar aprobada y corresponder al material.');
        await tx.query("UPDATE solicitudes_compra SET estado='Orden generada' WHERE id=$1",[solicitudId]);
      }
      await tx.query('INSERT INTO ordenes_compra(id,solicitud_id,proveedor_id,fecha_entrega,usuario_id,observaciones) VALUES($1,$2,$3,$4,$5,$6)',[id,solicitudId,supplier,fechaEntrega,req.user.id,observaciones]);
      for(const l of lineas) await tx.query('INSERT INTO orden_compra_detalles(orden_id,material_id,cantidad,precio) VALUES($1,$2,$3,$4)',[id,l.materialId,l.cantidad,l.precio]);
      await audit(tx,req.user,'crear','ordenes-compra',id);
    });res.status(201).json({data:{id}});
  }));
  r.patch('/compras/ordenes/:id/estado',asyncRoute(async(req,res)=>{
    const estado=req.body?.estado;if(!['Enviada','Cancelada'].includes(estado)) fail(400,'Estado inválido.');
    await db.transaction(async tx=>{
      const o=(await tx.query('SELECT estado,solicitud_id FROM ordenes_compra WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];if(!o) fail(404,'Orden inexistente.');
      if((estado==='Enviada' && o.estado!=='Borrador')||(estado==='Cancelada' && !['Borrador','Enviada'].includes(o.estado))) fail(409,'Esta orden no admite ese cambio de estado.');
      await tx.query('UPDATE ordenes_compra SET estado=$1,version=version+1 WHERE id=$2',[estado,req.params.id]);
      if(estado==='Cancelada' && o.solicitud_id) await tx.query("UPDATE solicitudes_compra SET estado='Aprobada' WHERE id=$1",[o.solicitud_id]);await audit(tx,req.user,'cambiar estado','ordenes-compra',req.params.id);
    });res.json({data:{id:req.params.id,estado}});
  }));
  // Recepción por línea: crea un lote, ingresa al almacén elegido (Taller por defecto) y recalcula el costo promedio.
  r.post('/compras/recepciones',asyncRoute(async(req,res)=>{
    const b=req.body||{}; const ordenId=texto(b.ordenId,'orden',{requerido:true,max:80}), qty=numero(b.cantidad,'cantidad',{positivo:true});
    const documento=texto(b.documento,'documento'), observaciones=texto(b.observaciones,'observaciones',{max:1000}), loteCodigo=texto(b.lote,'lote',{max:60}), vencimiento=fecha(b.vencimiento,'vencimiento');
    const out=await db.transaction(async tx=>{
      const o=(await tx.query('SELECT id,estado FROM ordenes_compra WHERE id=$1 FOR UPDATE',[ordenId])).rows[0];
      if(!o||!['Enviada','Parcial'].includes(o.estado)) fail(409,'La orden no permite recibir mercancía.');
      const lineas=(await tx.query('SELECT * FROM orden_compra_detalles WHERE orden_id=$1 ORDER BY id',[ordenId])).rows;
      let d; if(b.ordenDetalleId) d=lineas.find(x=>Number(x.id)===Number(b.ordenDetalleId)); else if(lineas.length===1) d=lineas[0]; else fail(400,'Indica la línea de la orden que se recibe.');
      if(!d) fail(400,'La línea no pertenece a la orden.');
      const received=Number((await tx.query('SELECT COALESCE(SUM(cantidad),0) AS n FROM recepciones_compra WHERE orden_detalle_id=$1',[d.id])).rows[0].n);
      if(new Decimal(received).plus(qty).greaterThan(d.cantidad)) fail(409,'La cantidad supera lo pendiente de recepción.');
      const m=(await tx.query('SELECT * FROM materiales WHERE id=$1 FOR UPDATE',[d.material_id])).rows[0];
      const balance=new Decimal(m.existencia).plus(qty), avg=new Decimal(m.existencia).times(m.costo).plus(new Decimal(qty).times(d.precio)).div(balance).toDecimalPlaces(2);
      const almacen=await almacenId(tx,b.almacenId,ALMACEN.TALLER);
      const lote=await crearLote(tx,{materialId:Number(m.id),origen:'Compra',referencia:ordenId,codigo:loteCodigo,vencimiento,prefijo:'LC'});
      const rec=await tx.query('INSERT INTO recepciones_compra(orden_detalle_id,cantidad,documento,observaciones,usuario_id,almacen_id,lote_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[d.id,qty,documento,observaciones,req.user.id,almacen,lote.id]);
      await tx.query('UPDATE materiales SET costo=$1 WHERE id=$2',[avg.toFixed(2),m.id]);
      await moverStock(tx,{almacenId:almacen,materialId:Number(m.id),loteId:lote.id,cantidad:qty,tipo:'Recepción de compra',referencia:ordenId,usuarioId:req.user.id});
      const pend=(await tx.query('SELECT COUNT(*) AS n FROM orden_compra_detalles x WHERE x.orden_id=$1 AND x.cantidad>COALESCE((SELECT SUM(cantidad) FROM recepciones_compra r WHERE r.orden_detalle_id=x.id),0)',[ordenId])).rows[0].n;
      await tx.query('UPDATE ordenes_compra SET estado=$1,version=version+1 WHERE id=$2',[Number(pend)===0?'Recibida':'Parcial',ordenId]);await audit(tx,req.user,'recibir','ordenes-compra',ordenId);
      return {ordenId,recepcionId:Number(rec.rows[0].id),lote:lote.codigo};
    });res.status(201).json({data:out});
  }));
  // Devoluciones a proveedor: Pendiente -> Enviada (sale el material del lote recibido) -> Acreditada; o Cancelada.
  const DEV=`SELECT dv.*,r.lote_id,l.codigo AS lote,m.id AS material_id,m.nombre AS material,m.unidad,o.id AS orden_id,p.id AS proveedor_id,p.nombre AS proveedor,a.nombre AS almacen,u.nombre AS usuario,d.precio
    FROM devoluciones_compra dv JOIN recepciones_compra r ON r.id=dv.recepcion_id JOIN orden_compra_detalles d ON d.id=r.orden_detalle_id JOIN ordenes_compra o ON o.id=d.orden_id
    JOIN proveedores p ON p.id=o.proveedor_id JOIN materiales m ON m.id=d.material_id LEFT JOIN lotes l ON l.id=r.lote_id LEFT JOIN almacenes a ON a.id=COALESCE(dv.almacen_id,r.almacen_id) LEFT JOIN usuarios u ON u.id=dv.usuario_id`;
  const devRow=x=>({id:Number(x.id),recepcionId:Number(x.recepcion_id),ordenId:x.orden_id,proveedorId:Number(x.proveedor_id),proveedor:x.proveedor,materialId:Number(x.material_id),material:x.material,unidad:x.unidad,lote:x.lote,almacen:x.almacen,cantidad:Number(x.cantidad),monto:Number(new Decimal(x.cantidad).times(x.precio).toDecimalPlaces(2)),motivo:x.motivo,documento:x.documento,estado:x.estado,fecha:x.fecha,enviadaEn:x.enviada_en,acreditadaEn:x.acreditada_en,usuario:x.usuario,_version:Number(x.version)});
  r.get('/compras/devoluciones',asyncRoute(async(req,res)=>res.json({data:(await db.query(DEV+' ORDER BY dv.fecha DESC')).rows.map(devRow)})));
  r.post('/compras/devoluciones',asyncRoute(async(req,res)=>{
    const b=req.body||{}; const recepcionId=entero(b.recepcionId,'recepción'), qty=numero(b.cantidad,'cantidad',{positivo:true});
    const motivo=uno(b.motivo,['Material defectuoso','Cantidad excedente','Material incorrecto','Daño en transporte','Otro'],'motivo'), documento=texto(b.documento,'documento'), detalle=texto(b.detalle,'detalle',{max:1000});
    const id=await db.transaction(async tx=>{
      const rec=(await tx.query('SELECT r.*,d.material_id FROM recepciones_compra r JOIN orden_compra_detalles d ON d.id=r.orden_detalle_id WHERE r.id=$1 FOR UPDATE OF r',[recepcionId])).rows[0];
      if(!rec) fail(404,'Recepción no encontrada.');
      const devuelto=(await tx.query("SELECT COALESCE(SUM(cantidad),0) AS n FROM devoluciones_compra WHERE recepcion_id=$1 AND estado<>'Cancelada'",[recepcionId])).rows[0].n;
      if(new Decimal(devuelto).plus(qty).greaterThan(rec.cantidad)) fail(409,`No puedes devolver más de lo recibido (pendiente de devolver: ${new Decimal(rec.cantidad).minus(devuelto)}).`);
      const q=await tx.query('INSERT INTO devoluciones_compra(recepcion_id,cantidad,motivo,documento,usuario_id,almacen_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[recepcionId,qty,detalle?`${motivo}: ${detalle}`:motivo,documento,req.user.id,rec.almacen_id]);
      await audit(tx,req.user,'crear','devoluciones-compra',q.rows[0].id); return q.rows[0].id;
    });
    res.status(201).json({data:devRow((await db.query(DEV+' WHERE dv.id=$1',[id])).rows[0])});
  }));
  r.patch('/compras/devoluciones/:id/estado',asyncRoute(async(req,res)=>{
    const id=entero(req.params.id,'id'), estado=uno(req.body?.estado,['Enviada','Acreditada','Cancelada'],'estado');
    await db.transaction(async tx=>{
      const desde={Enviada:['Pendiente'],Acreditada:['Enviada'],Cancelada:['Pendiente']}[estado];
      const extra=estado==='Enviada'?',enviada_en=now()':estado==='Acreditada'?',acreditada_en=now()':'';
      const dv=await transicion(tx,'devoluciones_compra',id,desde,estado,extra);
      if(estado==='Enviada'){ // salida física del material devuelto, del mismo lote y almacén de la recepción
        const rec=(await tx.query('SELECT r.lote_id,r.almacen_id,d.material_id,d.orden_id FROM recepciones_compra r JOIN orden_compra_detalles d ON d.id=r.orden_detalle_id WHERE r.id=$1',[dv.recepcion_id])).rows[0];
        const alm=await almacenId(tx,dv.almacen_id||rec.almacen_id,ALMACEN.TALLER);
        await moverStock(tx,{almacenId:alm,materialId:Number(rec.material_id),loteId:rec.lote_id===null?null:Number(rec.lote_id),cantidad:new Decimal(dv.cantidad).negated(),tipo:'Devolución a proveedor',referencia:`DEV-${id} ${rec.orden_id}`,motivo:dv.motivo,usuarioId:req.user.id});
      }
      await audit(tx,req.user,`devolución ${estado.toLowerCase()}`,'devoluciones-compra',id);
    });
    res.json({data:devRow((await db.query(DEV+' WHERE dv.id=$1',[id])).rows[0])});
  }));
  // Historial y desempeño del proveedor: entregas a tiempo (contra la fecha comprometida), montos, devoluciones y reclamos.
  r.get('/proveedores/:id/historial',asyncRoute(async(req,res)=>{
    const id=entero(req.params.id,'id');
    const entregas=(await db.query(`SELECT r.id,r.fecha,r.cantidad,o.id AS orden_id,o.fecha_entrega,m.nombre AS material,
      CASE WHEN o.fecha_entrega IS NULL THEN 'Sin compromiso' WHEN r.fecha::date<=o.fecha_entrega THEN 'A tiempo' ELSE 'Tardía' END AS resultado
      FROM recepciones_compra r JOIN orden_compra_detalles d ON d.id=r.orden_detalle_id JOIN ordenes_compra o ON o.id=d.orden_id JOIN materiales m ON m.id=d.material_id
      WHERE o.proveedor_id=$1 ORDER BY r.fecha DESC`,[id])).rows;
    const monto=(await db.query("SELECT COALESCE(SUM(d.cantidad*d.precio),0) AS t,COUNT(DISTINCT o.id) AS n FROM ordenes_compra o JOIN orden_compra_detalles d ON d.orden_id=o.id WHERE o.proveedor_id=$1 AND o.estado<>'Cancelada'",[id])).rows[0];
    const dev=(await db.query("SELECT COUNT(*) AS n FROM devoluciones_compra dv JOIN recepciones_compra r ON r.id=dv.recepcion_id JOIN orden_compra_detalles d ON d.id=r.orden_detalle_id JOIN ordenes_compra o ON o.id=d.orden_id WHERE o.proveedor_id=$1 AND dv.estado<>'Cancelada'",[id])).rows[0].n;
    const rec=(await db.query('SELECT COUNT(*) AS n FROM reclamos_proveedor WHERE proveedor_id=$1',[id])).rows[0].n;
    const conCompromiso=entregas.filter(e=>e.resultado!=='Sin compromiso'), aTiempo=conCompromiso.filter(e=>e.resultado==='A tiempo').length;
    res.json({data:{resumen:{ordenes:Number(monto.n),recepciones:entregas.length,montoComprado:Number(monto.t),cumplimientoPct:conCompromiso.length?Math.round(aTiempo*1000/conCompromiso.length)/10:null,entregasTardias:conCompromiso.length-aTiempo,devoluciones:Number(dev),reclamos:Number(rec)},
      entregas:entregas.map(e=>({id:Number(e.id),fecha:e.fecha,cantidad:Number(e.cantidad),ordenId:e.orden_id,fechaCompromiso:dateValue(e.fecha_entrega),material:e.material,resultado:e.resultado}))}});
  }));
  return r;
}
