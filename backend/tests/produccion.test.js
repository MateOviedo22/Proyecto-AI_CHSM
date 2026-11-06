import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {setup,invariante} from './helpers.js';
let t,plan,orden;
before(async()=>{t=await setup()});
after(async()=>{await t.pg.close()});
const stock=async(tabla,id)=>Number((await t.one(`SELECT existencia FROM ${tabla} WHERE id=$1`,[id])).existencia);
test('plan de producción: detalle, firmas separadas y autorización de gerencia',async()=>{
  let r=await t.as('produccion').post('/api/produccion/planes',{inicio:'2026-11-01',fin:'2026-11-30',detalles:[{productoId:2,cantidad:4,lineaId:1},{productoId:1,cantidad:10,lineaId:2}]});
  assert.equal(r.status,201,JSON.stringify(r.body));plan=r.body.data;assert.match(plan.id,/^PLAN-/);assert.equal(plan.totalPlanificado,14);
  assert.equal((await t.as('produccion').post('/api/produccion/planes',{inicio:'2026-11-01',fin:'2026-11-30',detalles:[{productoId:5,cantidad:1}]})).status,409,'sin ficha vigente');
  assert.equal((await t.as('produccion').patch(`/api/produccion/planes/${plan.id}/revisar`)).status,403,'quien elabora no revisa');
  assert.equal((await t.as('admin').patch(`/api/produccion/planes/${plan.id}/autorizar`)).status,409,'debe revisarse primero');
  assert.equal((await t.as('admin').patch(`/api/produccion/planes/${plan.id}/revisar`)).status,200);
  assert.equal((await t.as('produccion').patch(`/api/produccion/planes/${plan.id}/autorizar`)).status,403,'solo gerencia autoriza');
  r=await t.as('admin2').patch(`/api/produccion/planes/${plan.id}/autorizar`);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.estado,'Autorizado');
  assert.equal(r.body.data.revisadoPor,'Usuario admin');assert.equal(r.body.data.autorizadoPor,'Segunda admin');
});
test('orden: varios productos, validación contra el plan y justificación fuera de plan',async()=>{
  let r=await t.as('produccion').post('/api/produccion/ordenes',{planId:plan.id,detalles:[{productoId:2,cantidad:6}]});
  assert.equal(r.status,400,'excede lo planificado sin justificación');
  r=await t.as('produccion').post('/api/produccion/ordenes',{detalles:[{productoId:1,cantidad:2}]});assert.equal(r.status,400,'sin plan requiere justificación');
  r=await t.as('produccion').post('/api/produccion/ordenes',{detalles:[{productoId:1,cantidad:2}],justificacion:'Pedido urgente de cliente corporativo'});assert.equal(r.status,201);assert.equal(r.body.data.fueraPlan,true);
  r=await t.as('produccion').post('/api/produccion/ordenes',{planId:plan.id,lineaId:1,prioridad:'Alta',responsable:'Taller A',detalles:[{productoId:2,cantidad:2},{productoId:1,cantidad:5}]});
  assert.equal(r.status,201,JSON.stringify(r.body));orden=r.body.data;assert.match(orden.id,/^OP-/);assert.equal(orden.detalles.length,2);assert.equal(orden.fueraPlan,false);assert.equal(orden.estado,'Borrador');
  r=await t.as('produccion').get('/api/produccion/planes');const p=r.body.data.find(x=>x.id===plan.id);assert.equal(p.detalles.find(d=>d.productoId===2).pendiente,2);
  assert.equal((await t.as('vendedor').post('/api/produccion/ordenes',{detalles:[{productoId:1,cantidad:1}],justificacion:'xxxxxxxxxxxx'})).status,403);
  assert.equal((await t.as('produccion').post('/api/recursos/ordenes-produccion',{id:'OP-X',product:'X',quantity:1})).status,409,'el CRUD genérico ya no crea órdenes');
});
test('autorización genera la requisición base desde la ficha (multinivel)',async()=>{
  assert.equal((await t.as('produccion').patch(`/api/produccion/ordenes/${orden.id}/revisar`)).status,403);
  assert.equal((await t.as('admin').patch(`/api/produccion/ordenes/${orden.id}/revisar`)).status,200);
  let r=await t.as('admin').patch(`/api/produccion/ordenes/${orden.id}/autorizar`);assert.equal(r.status,200,JSON.stringify(r.body));
  orden=r.body.data;assert.equal(orden.estado,'Autorizada');assert.equal(orden.requisiciones.length,1);
  const base=orden.requisiciones[0];assert.equal(base.tipo,'Base');assert.equal(base.estado,'Aprobada');
  const by=Object.fromEntries(base.materiales.map(m=>[m.materialId,m.cantidad]));
  // Bolso×2: cuero natural 0.8*1.12*2=1.792; cuero tratado (0.10*1.1+0.03*1.1)*2=0.286 + billetera×5: 0.15*1.1*5=0.825 => 1.111; hilo 0.2*2+0.05*5=0.65
  assert.equal(by[2],1.792);assert.equal(by[1],1.111);assert.equal(by[3],0.65);
  assert.equal((await t.as('admin').patch(`/api/produccion/ordenes/${orden.id}/autorizar`)).status,409,'no se autoriza dos veces');
});
test('entrega de materiales descuenta por lote y pone la orden en proceso; adicional requiere justificación y aprobación de otra persona',async()=>{
  const antes=await stock('materiales',2);
  const base=orden.requisiciones[0];
  assert.equal((await t.as('vendedor').patch(`/api/produccion/requisiciones/${base.id}/entregar`)).status,403);
  let r=await t.as('inventario').patch(`/api/produccion/requisiciones/${base.id}/entregar`);assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(r.body.data.estado,'En proceso');assert.equal(Number((antes-await stock('materiales',2)).toFixed(3)),1.792);
  assert.equal((await t.as('inventario').patch(`/api/produccion/requisiciones/${base.id}/entregar`)).status,409,'sin doble descuento');
  assert.equal((await t.as('produccion').post('/api/produccion/requisiciones/adicional',{ordenId:orden.id,justificacion:'corto',materiales:[{materialId:3,cantidad:0.2}]})).status,400);
  r=await t.as('produccion').post('/api/produccion/requisiciones/adicional',{ordenId:orden.id,justificacion:'Rotura de hilo durante la costura del bolso',materiales:[{materialId:3,cantidad:0.2}]});assert.equal(r.status,201);
  const adic=(await t.as('produccion').get(`/api/produccion/ordenes/${orden.id}`)).body.data.requisiciones.find(q=>q.tipo==='Adicional');
  assert.equal((await t.as('produccion').patch(`/api/produccion/requisiciones/${adic.id}/aprobar`)).status,403,'quien solicita no aprueba');
  assert.equal((await t.as('inventario').patch(`/api/produccion/requisiciones/${adic.id}/entregar`)).status,409,'no se entrega sin aprobación');
  assert.equal((await t.as('admin').patch(`/api/produccion/requisiciones/${adic.id}/aprobar`)).status,200);
  assert.equal((await t.as('inventario').patch(`/api/produccion/requisiciones/${adic.id}/entregar`)).status,200);
  assert.deepEqual(await invariante(t.pg),[]);
});
test('avance, control de calidad y cierre: solo lo aprobado entra al inventario con lote',async()=>{
  const bolso=orden.detalles.find(d=>d.productoId===2), billetera=orden.detalles.find(d=>d.productoId===1);
  assert.equal((await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/cerrar`,{})).status,409,'sin control de calidad');
  let r=await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/registros`,{ordenDetalleId:bolso.id,cantidad:2,etapa:'Costura'});assert.equal(r.status,201,JSON.stringify(r.body));
  r=await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/registros`,{ordenDetalleId:billetera.id,cantidad:5});assert.equal(r.status,201);
  assert.equal((await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/registros`,{ordenDetalleId:billetera.id,cantidad:0})).status,400);
  assert.equal((await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/calidad`,{ordenDetalleId:bolso.id,aprobada:2,rechazada:1,defecto:'Asa floja'})).status,409,'más de lo producido');
  assert.equal((await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/calidad`,{ordenDetalleId:billetera.id,aprobada:4,rechazada:1})).status,400,'rechazo sin defecto');
  r=await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/calidad`,{ordenDetalleId:bolso.id,aprobada:2,rechazada:0,observaciones:'Conforme'});assert.equal(r.status,201);assert.equal(r.body.data.estado,'En calidad');
  assert.equal((await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/cerrar`,{})).status,409,'billeteras sin inspeccionar');
  r=await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/calidad`,{ordenDetalleId:billetera.id,aprobada:4,rechazada:1,defecto:'Costura desviada'});assert.equal(r.status,201);
  const antesBolso=await stock('productos',2), antesHilo=await stock('materiales',3);
  r=await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/cerrar`,{devoluciones:[{materialId:3,cantidad:0.1}]});assert.equal(r.status,200,JSON.stringify(r.body));
  const c=r.body.data;assert.equal(c.estado,'Cerrada');assert.equal(c.totalAprobado,6);assert.equal(c.totalRechazado,1);
  assert.equal(await stock('productos',2),antesBolso+2);assert.equal(Number((await stock('materiales',3)-antesHilo).toFixed(3)),0.1);
  const lote=c.detalles.find(d=>d.productoId===1).lote;assert.match(lote,/^LP-/);
  const taller=Number((await t.one("SELECT id FROM almacenes WHERE codigo='ALM-TALLER'")).id);
  assert.equal(Number((await t.one('SELECT e.almacen_id,e.cantidad FROM existencias e JOIN lotes l ON l.id=e.lote_id WHERE l.codigo=$1',[lote])).cantidad),4);
  assert.equal(Number((await t.one('SELECT e.almacen_id FROM existencias e JOIN lotes l ON l.id=e.lote_id WHERE l.codigo=$1',[lote])).almacen_id),taller);
  // Hilo: entregado 0.65+0.2=0.85, devuelto 0.1 => real 0.75; teórico (2 bolsos + 5 billeteras inspeccionadas) 0.65 => desperdicio 0.1
  const hilo=c.resumenMateriales.find(m=>m.materialId===3);assert.equal(hilo.entregado,0.85);assert.equal(hilo.consumoReal,0.75);assert.equal(hilo.teorico,0.65);assert.equal(hilo.desperdicio,0.1);
  assert.equal((await t.as('produccion').post(`/api/produccion/ordenes/${orden.id}/cerrar`,{})).status,409,'sin doble cierre');
  assert.deepEqual(await invariante(t.pg),[]);
});
test('planificado vs. real y trazabilidad del lote producido hasta sus insumos',async()=>{
  const p=(await t.as('produccion').get('/api/produccion/planes')).body.data.find(x=>x.id===plan.id);
  const bil=p.detalles.find(d=>d.productoId===1);assert.equal(bil.cantidad,10);assert.equal(bil.ordenado,5);assert.equal(bil.producido,5);assert.equal(bil.aprobado,4);assert.equal(bil.cumplimientoPct,40);
  const o=(await t.as('produccion').get(`/api/produccion/ordenes/${orden.id}`)).body.data;
  const r=await t.as('inventario').get(`/api/trazabilidad/lotes/${o.detalles[0].lote}`);assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(r.body.data.origen.orden_id,orden.id);assert.ok(r.body.data.insumos.length>=2);
  const hist=(await t.as('produccion').get('/api/produccion/calidad')).body.data;assert.equal(hist.length,2);assert.equal(hist.reduce((s,x)=>s+x.rechazada,0),1);
});
test('cancelar una orden sin entregas rechaza sus requisiciones',async()=>{
  let r=await t.as('produccion').post('/api/produccion/ordenes',{planId:plan.id,detalles:[{productoId:2,cantidad:1}]});const id=r.body.data.id;
  await t.as('admin').patch(`/api/produccion/ordenes/${id}/revisar`);await t.as('admin2').patch(`/api/produccion/ordenes/${id}/autorizar`);
  r=await t.as('produccion').patch(`/api/produccion/ordenes/${id}/cancelar`);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.requisiciones[0].estado,'Rechazada');
});
