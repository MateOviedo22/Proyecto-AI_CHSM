import {Router} from 'express';
import Decimal from 'decimal.js';
import {asyncRoute,fail,audit,dateValue,entero,texto,uno,transicion} from '../http.js';
import {exigir} from '../permisos.js';
import {moverStock,salidaFIFO,almacenId,ALMACEN} from '../stock.js';
// FRQ-0005, RF-25..RF-27 y observaciones del docente: venta, factura interna numerada (no fiscal),
// facturación de órdenes de venta sin doble cobro, anulación, devoluciones/cambios y disponibilidad.
// Registra una venta completa: valida disponibilidad en el almacén, descuenta stock por lote (FIFO),
// guarda el detalle, el ingreso financiero y la auditoría. Reutilizada por el POS y por la facturación de órdenes.
export async function registrarVenta(tx,user,{cliente='Cliente de mostrador',clienteId=null,metodo='Efectivo',porcentajeDescuento=0,items,almacenId:alm=null,ordenVentaId=null,preciosFijos=null}){
  if(typeof cliente!=='string'||!cliente.trim()||cliente.length>200) fail(400,'Indica un cliente válido.');
  if(!['Efectivo','Transferencia','Tarjeta'].includes(metodo)) fail(400,'Método de pago inválido.');
  if(!Array.isArray(items)||!items.length||items.length>100) fail(400,'Agrega entre 1 y 100 productos.');
  const pct=Number(porcentajeDescuento); if(!Number.isFinite(pct)||pct<0||pct>100) fail(400,'El descuento debe estar entre 0 y 100.');
  const ids=new Set();
  for(const item of items){
    if(!Number.isSafeInteger(Number(item.productoId)) || Number(item.productoId)<=0 || !Number.isSafeInteger(Number(item.cantidad)) || Number(item.cantidad)<=0) fail(400,'Los productos y cantidades deben ser válidos.');
    if(ids.has(Number(item.productoId))) fail(400,'No repitas un producto en el carrito.'); ids.add(Number(item.productoId));
  }
  const almacen=await almacenId(tx,alm,ALMACEN.TIENDA);
  let lines=[], subtotal=new Decimal(0);
  // Orden de bloqueo estable para evitar interbloqueos entre ventas simultáneas.
  for(const item of [...items].sort((a,b)=>Number(a.productoId)-Number(b.productoId))){
    const q=await tx.query(`SELECT p.id,p.codigo,p.nombre,p.existencia,p.activo,COALESCE((SELECT ROUND(GREATEST(0,CASE WHEN pr.tipo='porcentaje' THEN p.precio*(1-pr.valor/100) ELSE p.precio-pr.valor END),2) FROM promociones pr WHERE pr.producto_id=p.id AND pr.activa=true AND CURRENT_DATE BETWEEN pr.inicio AND pr.fin ORDER BY pr.id DESC LIMIT 1),p.precio) AS precio FROM productos p WHERE p.id=$1 FOR UPDATE`,[Number(item.productoId)]);
    const p=q.rows[0]; if(!p || !p.activo) fail(400,'Hay un producto inexistente o inactivo.');
    const qty=Number(item.cantidad), precio=preciosFijos?.has(Number(p.id))?preciosFijos.get(Number(p.id)):Number(p.precio);
    const line=new Decimal(precio).times(qty).toDecimalPlaces(2); subtotal=subtotal.plus(line);
    lines.push({id:Number(p.id),nombre:p.nombre,codigo:p.codigo,precio,cantidad:qty,subtotal:line.toFixed(2)});
  }
  const descuento=subtotal.times(pct).div(100).toDecimalPlaces(2), total=subtotal.minus(descuento);
  if(clienteId){const c=await tx.query('SELECT id FROM clientes WHERE id=$1 AND estado=$2',[clienteId,'Activo']); if(!c.rows.length) fail(400,'El cliente seleccionado no existe o está inactivo.');}
  const created=await tx.query('INSERT INTO ventas(cliente_id,cliente_nombre,metodo,subtotal,descuento,total,usuario_id,almacen_id,orden_venta_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,fecha',[clienteId,cliente.trim(),metodo,subtotal.toFixed(2),descuento.toFixed(2),total.toFixed(2),user.id,almacen,ordenVentaId]);
  const saleId=Number(created.rows[0].id);
  for(const l of lines){
    await tx.query('INSERT INTO venta_detalles(venta_id,producto_id,cantidad,precio,subtotal) VALUES($1,$2,$3,$4,$5)',[saleId,l.id,l.cantidad,l.precio,l.subtotal]);
    l.lotes=await salidaFIFO(tx,{almacenId:almacen,productoId:l.id,cantidad:l.cantidad,tipo:'Venta',referencia:`VENTA-${saleId}`,usuarioId:user.id});
    l.stock=Number((await tx.query('SELECT existencia FROM productos WHERE id=$1',[l.id])).rows[0].existencia);
  }
  await tx.query("INSERT INTO finanzas_movimientos(id,tipo,fecha,concepto,categoria,monto,metodo,estado,venta_id) VALUES($1,'Ingreso',CURRENT_DATE,$2,'Ventas',$3,$4,'Confirmado',$5)",[-saleId,`Venta #${saleId}`,total.toFixed(2),metodo,saleId]);
  const factura=await emitirFactura(tx,user,{ventaId:saleId,clienteId,cliente:cliente.trim(),subtotal,descuento,total});
  await audit(tx,user,'registrar','ventas',saleId);
  return {id:`V-${saleId}`,ventaId:saleId,factura,cliente:cliente.trim(),fecha:created.rows[0].fecha,metodo,almacenId:almacen,productos:lines,subtotal:Number(subtotal),descuento:Number(descuento),total:Number(total)};
}

