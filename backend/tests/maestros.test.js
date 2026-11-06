import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './helpers.js';
let t;
before(async()=>{t=await setup()});
after(async()=>{await t.pg.close()});
test('migración vincula materiales con su proveedor y conserva datos',async()=>{
  const m=await t.one('SELECT proveedor_id FROM materiales WHERE id=1');assert.equal(Number(m.proveedor_id),1);
  const p=await t.one('SELECT nombre,razon_social FROM proveedores WHERE id=1');assert.equal(p.nombre,'Curtidos del Norte');assert.equal(p.razon_social,'Curtidos del Norte, S.A.');
  const r=await t.as('compras').get('/api/recursos/proveedores');assert.equal(r.status,200);
  const prov=r.body.data.find(x=>x.id===2);assert.equal(prov.materials,3);assert.ok('razonSocial' in prov);
});
test('proveedor exige razón social y guarda condiciones de pago',async()=>{
  let r=await t.as('compras').post('/api/recursos/proveedores',{id:50,code:'PROV-050',name:'Herrajes Nica'});assert.equal(r.status,400);
  r=await t.as('compras').post('/api/recursos/proveedores',{id:50,code:'PROV-050',name:'Herrajes Nica',razonSocial:'Herrajes de Nicaragua, S.A.',paymentTerms:'Crédito 30 días',paymentDays:30});
  assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.data.paymentDays,30);
  assert.equal((await t.as('vendedor').post('/api/recursos/proveedores',{id:51,code:'P51',name:'X',razonSocial:'X'})).status,403);
});
test('varios proveedores por material con un único preferido',async()=>{
  let r=await t.as('compras').put('/api/materiales/3/proveedores',{proveedores:[{proveedorId:3,precioRef:95,plazoEntregaDias:4,preferido:true},{proveedorId:50,precioRef:88}]});
  assert.equal(r.status,200,JSON.stringify(r.body));
  r=await t.as('produccion').get('/api/materiales/3/proveedores');assert.equal(r.body.data.length,2);assert.equal(r.body.data[0].preferido,true);
  r=await t.as('compras').put('/api/materiales/3/proveedores',{proveedores:[{proveedorId:3,preferido:true},{proveedorId:50,preferido:true}]});assert.equal(r.status,400);
  assert.equal((await t.as('vendedor').put('/api/materiales/3/proveedores',{proveedores:[]})).status,403);
});
test('ficha técnica: borrador, validaciones, vigencia única y explosión multinivel',async()=>{
  let r=await t.as('produccion').get('/api/fichas-tecnicas');assert.equal(r.status,200);assert.equal(r.body.data.filter(f=>f.estado==='Vigente').length,3);
  // Bolso: 0.8 cuero natural +12% ; cuero tratado 0.10 +10% (asa) + llavero 0.03 +10% ; hilo 0.2
  const bolso=r.body.data.find(f=>f.codigo==='FT-BOL-001-V1.0');
  r=await t.as('produccion').get(`/api/fichas-tecnicas/${bolso.id}/explosion?cantidad=10`);assert.equal(r.status,200,JSON.stringify(r.body));
  const by=Object.fromEntries(r.body.data.materiales.map(m=>[m.materialId,m.cantidad]));
  assert.equal(by[2],8.96);assert.equal(by[1],1.43);assert.equal(by[3],2);
  r=await t.as('produccion').post('/api/fichas-tecnicas',{productoId:3,nombre:'Monedero',materiales:[{materialId:1,cantidad:0.1},{materialId:1,cantidad:0.2}]});assert.equal(r.status,400);
  r=await t.as('produccion').post('/api/fichas-tecnicas',{productoId:3,nombre:'Monedero',materiales:[]});assert.equal(r.status,400);
  r=await t.as('produccion').post('/api/fichas-tecnicas',{productoId:3,nombre:'Monedero',materiales:[{materialId:1,cantidad:-1}]});assert.equal(r.status,400);
  r=await t.as('produccion').post('/api/fichas-tecnicas',{productoId:3,nombre:'Monedero',versionFicha:'1.0',materiales:[{materialId:1,cantidad:0.08,parte:'Cuerpo'},{materialId:3,cantidad:0.02,parte:'Costura'}]});
  assert.equal(r.status,201,JSON.stringify(r.body));const mon=r.body.data;assert.equal(mon.estado,'Borrador');assert.deepEqual(mon.partes.sort(),['Costura','Cuerpo']);
  r=await t.as('produccion').put(`/api/fichas-tecnicas/${mon.id}`,{...mon,tiempoMinutos:40});assert.equal(r.status,200,JSON.stringify(r.body));
  r=await t.as('produccion').patch(`/api/fichas-tecnicas/${mon.id}/estado`,{estado:'Vigente'});assert.equal(r.status,200);
  assert.equal((await t.as('produccion').put(`/api/fichas-tecnicas/${mon.id}`,{...r.body.data})).status,409);
  r=await t.as('produccion').post(`/api/fichas-tecnicas/${mon.id}/nueva-version`,{});assert.equal(r.status,201,JSON.stringify(r.body));const v2=r.body.data;
  r=await t.as('produccion').patch(`/api/fichas-tecnicas/${v2.id}/estado`,{estado:'Vigente'});assert.equal(r.status,200);
  assert.equal(Number((await t.one("SELECT count(*) AS n FROM fichas_tecnicas WHERE producto_id=3 AND estado='Vigente'")).n),1);
  assert.equal((await t.one('SELECT estado FROM fichas_tecnicas WHERE id=$1',[mon.id])).estado,'Obsoleta');
  assert.equal((await t.as('vendedor').post('/api/fichas-tecnicas',{productoId:3,nombre:'X',materiales:[{materialId:1,cantidad:1}]})).status,403);
});
test('ciclos en la ficha multinivel se rechazan',async()=>{
  // Llavero (vigente) no puede incluir al bolso, que ya incluye al llavero.
  let r=await t.as('produccion').post('/api/fichas-tecnicas',{productoId:6,nombre:'Llavero v2',versionFicha:'2.0',materiales:[{materialId:1,cantidad:0.03}],componentes:[{productoId:2,cantidad:1}]});
  assert.equal(r.status,409,JSON.stringify(r.body));
  r=await t.as('produccion').post('/api/fichas-tecnicas',{productoId:6,nombre:'Llavero',materiales:[],componentes:[{productoId:6,cantidad:1}]});assert.equal(r.status,400);
});
test('detalle de producto muestra ficha, partes y proveedores',async()=>{
  const r=await t.as('vendedor').get('/api/productos/2/detalle');assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(r.body.data.ficha.codigo,'FT-BOL-001-V1.0');assert.ok(r.body.data.ficha.partes.includes('Asa'));
  assert.ok(r.body.data.ficha.componentes.some(c=>c.productoId===6));assert.ok(r.body.data.proveedores.length>=3);
});
test('reclamos a proveedores con seguimiento y cierre',async()=>{
  let r=await t.as('compras').post('/api/reclamos',{proveedorId:1,tipo:'Calidad',descripcion:'Cuero con manchas en el lote recibido'});assert.equal(r.status,201,JSON.stringify(r.body));const id=r.body.data.id;
  assert.equal((await t.as('compras').post('/api/reclamos',{proveedorId:1,tipo:'Inventado',descripcion:'x'})).status,400);
  r=await t.as('compras').patch(`/api/reclamos/${id}`,{estado:'Resuelto'});assert.equal(r.status,400);
  r=await t.as('compras').patch(`/api/reclamos/${id}`,{estado:'Resuelto',respuesta:'Proveedor repuso el material'});assert.equal(r.status,200);assert.equal(r.body.data.estado,'Resuelto');
  assert.equal((await t.as('compras').patch(`/api/reclamos/${id}`,{estado:'En seguimiento'})).status,409);
  r=await t.as('compras').get('/api/reclamos?proveedorId=1');assert.equal(r.body.data.length,1);
});
test('etapas y líneas de producción como recursos',async()=>{
  let r=await t.as('produccion').get('/api/recursos/etapas');assert.equal(r.body.data.length,5);assert.equal(r.body.data[0].duration,20);
  r=await t.as('produccion').post('/api/recursos/etapas',{id:6,name:'Acabado',order:6,duration:30});assert.equal(r.status,201,JSON.stringify(r.body));
  r=await t.as('produccion').get('/api/recursos/lineas-produccion');assert.equal(r.body.data.length,2);
});
