import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {setup,invariante} from './helpers.js';
let t,taller,tienda;
before(async()=>{t=await setup();
  taller=Number((await t.one("SELECT id FROM almacenes WHERE codigo='ALM-TALLER'")).id);tienda=Number((await t.one("SELECT id FROM almacenes WHERE codigo='ALM-TIENDA'")).id);});
after(async()=>{await t.pg.close()});
test('migración asigna saldos globales a Taller (materiales) y Tienda (productos)',async()=>{
  assert.deepEqual(await invariante(t.pg),[]);
  const e=await t.one('SELECT almacen_id,cantidad FROM existencias WHERE producto_id=1');assert.equal(Number(e.almacen_id),tienda);assert.equal(Number(e.cantidad),12);
  const r=await t.as('vendedor').get('/api/almacenes');assert.equal(r.status,200);assert.ok(r.body.data.find(a=>a.codigo==='ALM-TALLER').articulos>=3);
});
test('almacenes: crear otro almacén (escalable) y no desactivar con existencias',async()=>{
  let r=await t.as('inventario').post('/api/almacenes',{codigo:'alm-bod2',nombre:'Bodega norte',tipo:'Bodega'});assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.data.codigo,'ALM-BOD2');
  assert.equal((await t.as('vendedor').post('/api/almacenes',{codigo:'X',nombre:'X'})).status,403);
  const a=(await t.as('inventario').get('/api/almacenes')).body.data.find(x=>x.codigo==='ALM-TIENDA');
  r=await t.as('inventario').put(`/api/almacenes/${a.id}`,{...a,activo:false});assert.equal(r.status,409);
});
test('salida manual por producto defectuoso valida existencia por almacén y conserva historial',async()=>{
  let r=await t.as('inventario').post('/api/inventario/movimientos',{tipo:'Salida',almacenId:taller,productoId:1,cantidad:1,motivo:'Producto defectuoso'});
  assert.equal(r.status,409,'el producto no está en el taller');
  r=await t.as('inventario').post('/api/inventario/movimientos',{tipo:'Salida',almacenId:tienda,productoId:1,cantidad:2,motivo:'Producto defectuoso',detalle:'Costura abierta'});
  assert.equal(r.status,201,JSON.stringify(r.body));
  assert.equal(Number((await t.one('SELECT existencia FROM productos WHERE id=1')).existencia),10);
  r=await t.as('inventario').get('/api/movimientos?productoId=1&tipo=Salida%20manual');assert.equal(r.body.data.length,1);assert.match(r.body.data[0].motivo,/Costura abierta/);assert.equal(r.body.data[0].almacen,'Tienda / Sucursal');
  assert.equal((await t.as('inventario').post('/api/inventario/movimientos',{tipo:'Salida',almacenId:tienda,productoId:1,cantidad:1,motivo:'Otro'})).status,400);
  assert.equal((await t.as('vendedor').post('/api/inventario/movimientos',{tipo:'Entrada',almacenId:tienda,productoId:1,cantidad:1,motivo:'Otro',detalle:'x'})).status,403);
  assert.deepEqual(await invariante(t.pg),[]);
});
test('venta descuenta del almacén elegido y rechaza sin existencia allí',async()=>{
  let r=await t.as('vendedor').post('/api/ventas',{cliente:'Mostrador',metodo:'Efectivo',almacenId:taller,items:[{productoId:2,cantidad:1}]});assert.equal(r.status,409,JSON.stringify(r.body));
  r=await t.as('vendedor').post('/api/ventas',{cliente:'Mostrador',metodo:'Efectivo',items:[{productoId:2,cantidad:2}]});assert.equal(r.status,201,JSON.stringify(r.body));
  assert.equal(Number((await t.one('SELECT cantidad FROM existencias WHERE producto_id=2 AND almacen_id=$1',[tienda])).cantidad),3);
  assert.equal(Number((await t.one("SELECT almacen_id FROM ventas ORDER BY id DESC LIMIT 1")).almacen_id),tienda);
  assert.deepEqual(await invariante(t.pg),[]);
});
test('compras: orden multilínea, recepción por línea con lote y almacén, FIFO por lote',async()=>{
  let r=await t.as('compras').post('/api/compras/ordenes',{proveedorId:2,fechaEntrega:'2099-12-31',lineas:[{materialId:1,cantidad:10,precio:400},{materialId:3,cantidad:20,precio:90}]});
  assert.equal(r.status,201,JSON.stringify(r.body));const oc=r.body.data.id;
  assert.equal((await t.as('compras').post('/api/compras/ordenes',{proveedorId:2,lineas:[{materialId:1,cantidad:1,precio:1},{materialId:1,cantidad:1,precio:1}]})).status,400);
  assert.equal((await t.as('compras').patch(`/api/compras/ordenes/${oc}/estado`,{estado:'Enviada'})).status,200);
  const lineas=(await t.as('compras').get('/api/compras')).body.data.ordenes.filter(o=>o.id===oc);assert.equal(lineas.length,2);
  const cuero=lineas.find(l=>l.material_id===1), hilo=lineas.find(l=>l.material_id===3);
  assert.equal((await t.as('compras').post('/api/compras/recepciones',{ordenId:oc,cantidad:1})).status,400,'debe indicar línea');
  r=await t.as('inventario').post('/api/compras/recepciones',{ordenId:oc,ordenDetalleId:cuero.detalle_id,cantidad:10,documento:'FAC-77',lote:'LC-CUERO-77'});assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.data.lote,'LC-CUERO-77');
  assert.equal((await t.one('SELECT estado FROM ordenes_compra WHERE id=$1',[oc])).estado,'Parcial');
  r=await t.as('compras').post('/api/compras/recepciones',{ordenId:oc,ordenDetalleId:hilo.detalle_id,cantidad:20,almacenId:taller});assert.equal(r.status,201,JSON.stringify(r.body));assert.match(r.body.data.lote,/^LC-/);
  assert.equal((await t.one('SELECT estado FROM ordenes_compra WHERE id=$1',[oc])).estado,'Recibida');
  assert.equal(Number((await t.one('SELECT existencia FROM materiales WHERE id=1')).existencia),55);
  // FIFO: la salida consume primero el saldo sin lote (45) y luego el lote LC-CUERO-77.
  r=await t.as('inventario').post('/api/inventario/movimientos',{tipo:'Salida',almacenId:taller,materialId:1,cantidad:47,motivo:'Merma'});assert.equal(r.status,201,JSON.stringify(r.body));
  assert.equal(r.body.data.partes.length,2);assert.equal(r.body.data.partes[1].cantidad,2);
  assert.equal(Number((await t.one("SELECT e.cantidad FROM existencias e JOIN lotes l ON l.id=e.lote_id WHERE l.codigo='LC-CUERO-77'")).cantidad),8);
  assert.deepEqual(await invariante(t.pg),[]);
  r=await t.as('inventario').get('/api/trazabilidad/lotes/LC-CUERO-77');assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(r.body.data.origen.orden_id,oc);assert.equal(r.body.data.resumen.disponible,8);assert.equal(r.body.data.movimientos.length,2);
});
test('devoluciones de compra: no exceder lo recibido, salida al enviar, sin doble descuento',async()=>{
  const rec=(await t.as('compras').get('/api/compras')).body.data.recepciones.find(x=>x.lote==='LC-CUERO-77');
  assert.equal((await t.as('compras').post('/api/compras/devoluciones',{recepcionId:rec.id,cantidad:11,motivo:'Material defectuoso'})).status,409);
  let r=await t.as('compras').post('/api/compras/devoluciones',{recepcionId:rec.id,cantidad:3,motivo:'Material defectuoso',detalle:'Manchas'});assert.equal(r.status,201,JSON.stringify(r.body));const dv=r.body.data;
  assert.equal(dv.estado,'Pendiente');assert.equal(Number((await t.one('SELECT existencia FROM materiales WHERE id=1')).existencia),8);
  r=await t.as('compras').patch(`/api/compras/devoluciones/${dv.id}/estado`,{estado:'Enviada'});assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(Number((await t.one('SELECT existencia FROM materiales WHERE id=1')).existencia),5);
  assert.equal((await t.as('compras').patch(`/api/compras/devoluciones/${dv.id}/estado`,{estado:'Enviada'})).status,409);
  assert.equal(Number((await t.one('SELECT existencia FROM materiales WHERE id=1')).existencia),5);
  r=await t.as('compras').patch(`/api/compras/devoluciones/${dv.id}/estado`,{estado:'Acreditada'});assert.equal(r.status,200);
  assert.equal(Number((await t.one("SELECT count(*) AS n FROM movimientos_inventario WHERE tipo='Devolución a proveedor'")).n),1);
  assert.deepEqual(await invariante(t.pg),[]);
});
test('historial del proveedor: cumplimiento de entregas, montos, devoluciones y reclamos',async()=>{
  const r=await t.as('compras').get('/api/proveedores/2/historial');assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(r.body.data.resumen.recepciones,2);assert.equal(r.body.data.resumen.cumplimientoPct,100);assert.equal(r.body.data.resumen.devoluciones,1);assert.equal(r.body.data.resumen.montoComprado,5800);
  assert.equal((await t.as('vendedor').get('/api/proveedores/2/historial')).status,403);
});
test('alertas de stock mínimo global y por almacén',async()=>{
  let r=await t.as('inventario').put('/api/minimos',{almacenId:tienda,productoId:4,minimo:10});assert.equal(r.status,200);
  r=await t.as('vendedor').get('/api/alertas/stock');assert.equal(r.status,200);
  assert.ok(r.body.data.some(a=>a.tipo==='Material'&&a.id===1));assert.ok(r.body.data.some(a=>a.almacen==='Tienda / Sucursal'&&a.id===4&&a.faltante===6));
});
