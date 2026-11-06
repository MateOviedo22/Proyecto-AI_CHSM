import {Router} from 'express';
import Decimal from 'decimal.js';
import {asyncRoute,fail,audit,dateValue,entero,numero,texto,fecha,uno} from '../http.js';
import {exigir} from '../permisos.js';
import {moverStock,salidaFIFO,almacenId,crearLote} from '../stock.js';
// FRQ-0001..0004, RF-06..10, RF-20..24: almacenes, existencias por almacén y lote, entradas/salidas manuales,
// historial de movimientos con filtros, alertas de stock mínimo y trazabilidad de lotes.
export default function inventario(db){
  const r=Router();
  const almRow=a=>({id:Number(a.id),codigo:a.codigo,nombre:a.nombre,ubicacion:a.ubicacion,tipo:a.tipo,responsable:a.responsable,descripcion:a.descripcion,activo:a.activo,_version:Number(a.version),
    articulos:Number(a.articulos||0),unidades:Number(a.unidades||0),valor:Number(a.valor||0)});
  const ALM=`SELECT a.*,(SELECT COUNT(DISTINCT COALESCE(e.producto_id,0)||'-'||COALESCE(e.material_id,0)) FROM existencias e WHERE e.almacen_id=a.id AND e.cantidad>0) AS articulos,
    (SELECT COALESCE(SUM(e.cantidad),0) FROM existencias e WHERE e.almacen_id=a.id) AS unidades,
    (SELECT COALESCE(SUM(e.cantidad*COALESCE(m.costo,p.precio)),0) FROM existencias e LEFT JOIN materiales m ON m.id=e.material_id LEFT JOIN productos p ON p.id=e.producto_id WHERE e.almacen_id=a.id) AS valor FROM almacenes a`;
  r.get('/almacenes',asyncRoute(async(req,res)=>{exigir(req.user,'inventario','leer');res.json({data:(await db.query(ALM+' ORDER BY a.id')).rows.map(almRow)})}));
  const datosAlm=b=>({codigo:texto(b.codigo,'código',{requerido:true,max:40}).toUpperCase(),nombre:texto(b.nombre,'nombre',{requerido:true}),ubicacion:texto(b.ubicacion,'ubicación'),tipo:uno(b.tipo||'Bodega',['Taller','Tienda','Bodega','Otro'],'tipo'),responsable:texto(b.responsable,'responsable'),descripcion:texto(b.descripcion,'descripción',{max:500}),activo:b.activo!==false});
  r.post('/almacenes',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','escribir');const d=datosAlm(req.body||{});
    const id=await db.transaction(async tx=>{const q=await tx.query('INSERT INTO almacenes(codigo,nombre,ubicacion,tipo,responsable,descripcion,activo) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[d.codigo,d.nombre,d.ubicacion,d.tipo,d.responsable,d.descripcion,d.activo]);await audit(tx,req.user,'crear','almacenes',q.rows[0].id);return q.rows[0].id;});
    res.status(201).json({data:almRow((await db.query(ALM+' WHERE a.id=$1',[id])).rows[0])});
  }));
  r.put('/almacenes/:id',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','escribir');const id=entero(req.params.id,'id'),d=datosAlm(req.body||{}),v=entero(req.body?._version,'_version');
    await db.transaction(async tx=>{
      if(!d.activo){const s=(await tx.query('SELECT COALESCE(SUM(cantidad),0) AS s FROM existencias WHERE almacen_id=$1',[id])).rows[0].s; if(Number(s)>0) fail(409,'No puedes desactivar un almacén que todavía tiene existencias. Trasládalas primero.');}
      const q=await tx.query('UPDATE almacenes SET codigo=$1,nombre=$2,ubicacion=$3,tipo=$4,responsable=$5,descripcion=$6,activo=$7,version=version+1 WHERE id=$8 AND version=$9 RETURNING id',[d.codigo,d.nombre,d.ubicacion,d.tipo,d.responsable,d.descripcion,d.activo,id,v]);
      if(!q.rows.length) fail(409,'El almacén cambió o no existe. Vuelve a cargar la página.'); await audit(tx,req.user,'actualizar','almacenes',id);
    });
    res.json({data:almRow((await db.query(ALM+' WHERE a.id=$1',[id])).rows[0])});
  }));
  // Existencias detalladas (por almacén y lote) con mínimo configurado y estado.
  r.get('/existencias',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','leer');
    const where=['e.cantidad>0'],p=[];
    if(req.query.almacenId){p.push(entero(req.query.almacenId,'almacén'));where.push(`e.almacen_id=$${p.length}`);}
    if(req.query.tipo==='producto') where.push('e.producto_id IS NOT NULL'); if(req.query.tipo==='material') where.push('e.material_id IS NOT NULL');
    if(req.query.productoId){p.push(entero(req.query.productoId,'producto'));where.push(`e.producto_id=$${p.length}`);}
    if(req.query.materialId){p.push(entero(req.query.materialId,'material'));where.push(`e.material_id=$${p.length}`);}
    if(req.query.q){p.push(`%${texto(req.query.q,'búsqueda').toLowerCase()}%`);where.push(`lower(COALESCE(pr.nombre,m.nombre)||' '||COALESCE(pr.codigo,m.codigo)||' '||COALESCE(l.codigo,'')) LIKE $${p.length}`);}
    const q=await db.query(`SELECT e.id,e.almacen_id,a.nombre AS almacen,a.tipo AS almacen_tipo,e.producto_id,e.material_id,COALESCE(pr.nombre,m.nombre) AS articulo,COALESCE(pr.codigo,m.codigo) AS codigo,
      CASE WHEN e.producto_id IS NULL THEN 'Material' ELSE 'Producto' END AS tipo,COALESCE(m.unidad,pr.unidad) AS unidad,e.lote_id,l.codigo AS lote,l.fecha AS lote_fecha,l.vencimiento,e.cantidad,
      COALESCE(m.costo,pr.precio) AS valor_unitario,COALESCE(mi.minimo,0) AS minimo_almacen,e.actualizado_en
      FROM existencias e JOIN almacenes a ON a.id=e.almacen_id LEFT JOIN productos pr ON pr.id=e.producto_id LEFT JOIN materiales m ON m.id=e.material_id LEFT JOIN lotes l ON l.id=e.lote_id
      LEFT JOIN minimos_almacen mi ON mi.almacen_id=e.almacen_id AND mi.producto_id IS NOT DISTINCT FROM e.producto_id AND mi.material_id IS NOT DISTINCT FROM e.material_id
      WHERE ${where.join(' AND ')} ORDER BY a.nombre,articulo,l.fecha NULLS FIRST LIMIT 2000`,p);
    res.json({data:q.rows.map(x=>({...x,id:Number(x.id),almacen_id:Number(x.almacen_id),producto_id:x.producto_id&&Number(x.producto_id),material_id:x.material_id&&Number(x.material_id),lote_id:x.lote_id&&Number(x.lote_id),vencimiento:dateValue(x.vencimiento),cantidad:Number(x.cantidad),valor_unitario:Number(x.valor_unitario),minimo_almacen:Number(x.minimo_almacen),valor:Number(new Decimal(x.cantidad).times(x.valor_unitario).toDecimalPlaces(2))}))});
  }));
  // Disponibilidad resumida por artículo y almacén (para ventas, traslados y requisiciones).
  r.get('/disponibilidad',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','leer');
    const q=await db.query(`SELECT e.almacen_id,a.nombre AS almacen,e.producto_id,e.material_id,SUM(e.cantidad) AS cantidad FROM existencias e JOIN almacenes a ON a.id=e.almacen_id
      WHERE e.cantidad>0 AND a.activo GROUP BY e.almacen_id,a.nombre,e.producto_id,e.material_id ORDER BY a.nombre`);
    res.json({data:q.rows.map(x=>({almacenId:Number(x.almacen_id),almacen:x.almacen,productoId:x.producto_id&&Number(x.producto_id),materialId:x.material_id&&Number(x.material_id),cantidad:Number(x.cantidad)}))});
  }));
  r.put('/minimos',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','escribir');const b=req.body||{};
    const alm=entero(b.almacenId,'almacén'),prod=entero(b.productoId,'producto',{opcional:true}),mat=entero(b.materialId,'material',{opcional:true}),min=numero(b.minimo,'mínimo');
    if((prod?1:0)+(mat?1:0)!==1) fail(400,'Indica un producto o un material.');
    await db.transaction(async tx=>{
      await tx.query('DELETE FROM minimos_almacen WHERE almacen_id=$1 AND producto_id IS NOT DISTINCT FROM $2::bigint AND material_id IS NOT DISTINCT FROM $3::bigint',[alm,prod,mat]);
      await tx.query('INSERT INTO minimos_almacen(almacen_id,producto_id,material_id,minimo) VALUES($1,$2,$3,$4)',[alm,prod,mat,min]);
      await audit(tx,req.user,'mínimo por almacén','almacenes',alm);
    });
    res.json({data:{almacenId:alm,productoId:prod,materialId:mat,minimo:min}});
  }));
  // Entradas y salidas manuales (FRQ-0003/0004): salida por producto defectuoso o limpieza de inventario.
  r.post('/inventario/movimientos',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','escribir');const b=req.body||{};
    const tipo=uno(b.tipo,['Entrada','Salida'],'tipo'), alm=entero(b.almacenId,'almacén'), cantidad=numero(b.cantidad,'cantidad',{positivo:true});
    const prod=entero(b.productoId,'producto',{opcional:true}),mat=entero(b.materialId,'material',{opcional:true}),loteId=entero(b.loteId,'lote',{opcional:true});
    const motivos=tipo==='Entrada'?['Ajuste por conteo','Devolución interna','Producto recuperado','Otro']:['Producto defectuoso','Limpieza de inventario','Merma','Ajuste por conteo','Muestra / exhibición','Otro'];
    const motivo=uno(b.motivo,motivos,'motivo'), detalle=texto(b.detalle,'detalle',{max:500}), documento=texto(b.documento,'documento');
    if(motivo==='Otro' && !detalle) fail(400,'Describe el motivo del movimiento.');
    const out=await db.transaction(async tx=>{
      const a=await almacenId(tx,alm);
      const ref=documento||`AJ-${Date.now()}`;
      let partes;
      if(tipo==='Entrada') partes=[await moverStock(tx,{almacenId:a,productoId:prod,materialId:mat,loteId,cantidad,tipo:'Entrada manual',referencia:ref,motivo:detalle?`${motivo}: ${detalle}`:motivo,usuarioId:req.user.id})];
      else partes=await salidaFIFO(tx,{almacenId:a,productoId:prod,materialId:mat,loteId,cantidad,tipo:'Salida manual',referencia:ref,motivo:detalle?`${motivo}: ${detalle}`:motivo,usuarioId:req.user.id});
      await audit(tx,req.user,`${tipo.toLowerCase()} manual`,'inventario',ref); return {referencia:ref,partes};
    });
    res.status(201).json({data:out});
  }));
  // Historial de movimientos con filtros (RF-10).
  r.get('/movimientos',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','leer');
    const where=[],p=[];const add=(sql,v)=>{p.push(v);where.push(sql.replace('?',`$${p.length}`));};
    if(req.query.almacenId) add('m.almacen_id=?',entero(req.query.almacenId,'almacén'));
    if(req.query.productoId) add('m.producto_id=?',entero(req.query.productoId,'producto'));
    if(req.query.materialId) add('m.material_id=?',entero(req.query.materialId,'material'));
    if(req.query.lote) add('l.codigo=?',texto(req.query.lote,'lote'));
    if(req.query.tipo) add('m.tipo=?',texto(req.query.tipo,'tipo'));
    if(req.query.referencia) add('m.referencia ILIKE ?',`%${texto(req.query.referencia,'referencia')}%`);
    if(req.query.desde) add('m.fecha>=?::date',fecha(req.query.desde,'desde'));
    if(req.query.hasta) add("m.fecha<?::date+interval '1 day'",fecha(req.query.hasta,'hasta'));
    if(req.query.q) add("lower(COALESCE(p.nombre,ma.nombre)||' '||m.tipo||' '||m.referencia||' '||COALESCE(l.codigo,'')) LIKE ?",`%${texto(req.query.q,'búsqueda').toLowerCase()}%`);
    const limit=Math.min(entero(req.query.limite??500,'límite'),2000);
    const q=await db.query(`SELECT m.id,m.tipo,m.cantidad,m.saldo,m.saldo_almacen,m.referencia,m.motivo,m.fecha,m.producto_id,m.material_id,COALESCE(p.nombre,ma.nombre) AS articulo,COALESCE(p.codigo,ma.codigo) AS codigo,
      CASE WHEN m.producto_id IS NULL THEN 'Material' ELSE 'Producto' END AS clase,a.nombre AS almacen,m.almacen_id,l.codigo AS lote,u.nombre AS usuario
      FROM movimientos_inventario m LEFT JOIN productos p ON p.id=m.producto_id LEFT JOIN materiales ma ON ma.id=m.material_id LEFT JOIN almacenes a ON a.id=m.almacen_id LEFT JOIN lotes l ON l.id=m.lote_id JOIN usuarios u ON u.id=m.usuario_id
      ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY m.fecha DESC,m.id DESC LIMIT ${limit}`,p);
    res.json({data:q.rows.map(x=>({...x,id:Number(x.id),cantidad:Number(x.cantidad),saldo:Number(x.saldo),saldo_almacen:x.saldo_almacen===null?null:Number(x.saldo_almacen),producto_id:x.producto_id&&Number(x.producto_id),material_id:x.material_id&&Number(x.material_id),almacen_id:x.almacen_id&&Number(x.almacen_id)}))});
  }));
  r.get('/lotes',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','leer');
    const q=await db.query(`SELECT l.*,COALESCE(p.nombre,m.nombre) AS articulo,(SELECT COALESCE(SUM(cantidad),0) FROM existencias e WHERE e.lote_id=l.id) AS disponible FROM lotes l LEFT JOIN productos p ON p.id=l.producto_id LEFT JOIN materiales m ON m.id=l.material_id ORDER BY l.fecha DESC LIMIT 1000`);
    res.json({data:q.rows.map(x=>({id:Number(x.id),codigo:x.codigo,articulo:x.articulo,productoId:x.producto_id&&Number(x.producto_id),materialId:x.material_id&&Number(x.material_id),origen:x.origen,referencia:x.referencia,fecha:x.fecha,vencimiento:dateValue(x.vencimiento),disponible:Number(x.disponible)}))});
  }));
  // Trazabilidad de un lote: origen, insumos consumidos (si es producción), destinos (consumos, traslados, ventas) y movimientos.
  r.get('/trazabilidad/lotes/:codigo',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','leer');
    const l=(await db.query(`SELECT l.*,COALESCE(p.nombre,m.nombre) AS articulo,COALESCE(p.codigo,m.codigo) AS articulo_codigo,COALESCE(m.unidad,p.unidad) AS unidad FROM lotes l LEFT JOIN productos p ON p.id=l.producto_id LEFT JOIN materiales m ON m.id=l.material_id WHERE l.codigo=$1`,[texto(req.params.codigo,'lote',{requerido:true})])).rows[0];
    if(!l) fail(404,'No existe un lote con ese código.');
    const movimientos=(await db.query(`SELECT m.id,m.fecha,m.tipo,m.cantidad,m.referencia,m.motivo,a.nombre AS almacen,u.nombre AS usuario FROM movimientos_inventario m LEFT JOIN almacenes a ON a.id=m.almacen_id JOIN usuarios u ON u.id=m.usuario_id WHERE m.lote_id=$1 ORDER BY m.fecha,m.id`,[l.id])).rows.map(x=>({...x,id:Number(x.id),cantidad:Number(x.cantidad)}));
    const existencias=(await db.query('SELECT a.nombre AS almacen,e.cantidad FROM existencias e JOIN almacenes a ON a.id=e.almacen_id WHERE e.lote_id=$1 AND e.cantidad>0',[l.id])).rows.map(x=>({...x,cantidad:Number(x.cantidad)}));
    let origen=null, insumos=[], consumidoEn=[];
    if(l.origen==='Compra'){
      origen=(await db.query(`SELECT r.id AS recepcion_id,r.fecha,r.documento,o.id AS orden_id,p.nombre AS proveedor,p.razon_social,d.precio FROM recepciones_compra r JOIN orden_compra_detalles d ON d.id=r.orden_detalle_id JOIN ordenes_compra o ON o.id=d.orden_id JOIN proveedores p ON p.id=o.proveedor_id WHERE r.lote_id=$1`,[l.id])).rows[0]||{referencia:l.referencia};
    }
    if(l.origen==='Producción'){
      origen=(await db.query(`SELECT o.id AS orden_id,o.fecha,o.plan_id,li.nombre AS linea,d.cantidad_planificada,d.cantidad_producida,d.aprobada,d.rechazada,ua.nombre AS autorizado_por FROM orden_produccion_detalles d JOIN ordenes_produccion o ON o.id=d.orden_id LEFT JOIN lineas_produccion li ON li.id=o.linea_id LEFT JOIN usuarios ua ON ua.id=o.autorizado_por WHERE d.lote_id=$1`,[l.id])).rows[0]||null;
      if(origen) insumos=(await db.query(`SELECT ma.nombre AS material,ma.unidad,lo.codigo AS lote,SUM(c.cantidad) AS cantidad FROM produccion_consumos c JOIN materiales ma ON ma.id=c.material_id LEFT JOIN lotes lo ON lo.id=c.lote_id WHERE c.orden_id=$1 GROUP BY ma.nombre,ma.unidad,lo.codigo ORDER BY ma.nombre`,[origen.orden_id])).rows.map(x=>({...x,cantidad:Number(x.cantidad)}));
    }
    if(l.material_id) consumidoEn=(await db.query(`SELECT c.orden_id,SUM(c.cantidad) AS cantidad,MIN(c.fecha) AS fecha FROM produccion_consumos c WHERE c.lote_id=$1 GROUP BY c.orden_id ORDER BY fecha`,[l.id])).rows.map(x=>({...x,cantidad:Number(x.cantidad)}));
    const ventas=l.producto_id?(await db.query(`SELECT m.referencia,m.fecha,-m.cantidad AS cantidad,a.nombre AS almacen FROM movimientos_inventario m LEFT JOIN almacenes a ON a.id=m.almacen_id WHERE m.lote_id=$1 AND m.tipo='Venta' ORDER BY m.fecha`,[l.id])).rows.map(x=>({...x,cantidad:Number(x.cantidad)})):[];
    const traslados=movimientos.filter(m=>m.tipo.startsWith('Traslado'));
    res.json({data:{lote:{id:Number(l.id),codigo:l.codigo,articulo:l.articulo,articuloCodigo:l.articulo_codigo,unidad:l.unidad,tipo:l.producto_id?'Producto':'Material',origen:l.origen,referencia:l.referencia,fecha:l.fecha,vencimiento:dateValue(l.vencimiento)},
      origen,insumos,consumidoEn,ventas,traslados,existencias,movimientos,
      resumen:{entradas:movimientos.filter(m=>m.cantidad>0).reduce((s,m)=>s+m.cantidad,0),salidas:-movimientos.filter(m=>m.cantidad<0).reduce((s,m)=>s+m.cantidad,0),disponible:existencias.reduce((s,e)=>s+e.cantidad,0)}}});
  }));
  // Alertas de stock mínimo y punto de reorden (FRQ-0010): global y por almacén.
  r.get('/alertas/stock',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','leer');
    const global=(await db.query(`SELECT 'Material' AS tipo,id,codigo,nombre,unidad,existencia,minimo,NULL::text AS almacen,NULL::bigint AS almacen_id FROM materiales WHERE existencia<=minimo AND minimo>0
      UNION ALL SELECT 'Producto',id,codigo,nombre,unidad,existencia,minimo,NULL,NULL FROM productos WHERE activo AND existencia<=minimo AND minimo>0`)).rows;
    const porAlmacen=(await db.query(`SELECT CASE WHEN mi.producto_id IS NULL THEN 'Material' ELSE 'Producto' END AS tipo,COALESCE(mi.producto_id,mi.material_id) AS id,COALESCE(p.codigo,m.codigo) AS codigo,COALESCE(p.nombre,m.nombre) AS nombre,COALESCE(m.unidad,p.unidad) AS unidad,
      COALESCE((SELECT SUM(e.cantidad) FROM existencias e WHERE e.almacen_id=mi.almacen_id AND e.producto_id IS NOT DISTINCT FROM mi.producto_id AND e.material_id IS NOT DISTINCT FROM mi.material_id),0) AS existencia,mi.minimo,a.nombre AS almacen,a.id AS almacen_id
      FROM minimos_almacen mi JOIN almacenes a ON a.id=mi.almacen_id LEFT JOIN productos p ON p.id=mi.producto_id LEFT JOIN materiales m ON m.id=mi.material_id`)).rows.filter(x=>Number(x.existencia)<=Number(x.minimo));
    const fmt=x=>({...x,id:Number(x.id),almacen_id:x.almacen_id&&Number(x.almacen_id),existencia:Number(x.existencia),minimo:Number(x.minimo),nivel:Number(x.existencia)===0?'Crítico':'Bajo',faltante:Math.max(0,Number(x.minimo)-Number(x.existencia))});
    res.json({data:[...global,...porAlmacen].map(fmt).sort((a,b)=>(a.nivel===b.nivel?0:a.nivel==='Crítico'?-1:1))});
  }));
  return r;
}
