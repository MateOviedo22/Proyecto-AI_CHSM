import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {setup,invariante} from './helpers.js';
let t,taller,tienda,tr;
const PNG=Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4ab0000000049454e44ae426082','hex').toString('base64');
const cant=async(alm,prod)=>Number((await t.one('SELECT COALESCE(SUM(cantidad),0) AS s FROM existencias WHERE almacen_id=$1 AND producto_id=$2',[alm,prod])).s);
before(async()=>{t=await setup();
  taller=Number((await t.one("SELECT id FROM almacenes WHERE codigo='ALM-TALLER'")).id);tienda=Number((await t.one("SELECT id FROM almacenes WHERE codigo='ALM-TIENDA'")).id);
  // Producto terminado en el taller: entrada manual para disponer de existencias en el origen.
  await t.as('inventario').post('/api/inventario/movimientos',{tipo:'Entrada',almacenId:taller,productoId:3,cantidad:10,motivo:'Producto recuperado'});});
after(async()=>{await t.pg.close()});
test('formulario: valida almacenes, motivo y existencia en el origen',async()=>{
  assert.equal((await t.as('inventario').post('/api/traslados',{origenId:taller,destinoId:taller,motivo:'Reubicación',detalles:[{productoId:3,cantidad:1}]})).status,400);
  assert.equal((await t.as('inventario').post('/api/traslados',{origenId:taller,destinoId:tienda,motivo:'Inventado',detalles:[{productoId:3,cantidad:1}]})).status,400);
  assert.equal((await t.as('inventario').post('/api/traslados',{origenId:taller,destinoId:tienda,motivo:'Otro',detalles:[{productoId:3,cantidad:1}]})).status,400,'Otro exige observaciones');
  assert.equal((await t.as('inventario').post('/api/traslados',{origenId:taller,destinoId:tienda,motivo:'Reabastecimiento de tienda',detalles:[{productoId:3,cantidad:11}]})).status,409,'supera existencia del origen');
  assert.equal((await t.as('compras').post('/api/traslados',{origenId:taller,destinoId:tienda,motivo:'Reubicación',detalles:[{productoId:3,cantidad:1}]})).status,403);
  const r=await t.as('inventario').post('/api/traslados',{origenId:taller,destinoId:tienda,motivo:'Reabastecimiento de tienda',observaciones:'Temporada',detalles:[{productoId:3,cantidad:6},{materialId:3,cantidad:1}]});
  assert.equal(r.status,201,JSON.stringify(r.body));tr=r.body.data;assert.match(tr.id,/^TR-/);assert.equal(tr.estado,'Borrador');assert.equal(tr.detalles.length,2);
});
test('revisión y autorización por personas distintas; no se despacha sin autorizar',async()=>{
  assert.equal((await t.as('inventario').patch(`/api/traslados/${tr.id}/despachar`)).status,409);
  assert.equal((await t.as('inventario').patch(`/api/traslados/${tr.id}/revisar`)).status,403,'quien elabora no revisa');
  assert.equal((await t.as('vendedor').patch(`/api/traslados/${tr.id}/revisar`)).status,200);
  assert.equal((await t.as('vendedor').patch(`/api/traslados/${tr.id}/autorizar`)).status,403,'vendedor no autoriza');
  assert.equal((await t.as('inventario').patch(`/api/traslados/${tr.id}/autorizar`)).status,403,'elaborador no autoriza');
  const r=await t.as('admin').patch(`/api/traslados/${tr.id}/autorizar`);assert.equal(r.status,200);assert.equal(r.body.data.autorizadoPor,'Usuario admin');
});
test('despacho descuenta el origen una sola vez; recepción con diferencia exige motivo',async()=>{
  const antesTaller=await cant(taller,3), antesTienda=await cant(tienda,3);
  let r=await t.as('inventario').patch(`/api/traslados/${tr.id}/despachar`);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.estado,'En tránsito');
  assert.equal(await cant(taller,3),antesTaller-6);assert.equal(await cant(tienda,3),antesTienda,'en tránsito no suma al destino');
  assert.equal((await t.as('inventario').patch(`/api/traslados/${tr.id}/despachar`)).status,409,'sin doble descuento');
  assert.equal(await cant(taller,3),antesTaller-6);
  const [lp,lm]=r.body.data.detalles;
  assert.equal((await t.as('vendedor').patch(`/api/traslados/${tr.id}/recibir`,{detalles:[{id:lp.id,recibida:5},{id:lm.id,recibida:1}]})).status,400,'diferencia sin motivo');
  assert.equal((await t.as('vendedor').patch(`/api/traslados/${tr.id}/recibir`,{detalles:[{id:lp.id,recibida:7,motivo:'x'},{id:lm.id,recibida:1}]})).status,400,'más de lo enviado');
  r=await t.as('vendedor').patch(`/api/traslados/${tr.id}/recibir`,{detalles:[{id:lp.id,recibida:5,motivo:'Una unidad dañada en el transporte'},{id:lm.id,recibida:1}]});
  assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.estado,'Recibido con diferencias');assert.equal(r.body.data.detalles[0].diferencia,1);
  assert.equal(await cant(tienda,3),antesTienda+5);
  assert.equal((await t.as('vendedor').patch(`/api/traslados/${tr.id}/recibir`,{detalles:[{id:lp.id,recibida:6},{id:lm.id,recibida:1}]})).status,409,'sin doble recepción');
  const movs=(await t.as('inventario').get(`/api/movimientos?referencia=${tr.id}`)).body.data;
  assert.equal(movs.filter(m=>m.tipo==='Traslado salida').length,2);assert.equal(movs.filter(m=>m.tipo==='Traslado entrada').length,2);
  assert.deepEqual(await invariante(t.pg),[]);
});
test('traslado conserva el lote de origen en el destino (trazabilidad)',async()=>{
  // Lote producido en taller por una recepción de compra de material.
  let r=await t.as('compras').post('/api/compras/ordenes',{proveedorId:1,lineas:[{materialId:2,cantidad:5,precio:420}]});const oc=r.body.data.id;
  await t.as('compras').patch(`/api/compras/ordenes/${oc}/estado`,{estado:'Enviada'});
  r=await t.as('compras').post('/api/compras/recepciones',{ordenId:oc,cantidad:5,lote:'LC-TRAZA-1'});assert.equal(r.status,201);
  const lote=Number((await t.one("SELECT id FROM lotes WHERE codigo='LC-TRAZA-1'")).id);
  r=await t.as('inventario').post('/api/traslados',{origenId:taller,destinoId:tienda,motivo:'Exhibición o evento',detalles:[{materialId:2,loteId:lote,cantidad:2}]});const id=r.body.data.id;
  await t.as('vendedor').patch(`/api/traslados/${id}/revisar`);await t.as('admin').patch(`/api/traslados/${id}/autorizar`);await t.as('inventario').patch(`/api/traslados/${id}/despachar`);
  const d=(await t.as('inventario').get(`/api/traslados/${id}`)).body.data.detalles[0];
  r=await t.as('vendedor').patch(`/api/traslados/${id}/recibir`,{detalles:[{id:d.id,recibida:2}]});assert.equal(r.body.data.estado,'Recibido');
  assert.equal(Number((await t.one('SELECT cantidad FROM existencias WHERE almacen_id=$1 AND lote_id=$2',[tienda,lote])).cantidad),2);
  const tz=(await t.as('inventario').get('/api/trazabilidad/lotes/LC-TRAZA-1')).body.data;assert.equal(tz.traslados.length,2);
});
test('evidencias: tipo y firma validados, límite de tamaño y descarga',async()=>{
  assert.equal((await t.as('inventario').post(`/api/traslados/${tr.id}/evidencias`,{nombre:'foto.png',tipo:'image/png',contenido:Buffer.from('no es png').toString('base64')})).status,400);
  assert.equal((await t.as('inventario').post(`/api/traslados/${tr.id}/evidencias`,{nombre:'x.exe',tipo:'application/x-msdownload',contenido:PNG})).status,400);
  assert.equal((await t.as('inventario').post(`/api/traslados/${tr.id}/evidencias`,{nombre:'grande.png',tipo:'image/png',contenido:Buffer.concat([Buffer.from(PNG,'base64'),Buffer.alloc(2*1024*1024)]).toString('base64')})).status,400);
  let r=await t.as('vendedor').post(`/api/traslados/${tr.id}/evidencias`,{nombre:'recepcion.png',tipo:'image/png',etapa:'Recepción',contenido:PNG,descripcion:'Caja con unidad dañada'});assert.equal(r.status,201,JSON.stringify(r.body));
  r=await t.as('inventario').get(`/api/traslados/${tr.id}/evidencias`);assert.equal(r.body.data.length,1);
  r=await t.as('inventario').get(`/api/traslados/evidencias/${r.body.data[0].id}`);assert.equal(r.status,200);assert.equal(r.headers['content-type'],'image/png');
});
test('cancelar exige motivo y no aplica a traslados despachados',async()=>{
  let r=await t.as('inventario').post('/api/traslados',{origenId:tienda,destinoId:taller,motivo:'Devolución a taller',detalles:[{productoId:1,cantidad:1}]});const id=r.body.data.id;
  assert.equal((await t.as('inventario').patch(`/api/traslados/${id}/cancelar`,{})).status,400);
  assert.equal((await t.as('inventario').patch(`/api/traslados/${id}/cancelar`,{motivo:'Se resolvió en tienda'})).status,200);
  assert.equal((await t.as('inventario').patch(`/api/traslados/${tr.id}/cancelar`,{motivo:'x'})).status,409);
});
