import Decimal from 'decimal.js';
import {fail} from './http.js';
// Único punto que modifica existencias. Mantiene la existencia por almacén/lote (tabla existencias),
// el saldo global (productos.existencia / materiales.existencia) y el historial (movimientos_inventario)
// dentro de la transacción del llamador. Orden de bloqueo estable: artículo global y luego existencias.
export const ALMACEN={TALLER:'ALM-TALLER',TIENDA:'ALM-TIENDA'};
const item=({productoId,materialId})=>{
  if((productoId?1:0)+(materialId?1:0)!==1) fail(400,'Indica un producto o un material.');
  return productoId?{tabla:'productos',col:'producto_id',id:Number(productoId),entero:true}:{tabla:'materiales',col:'material_id',id:Number(materialId),entero:false};
};
export async function almacenId(tx,id,codigoPorDefecto){
  const q=id ? await tx.query('SELECT id,activo FROM almacenes WHERE id=$1',[Number(id)]) : await tx.query('SELECT id,activo FROM almacenes WHERE codigo=$1',[codigoPorDefecto]);
  const a=q.rows[0]; if(!a) fail(400,'El almacén no existe.'); if(!a.activo) fail(409,'El almacén está inactivo.'); return Number(a.id);
}
async function bloquearArticulo(tx,it){
  const g=(await tx.query(`SELECT id,nombre,existencia FROM ${it.tabla} WHERE id=$1 FOR UPDATE`,[it.id])).rows[0];
  if(!g) fail(404,`El ${it.tabla==='productos'?'producto':'material'} no existe.`); return g;
}
export async function moverStock(tx,{almacenId:alm,productoId=null,materialId=null,loteId=null,cantidad,tipo,referencia='',motivo='',usuarioId}){
  const it=item({productoId,materialId}); const q=new Decimal(cantidad);
  if(q.isZero()||!q.isFinite()) fail(400,'La cantidad del movimiento no puede ser cero.');
  if(it.entero && !q.isInteger()) fail(400,'Los productos terminados se mueven en unidades enteras.');
  const g=await bloquearArticulo(tx,it);
  const e=(await tx.query(`SELECT id,cantidad FROM existencias WHERE almacen_id=$1 AND ${it.col}=$2 AND lote_id IS NOT DISTINCT FROM $3::bigint FOR UPDATE`,[alm,it.id,loteId])).rows[0];
  const enAlmacen=new Decimal(e?.cantidad||0).plus(q);
  if(enAlmacen.isNegative()) fail(409,`Existencia insuficiente de ${g.nombre} en el almacén${loteId?' y lote':''} seleccionado.`);
  if(e) await tx.query('UPDATE existencias SET cantidad=$1,actualizado_en=now() WHERE id=$2',[enAlmacen.toFixed(3),e.id]);
  else await tx.query(`INSERT INTO existencias(almacen_id,${it.col},lote_id,cantidad) VALUES($1,$2,$3,$4)`,[alm,it.id,loteId,enAlmacen.toFixed(3)]);
  const global=new Decimal(g.existencia).plus(q);
  if(global.isNegative()) fail(409,`Existencia insuficiente de ${g.nombre}.`);
  await tx.query(`UPDATE ${it.tabla} SET existencia=$1,version=version+1 WHERE id=$2`,[it.entero?global.toNumber():global.toFixed(3),it.id]);
  const saldoAlmacen=(await tx.query(`SELECT COALESCE(SUM(cantidad),0) AS s FROM existencias WHERE almacen_id=$1 AND ${it.col}=$2`,[alm,it.id])).rows[0].s;
  const mov=await tx.query(`INSERT INTO movimientos_inventario(${it.col},tipo,cantidad,saldo,referencia,usuario_id,almacen_id,lote_id,motivo,saldo_almacen) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [it.id,tipo,q.toFixed(3),global.toFixed(3),referencia,usuarioId,alm,loteId,motivo,saldoAlmacen]);
  return {movimientoId:Number(mov.rows[0].id),saldo:global.toNumber(),saldoAlmacen:Number(saldoAlmacen),nombre:g.nombre};
}
// Salida consumiendo primero los lotes más antiguos (FIFO); las existencias sin lote se consumen primero.
// Si se indica loteId, solo se descuenta de ese lote. Devuelve el detalle por lote.
export async function salidaFIFO(tx,{almacenId:alm,productoId=null,materialId=null,loteId,cantidad,...rest}){
  const it=item({productoId,materialId}); let pendiente=new Decimal(cantidad);
  if(!pendiente.isPositive()) fail(400,'La cantidad de salida debe ser mayor que cero.');
  const g=await bloquearArticulo(tx,it);
  const filas=(await tx.query(`SELECT e.id,e.lote_id,e.cantidad FROM existencias e LEFT JOIN lotes l ON l.id=e.lote_id
    WHERE e.almacen_id=$1 AND e.${it.col}=$2 AND e.cantidad>0 ${loteId?'AND e.lote_id=$3':''} ORDER BY l.fecha NULLS FIRST,e.id FOR UPDATE OF e`,loteId?[alm,it.id,loteId]:[alm,it.id])).rows;
  const disponible=filas.reduce((s,f)=>s.plus(f.cantidad),new Decimal(0));
  if(disponible.lessThan(pendiente)) fail(409,`Stock insuficiente para ${g.nombre}: disponible ${disponible.toString()} en el almacén${loteId?'/lote':''}.`);
  const partes=[];
  for(const f of filas){
    if(pendiente.isZero()) break;
    const toma=Decimal.min(pendiente,f.cantidad);
    const r=await moverStock(tx,{...rest,almacenId:alm,productoId,materialId,loteId:f.lote_id===null?null:Number(f.lote_id),cantidad:toma.negated()});
    partes.push({loteId:f.lote_id===null?null:Number(f.lote_id),cantidad:toma.toNumber(),movimientoId:r.movimientoId});
    pendiente=pendiente.minus(toma);
  }
  return partes;
}
export async function crearLote(tx,{productoId=null,materialId=null,origen,referencia='',codigo='',vencimiento=null,prefijo='LOT'}){
  item({productoId,materialId});
  if(!codigo){const n=(await tx.query("SELECT nextval('lote_codigo_seq') AS n")).rows[0].n; codigo=`${prefijo}-${new Date().getFullYear()}-${String(n).padStart(5,'0')}`;}
  const q=await tx.query('INSERT INTO lotes(codigo,producto_id,material_id,origen,referencia,vencimiento) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,codigo',[codigo,productoId,materialId,origen,referencia,vencimiento]);
  return {id:Number(q.rows[0].id),codigo:q.rows[0].codigo};
}