// Comprobante interno numerado (no fiscal): el documento de requerimientos indica conservar la facturación existente.
async function emitirFactura(tx,user,{ventaId,clienteId,cliente,subtotal,descuento,total}){
  const n=(await tx.query("SELECT nextval('factura_numero_seq') AS n")).rows[0].n, numero=`FAC-${String(n).padStart(6,'0')}`;
  await tx.query('INSERT INTO facturas(numero,venta_id,cliente_id,cliente_nombre,subtotal,descuento,total,usuario_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[numero,ventaId,clienteId,cliente,subtotal.toFixed(2),descuento.toFixed(2),total.toFixed(2),user.id]);
  return numero;
}
export default function ventas(db){
  const r=Router();
  const VENTAS=`SELECT v.id,v.cliente_nombre AS cliente,v.cliente_id,v.fecha,v.metodo,v.subtotal,v.descuento,v.total,v.estado,v.orden_venta_id,a.nombre AS almacen,f.numero AS factura,f.id AS factura_id,u.nombre AS vendedor
    FROM ventas v LEFT JOIN almacenes a ON a.id=v.almacen_id LEFT JOIN facturas f ON f.venta_id=v.id LEFT JOIN usuarios u ON u.id=v.usuario_id`;
  const ventaRow=row=>({...row,id:Number(row.id),factura_id:row.factura_id&&Number(row.factura_id),subtotal:Number(row.subtotal),descuento:Number(row.descuento),total:Number(row.total)});
  r.get('/ventas',asyncRoute(async(req,res)=>{
    const p=[],w=[];
    if(req.query.desde){p.push(req.query.desde);w.push(`v.fecha>=$${p.length}::date`);} if(req.query.hasta){p.push(req.query.hasta);w.push(`v.fecha<$${p.length}::date+interval '1 day'`);}
    if(req.query.clienteId){p.push(String(req.query.clienteId));w.push(`v.cliente_id=$${p.length}`);}
    const q=await db.query(VENTAS+(w.length?' WHERE '+w.join(' AND '):'')+' ORDER BY v.fecha DESC LIMIT 1000',p);
    res.json({data:q.rows.map(ventaRow)});
  }));
  async function detalleVenta(tx,id){
    const v=(await tx.query(VENTAS+' WHERE v.id=$1',[id])).rows[0]; if(!v) fail(404,'Venta no encontrada.');
    const lineas=(await tx.query(`SELECT d.id,d.producto_id,p.codigo,p.nombre,d.cantidad,d.precio,d.subtotal,
      COALESCE((SELECT SUM(x.cantidad) FROM devoluciones_venta x WHERE x.venta_detalle_id=d.id AND x.estado<>'Rechazada'),0) AS devuelto
      FROM venta_detalles d JOIN productos p ON p.id=d.producto_id WHERE d.venta_id=$1 ORDER BY d.id`,[id])).rows;
    const movimientos=(await tx.query("SELECT m.fecha,m.tipo,m.cantidad,l.codigo AS lote,a.nombre AS almacen,COALESCE(p.nombre,'') AS producto FROM movimientos_inventario m LEFT JOIN lotes l ON l.id=m.lote_id LEFT JOIN almacenes a ON a.id=m.almacen_id LEFT JOIN productos p ON p.id=m.producto_id WHERE m.referencia=$1 OR m.referencia LIKE $2 ORDER BY m.id",[`VENTA-${id}`,`VENTA-${id} %`])).rows;
    return {...ventaRow(v),lineas:lineas.map(l=>({id:Number(l.id),productoId:Number(l.producto_id),codigo:l.codigo,nombre:l.nombre,cantidad:Number(l.cantidad),precio:Number(l.precio),subtotal:Number(l.subtotal),devuelto:Number(l.devuelto)})),
      movimientos:movimientos.map(m=>({...m,cantidad:Number(m.cantidad)}))};
  }
  r.get('/ventas/devoluciones',asyncRoute(async(req,res)=>{
    const q=await db.query(`SELECT x.*,d.venta_id,p.nombre AS producto,f.numero AS factura,v.cliente_nombre AS cliente,a.nombre AS almacen,u.nombre AS usuario FROM devoluciones_venta x JOIN venta_detalles d ON d.id=x.venta_detalle_id JOIN productos p ON p.id=d.producto_id
      JOIN ventas v ON v.id=d.venta_id LEFT JOIN facturas f ON f.venta_id=v.id LEFT JOIN almacenes a ON a.id=x.almacen_id LEFT JOIN usuarios u ON u.id=x.usuario_id ORDER BY x.fecha DESC`);
    res.json({data:q.rows.map(x=>({id:Number(x.id),ventaId:Number(x.venta_id),factura:x.factura,cliente:x.cliente,producto:x.producto,cantidad:Number(x.cantidad),monto:Number(x.monto),tipo:x.tipo,motivo:x.motivo,estado:x.estado,reingresa:x.reingresa,almacen:x.almacen,fecha:x.fecha,usuario:x.usuario}))});
  }));
  r.get('/ventas/:id',asyncRoute(async(req,res)=>res.json({data:await detalleVenta(db,entero(req.params.id,'venta'))})));
  r.post('/ventas',asyncRoute(async(req,res)=>{
    const {cliente,clienteId,metodo,porcentajeDescuento,items,almacenId:alm}=req.body || {};
    const sale=await db.transaction(tx=>registrarVenta(tx,req.user,{cliente,clienteId,metodo,porcentajeDescuento,items,almacenId:alm}));
    res.status(201).json({data:sale});
  }));
  // Factura una orden de venta (originada en cotización): crea la venta con los precios cotizados, descuenta
  // existencias y completa la orden. El índice único ventas.orden_venta_id impide cobrarla dos veces.
  r.post('/ordenes-venta/:id/facturar',asyncRoute(async(req,res)=>{
    const b=req.body||{};
    const sale=await db.transaction(async tx=>{
      const o=(await tx.query('SELECT * FROM ordenes_venta WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0]; if(!o) fail(404,'Orden inexistente.');
      if(['Completada','Cancelada'].includes(o.estado)) fail(409,'La orden ya está cerrada o facturada.');
      if((await tx.query('SELECT 1 FROM ventas WHERE orden_venta_id=$1',[o.id])).rows.length) fail(409,'La orden ya fue facturada.');
      const lineas=(await tx.query('SELECT producto_id,cantidad,precio FROM orden_venta_detalles WHERE orden_id=$1',[o.id])).rows;
      const cot=(await tx.query('SELECT cliente_id FROM cotizaciones WHERE id=$1',[o.cotizacion_id])).rows[0];
      const venta=await registrarVenta(tx,req.user,{cliente:o.cliente_nombre,clienteId:b.clienteId||cot?.cliente_id||null,metodo:b.metodo||'Efectivo',porcentajeDescuento:b.porcentajeDescuento||0,almacenId:b.almacenId,ordenVentaId:o.id,
        items:lineas.map(l=>({productoId:Number(l.producto_id),cantidad:Number(l.cantidad)})),preciosFijos:new Map(lineas.map(l=>[Number(l.producto_id),Number(l.precio)]))});
      await tx.query("UPDATE ordenes_venta SET estado='Completada',version=version+1 WHERE id=$1",[o.id]);
      await audit(tx,req.user,'facturar','ordenes-venta',o.id); return venta;
    });
    res.status(201).json({data:sale});
  }));
  const FACT=`SELECT f.*,v.metodo,v.orden_venta_id,a.nombre AS almacen,u.nombre AS vendedor,c.correo,c.telefono,c.ubicacion FROM facturas f JOIN ventas v ON v.id=f.venta_id LEFT JOIN almacenes a ON a.id=v.almacen_id LEFT JOIN usuarios u ON u.id=f.usuario_id LEFT JOIN clientes c ON c.id=f.cliente_id`;
  const factRow=f=>({id:Number(f.id),numero:f.numero,ventaId:Number(f.venta_id),ordenVentaId:f.orden_venta_id,clienteId:f.cliente_id,cliente:f.cliente_nombre,correo:f.correo,telefono:f.telefono,direccion:f.ubicacion,fecha:f.fecha,subtotal:Number(f.subtotal),descuento:Number(f.descuento),total:Number(f.total),estado:f.estado,anuladaMotivo:f.anulada_motivo,anuladaEn:f.anulada_en,metodo:f.metodo,almacen:f.almacen,vendedor:f.vendedor,_version:Number(f.version)});
  r.get('/facturas',asyncRoute(async(req,res)=>{exigir(req.user,'ventas','leer');res.json({data:(await db.query(FACT+' ORDER BY f.id DESC LIMIT 1000')).rows.map(factRow)})}));
  r.get('/facturas/:id',asyncRoute(async(req,res)=>{
    exigir(req.user,'ventas','leer');const f=(await db.query(FACT+' WHERE f.id=$1',[entero(req.params.id,'factura')])).rows[0]; if(!f) fail(404,'Factura no encontrada.');
    const venta=await detalleVenta(db,Number(f.venta_id)); res.json({data:{...factRow(f),lineas:venta.lineas}});
  }));
  // Anulación (solo administración): reingresa al almacén lo vendido no devuelto y revierte el ingreso financiero.
  r.patch('/facturas/:id/anular',asyncRoute(async(req,res)=>{
    if(req.user.role!=='admin') fail(403,'Solo administración puede anular facturas.');
    const id=entero(req.params.id,'factura'), motivo=texto(req.body?.motivo,'motivo',{requerido:true,max:500});
    await db.transaction(async tx=>{
      const f=await transicion(tx,'facturas',id,['Emitida'],'Anulada',',anulada_motivo=$4,anulada_en=now()',[motivo]);
      const v=(await tx.query('SELECT * FROM ventas WHERE id=$1 FOR UPDATE',[f.venta_id])).rows[0];
      const alm=await almacenId(tx,v.almacen_id,ALMACEN.TIENDA);
      for(const d of (await tx.query("SELECT d.*,COALESCE((SELECT SUM(x.cantidad) FROM devoluciones_venta x WHERE x.venta_detalle_id=d.id AND x.estado<>'Rechazada'),0) AS devuelto FROM venta_detalles d WHERE d.venta_id=$1",[v.id])).rows){
        const pend=Number(d.cantidad)-Number(d.devuelto); if(pend<=0) continue;
        // Devuelve a los mismos lotes de los que salió la venta.
        let resto=pend;
        for(const m of (await tx.query("SELECT lote_id,-cantidad AS c FROM movimientos_inventario WHERE referencia=$1 AND producto_id=$2 AND tipo='Venta' ORDER BY id",[`VENTA-${v.id}`,d.producto_id])).rows){
          if(resto<=0) break; const q=Math.min(resto,Number(m.c));
          await moverStock(tx,{almacenId:alm,productoId:Number(d.producto_id),loteId:m.lote_id===null?null:Number(m.lote_id),cantidad:q,tipo:'Anulación de venta',referencia:`VENTA-${v.id} ${f.numero}`,motivo,usuarioId:req.user.id});resto-=q;}
      }
      await tx.query("UPDATE ventas SET estado='Anulada' WHERE id=$1",[v.id]);
      await tx.query("UPDATE finanzas_movimientos SET estado='Anulado',version=version+1 WHERE venta_id=$1",[v.id]);
      if(v.orden_venta_id) await tx.query("UPDATE ordenes_venta SET estado='Cancelada',version=version+1 WHERE id=$1",[v.orden_venta_id]);
      await audit(tx,req.user,'anular','facturas',f.numero);
    });
    res.json({data:factRow((await db.query(FACT+' WHERE f.id=$1',[id])).rows[0])});
  }));
  // Devolución o cambio: no supera lo vendido; el producto reingresa al almacén (salvo defectuoso) y se registra el egreso.
  r.post('/ventas/devoluciones',asyncRoute(async(req,res)=>{
    const b=req.body||{}; const ventaId=entero(b.ventaId,'venta'), detalleId=entero(b.ventaDetalleId,'producto'), cantidad=entero(b.cantidad,'cantidad');
    const tipo=uno(b.tipo||'Devolución',['Devolución','Cambio'],'tipo'), motivo=texto(b.motivo,'motivo',{requerido:true,max:500}), reingresa=b.reingresa!==false;
    const out=await db.transaction(async tx=>{
      const v=(await tx.query('SELECT * FROM ventas WHERE id=$1 FOR UPDATE',[ventaId])).rows[0]; if(!v) fail(404,'Venta no encontrada.');
      if(v.estado==='Anulada') fail(409,'La venta está anulada.');
      const d=(await tx.query('SELECT * FROM venta_detalles WHERE id=$1 AND venta_id=$2',[detalleId,ventaId])).rows[0]; if(!d) fail(400,'El producto no pertenece a la venta.');
      const dev=Number((await tx.query("SELECT COALESCE(SUM(cantidad),0) AS n FROM devoluciones_venta WHERE venta_detalle_id=$1 AND estado<>'Rechazada'",[d.id])).rows[0].n);
      if(dev+cantidad>Number(d.cantidad)) fail(409,`No puedes devolver más de lo vendido (pendiente: ${Number(d.cantidad)-dev}).`);
      const alm=await almacenId(tx,b.almacenId||v.almacen_id,ALMACEN.TIENDA);
      const monto=new Decimal(d.precio).times(cantidad).times(new Decimal(1).minus(new Decimal(v.descuento).div(v.subtotal>0?v.subtotal:1))).toDecimalPlaces(2);
      const q=await tx.query("INSERT INTO devoluciones_venta(venta_detalle_id,cantidad,motivo,estado,usuario_id,almacen_id,reingresa,tipo,monto) VALUES($1,$2,$3,'Procesada',$4,$5,$6,$7,$8) RETURNING id",[d.id,cantidad,motivo,req.user.id,alm,reingresa,tipo,tipo==='Devolución'?monto.toFixed(2):0]);
      const devId=Number(q.rows[0].id);
      if(reingresa) await moverStock(tx,{almacenId:alm,productoId:Number(d.producto_id),cantidad,tipo:'Devolución de venta',referencia:`VENTA-${ventaId} DV-${devId}`,motivo,usuarioId:req.user.id});
      if(tipo==='Devolución' && monto.isPositive()) await tx.query("INSERT INTO finanzas_movimientos(id,tipo,fecha,concepto,categoria,monto,metodo,estado,proveedor) VALUES($1,'Gasto',CURRENT_DATE,$2,'Devoluciones de venta',$3,$4,'Pagado',$5)",[-(1000000000+devId),`Devolución venta #${ventaId}`,monto.toFixed(2),v.metodo,v.cliente_nombre]);
      if(tipo==='Cambio'){ // el cambio entrega otro producto: se registra como salida por la misma referencia
        const prod=entero(b.productoCambioId,'producto de cambio');
        await salidaFIFO(tx,{almacenId:alm,productoId:prod,cantidad,tipo:'Cambio de producto',referencia:`VENTA-${ventaId} DV-${devId}`,motivo,usuarioId:req.user.id});
      }
      await audit(tx,req.user,tipo.toLowerCase(),'ventas',ventaId); return {id:devId,monto:Number(monto)};
    });
    res.status(201).json({data:out});
  }));
  return r;
}
