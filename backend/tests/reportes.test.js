import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './helpers.js';
import {estadistica} from '../src/routes/reportes.js';
let t;
before(async()=>{t=await setup();
  // Datos sembrados: dos ventas y una orden de compra recibida tarde.
  await t.as('vendedor').post('/api/ventas',{cliente:'A',metodo:'Efectivo',items:[{productoId:1,cantidad:1}]});
  await t.as('vendedor').post('/api/ventas',{cliente:'B',metodo:'Tarjeta',items:[{productoId:3,cantidad:2}]});
  const r=await t.as('compras').post('/api/compras/ordenes',{proveedorId:3,fechaEntrega:'2000-01-01',lineas:[{materialId:3,cantidad:4,precio:100}]});
  await t.as('compras').patch(`/api/compras/ordenes/${r.body.data.id}/estado`,{estado:'Enviada'});
  await t.as('compras').post('/api/compras/recepciones',{ordenId:r.body.data.id,cantidad:4});});
after(async()=>{await t.pg.close()});
test('estadística descriptiva',()=>{
  assert.deepEqual(estadistica([2,4,4,4,5,5,7,9]),{n:8,total:40,promedio:5,mediana:4.5,desviacion:2.14,minimo:2,maximo:9});
  assert.equal(estadistica([]).n,0);
});
test('reporte de ventas: totales, ticket promedio y productos más vendidos',async()=>{
  const r=await t.as('vendedor').get('/api/reportes/ventas');assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(r.body.data.resumen.ventas,2);assert.equal(r.body.data.resumen.total,1750);assert.equal(r.body.data.estadisticas.ticket.promedio,875);
  assert.equal(r.body.data.top[0].unidades,2);assert.equal(r.body.data.porMetodo.length,2);
  assert.equal((await t.as('compras').get('/api/reportes/ventas')).status,403);
});
test('reporte de compras: puntualidad y puntaje del proveedor',async()=>{
  const r=await t.as('compras').get('/api/reportes/compras-proveedores');assert.equal(r.status,200,JSON.stringify(r.body));
  const p=r.body.data.proveedores.find(x=>x.id===3);assert.equal(p.monto,400);assert.equal(p.recepciones,1);assert.equal(p.puntualidadPct,0);assert.ok(p.puntaje<50);
  assert.equal(r.body.data.resumen.recepciones,1);
});
test('informe de inventario: valor por almacén coherente con existencias',async()=>{
  const r=await t.as('inventario').get('/api/reportes/inventario');assert.equal(r.status,200,JSON.stringify(r.body));
  const v=Number((await t.one('SELECT SUM(e.cantidad*COALESCE(m.costo,p.precio)) AS v FROM existencias e LEFT JOIN materiales m ON m.id=e.material_id LEFT JOIN productos p ON p.id=e.producto_id')).v);
  assert.equal(r.body.data.resumen.valorTotal,Math.round(v*100)/100);
  const hilo=r.body.data.articulos.find(a=>a.tipo==='Material'&&a.id===3);assert.equal(hilo.entradas,4);assert.equal(hilo.porAlmacen['Taller de producción'],9);
});
test('reportes de producción, consumo y traslados responden y respetan permisos',async()=>{
  for(const [u,path] of [['produccion','produccion'],['produccion','consumo-materiales'],['inventario','traslados']]){
    const r=await t.as(u).get(`/api/reportes/${path}?desde=2026-01-01&hasta=2099-12-31`);assert.equal(r.status,200,`${path}: ${JSON.stringify(r.body)}`);}
  assert.equal((await t.as('vendedor').get('/api/reportes/produccion')).status,403);
  assert.equal((await t.as('produccion').get('/api/reportes/produccion?desde=2026-02-01&hasta=2026-01-01')).status,400);
});
test('dashboard incluye solo los bloques permitidos para el rol',async()=>{
  let r=await t.as('admin').get('/api/reportes/dashboard');assert.equal(r.status,200,JSON.stringify(r.body));
  assert.ok(r.body.data.ventas&&r.body.data.finanzas&&r.body.data.alertasStock);assert.equal(r.body.data.ventas.n_mes,2);
  r=await t.as('compras').get('/api/reportes/dashboard');assert.equal(r.body.data.ventas,undefined);assert.equal(r.body.data.finanzas,undefined);assert.ok('comprasAbiertas' in r.body.data);
});
