import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {setup,invariante} from './helpers.js';
let t,venta;
before(async()=>{t=await setup()});
after(async()=>{await t.pg.close()});
const stock=async id=>Number((await t.one('SELECT existencia FROM productos WHERE id=$1',[id])).existencia);
test('la venta crea una factura interna con numeración consecutiva y consulta disponibilidad',async()=>{
  let r=await t.as('vendedor').post('/api/ventas',{cliente:'María González',clienteId:'CLI-001',metodo:'Tarjeta',items:[{productoId:1,cantidad:2},{productoId:3,cantidad:1}]});
  assert.equal(r.status,201,JSON.stringify(r.body));venta=r.body.data;assert.match(venta.factura,/^FAC-\d{6}$/);
  r=await t.as('vendedor').post('/api/ventas',{cliente:'Mostrador',metodo:'Efectivo',items:[{productoId:6,cantidad:1}]});
  assert.equal(Number(r.body.data.factura.slice(4)),Number(venta.factura.slice(4))+1);
  r=await t.as('vendedor').get('/api/disponibilidad');assert.ok(r.body.data.some(d=>d.productoId===1&&d.almacen==='Tienda / Sucursal'));
  r=await t.as('vendedor').get(`/api/ventas/${venta.ventaId}`);assert.equal(r.body.data.lineas.length,2);assert.equal(r.body.data.factura,venta.factura);assert.equal(r.body.data.movimientos.length,2);
  r=await t.as('vendedor').get('/api/facturas');const f=r.body.data.find(x=>x.numero===venta.factura);assert.equal(f.total,2150);assert.equal(f.cliente,'María González');
  assert.equal((await t.as('compras').get('/api/facturas')).status,403);
});
test('orden de venta: se factura una sola vez con los precios cotizados y descuenta existencias',async()=>{
  let r=await t.as('vendedor').post('/api/cotizaciones',{id:'COT-V1',cliente:'Hotel Las Flores',vencimiento:'2099-12-31',items:[{productoId:2,cantidad:2}]});assert.equal(r.status,201);
  await t.pg.query('UPDATE productos SET precio=9999 WHERE id=2'); // cambio de precio posterior a la cotización
  r=await t.as('vendedor').post('/api/cotizaciones/COT-V1/convertir',{});const orden=r.body.data.id;
  const antes=await stock(2);
  r=await t.as('vendedor').post(`/api/ordenes-venta/${orden}/facturar`,{metodo:'Transferencia'});assert.equal(r.status,201,JSON.stringify(r.body));
  assert.equal(r.body.data.total,4900);assert.match(r.body.data.factura,/^FAC-/);assert.equal(await stock(2),antes-2);
  assert.equal((await t.as('vendedor').post(`/api/ordenes-venta/${orden}/facturar`,{})).status,409,'sin doble cobro');
  assert.equal(await stock(2),antes-2);
  assert.equal((await t.one('SELECT estado FROM ordenes_venta WHERE id=$1',[orden])).estado,'Completada');
});
test('devolución de venta: no supera lo vendido, reingresa stock y registra egreso',async()=>{
  const det=(await t.as('vendedor').get(`/api/ventas/${venta.ventaId}`)).body.data.lineas.find(l=>l.productoId===1);
  const antes=await stock(1);
  assert.equal((await t.as('vendedor').post('/api/ventas/devoluciones',{ventaId:venta.ventaId,ventaDetalleId:det.id,cantidad:3,motivo:'x'})).status,409);
  let r=await t.as('vendedor').post('/api/ventas/devoluciones',{ventaId:venta.ventaId,ventaDetalleId:det.id,cantidad:1,motivo:'Cliente insatisfecho'});assert.equal(r.status,201,JSON.stringify(r.body));
  assert.equal(r.body.data.monto,850);assert.equal(await stock(1),antes+1);
  assert.equal(Number((await t.one("SELECT monto FROM finanzas_movimientos WHERE categoria='Devoluciones de venta'")).monto),850);
  r=await t.as('vendedor').post('/api/ventas/devoluciones',{ventaId:venta.ventaId,ventaDetalleId:det.id,cantidad:1,tipo:'Cambio',motivo:'Cambio de color',productoCambioId:6});assert.equal(r.status,201,JSON.stringify(r.body));
  assert.equal((await t.as('vendedor').post('/api/ventas/devoluciones',{ventaId:venta.ventaId,ventaDetalleId:det.id,cantidad:1,motivo:'otra'})).status,409,'ya se devolvió todo');
  r=await t.as('vendedor').get('/api/ventas/devoluciones');assert.equal(r.body.data.length,2);
  assert.deepEqual(await invariante(t.pg),[]);
});
test('anulación de factura: solo administración, reingresa lo no devuelto y revierte el ingreso',async()=>{
  const f=(await t.as('vendedor').get('/api/facturas')).body.data.find(x=>x.numero===venta.factura);
  assert.equal((await t.as('vendedor').patch(`/api/facturas/${f.id}/anular`,{motivo:'Error'})).status,403);
  assert.equal((await t.as('admin').patch(`/api/facturas/${f.id}/anular`,{})).status,400);
  const antes1=await stock(1),antes3=await stock(3);
  let r=await t.as('admin').patch(`/api/facturas/${f.id}/anular`,{motivo:'Venta registrada por error'});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.estado,'Anulada');
  assert.equal(await stock(1),antes1,'las 2 billeteras ya fueron devueltas/cambiadas');assert.equal(await stock(3),antes3+1);
  assert.equal((await t.one('SELECT estado FROM finanzas_movimientos WHERE venta_id=$1',[venta.ventaId])).estado,'Anulado');
  assert.equal((await t.as('admin').patch(`/api/facturas/${f.id}/anular`,{motivo:'otra vez'})).status,409);
  assert.deepEqual(await invariante(t.pg),[]);
});
