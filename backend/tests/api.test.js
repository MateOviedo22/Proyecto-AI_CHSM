import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import {PGlite} from '@electric-sql/pglite';
import {createApp} from '../src/app.js';
let pg,app,token;
const auth=()=>({Authorization:`Bearer ${token}`});
before(async()=>{
  pg=new PGlite();
  await pg.exec(await fs.readFile(new URL('../../database/01_schema.sql',import.meta.url),'utf8'));
  await pg.exec(await fs.readFile(new URL('../../database/02_datos_demo.sql',import.meta.url),'utf8'));
  await pg.query("INSERT INTO usuarios(nombre,usuario,correo,password_hash,rol) VALUES($1,$2,$3,$4,'admin')",['Prueba','admin','admin@test.local',await bcrypt.hash('PruebaSegura123',4)]);
  const db={query:(sql,params=[])=>pg.query(sql,params),transaction:fn=>pg.transaction(tx=>fn(tx))};
  app=createApp({db,jwtSecret:'1234567890123456789012345678901234567890'});
});
after(async()=>{await pg.close()});
test('salud y autenticación con credenciales reales',async()=>{
  assert.equal((await request(app).get('/api/salud')).status,200);
  assert.equal((await request(app).get('/api/recursos/clientes')).status,401);
  assert.equal((await request(app).post('/api/auth/login').send({username:'admin',password:'incorrecta'})).status,401);
  const r=await request(app).post('/api/auth/login').send({username:'admin',password:'PruebaSegura123'});
  assert.equal(r.status,200);token=r.body.token;assert.ok(token);
});
test('clientes: crear, editar, conflicto de versión y persistencia',async()=>{
  let r=await request(app).post('/api/recursos/clientes').set(auth()).send({id:'CLI-099',name:'Cliente prueba',email:'test@example.com'});
  assert.equal(r.status,201,JSON.stringify(r.body));
  const row=r.body.data; assert.equal(row.name,'Cliente prueba'); assert.equal(row._version,1);
  r=await request(app).put('/api/recursos/clientes/CLI-099').set(auth()).send({...row,name:'Cliente actualizado'});
  assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data._version,2);
  assert.equal((await request(app).put('/api/recursos/clientes/CLI-099').set(auth()).send({...row,name:'Cambio antiguo'})).status,409);
  r=await request(app).get('/api/recursos/clientes').set(auth());assert.equal(r.body.data.find(x=>x.id==='CLI-099').name,'Cliente actualizado');
});
test('venta usa precio de BD y actualiza stock, detalle, finanzas y auditoría',async()=>{
  const r=await request(app).post('/api/ventas').set(auth()).send({cliente:'Cliente actualizado',clienteId:'CLI-099',metodo:'Efectivo',porcentajeDescuento:10,items:[{productoId:1,cantidad:2,precio:1}]});
  assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.data.subtotal,1700);assert.equal(r.body.data.total,1530);
  const p=await pg.query('SELECT existencia FROM productos WHERE id=1');assert.equal(Number(p.rows[0].existencia),10);
  const detail=await pg.query('SELECT * FROM venta_detalles');assert.equal(detail.rows.length,1);
  const movements=await pg.query('SELECT * FROM movimientos_inventario WHERE producto_id=1');assert.equal(movements.rows.length,1);
  const finance=await pg.query('SELECT * FROM finanzas_movimientos WHERE venta_id IS NOT NULL');assert.equal(Number(finance.rows[0].monto),1530);
  const clients=await request(app).get('/api/recursos/clientes').set(auth());assert.equal(clients.body.data.find(x=>x.id==='CLI-099').purchases,1);
});
test('venta sin stock hace rollback, no crea venta ni movimientos',async()=>{
  const before=Number((await pg.query('SELECT count(*) AS n FROM ventas')).rows[0].n);
  const r=await request(app).post('/api/ventas').set(auth()).send({cliente:'Test',metodo:'Tarjeta',items:[{productoId:1,cantidad:999}]});
  assert.equal(r.status,409,JSON.stringify(r.body));
  assert.equal(Number((await pg.query('SELECT count(*) AS n FROM ventas')).rows[0].n),before);
  assert.equal(Number((await pg.query('SELECT existencia FROM productos WHERE id=1')).rows[0].existencia),10);
});
test('entrada material aplica costo ponderado y movimiento',async()=>{
  const r=await request(app).post('/api/materiales/1/entradas').set(auth()).send({quantity:5,unitCost:480,supplier:'Proveedor',invoice:'FAC-1'});
  assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.data.stock,50);assert.equal(r.body.data.cost,390);
  assert.equal(Number((await pg.query('SELECT count(*) AS n FROM movimientos_inventario WHERE material_id=1')).rows[0].n),1);
});
test('recursos de RRHH y finanzas validan datos y calculan saldo',async()=>{
  let r=await request(app).post('/api/recursos/empleados').set(auth()).send({id:100,codigo:'EMP-100',nombre:'Empleado Prueba'});assert.equal(r.status,201,JSON.stringify(r.body));
  r=await request(app).post('/api/recursos/cuentas-cobrar').set(auth()).send({id:101,cliente:'Cliente',documento:'FAC-101',fecha:'2026-10-01',vencimiento:'2026-11-01',monto:100,abonado:40});
  assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.data.saldo,60);
  r=await request(app).post('/api/recursos/cuentas-cobrar').set(auth()).send({id:102,cliente:'Cliente',documento:'FAC-102',fecha:'2026-10-01',vencimiento:'2026-11-01',monto:100,abonado:140});assert.equal(r.status,400);
});
test('cotización se convierte una sola vez en orden persistente',async()=>{
  let r=await request(app).post('/api/cotizaciones').set(auth()).send({id:'COT-TEST1',cliente:'Cliente prueba',vencimiento:'2099-12-31',notas:'Entrega',items:[{productoId:2,cantidad:2,precio:1}]});
  assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.data.items[0].precio,2450);
  r=await request(app).post('/api/cotizaciones/COT-TEST1/convertir').set(auth()).send({});assert.equal(r.status,201,JSON.stringify(r.body));
  const order=r.body.data;assert.equal(order.productos[0].cantidad,2);assert.equal(order.productos[0].precio,2450);
  r=await request(app).post('/api/cotizaciones/COT-TEST1/convertir').set(auth()).send({});assert.equal(r.status,409);
  r=await request(app).patch(`/api/ordenes-venta/${order.id}/estado`).set(auth()).send({estado:'En preparación'});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.estado,'En preparación');
  r=await request(app).get('/api/ordenes-venta').set(auth());assert.equal(r.body.data.length,1);
  const stock=await pg.query('SELECT existencia FROM productos WHERE id=2');assert.equal(Number(stock.rows[0].existencia),5); // una orden no implica venta
});
test('compras: solicitud, aprobación, orden, recepción parcial y completa',async()=>{
  let r=await request(app).post('/api/compras/solicitudes').set(auth()).send({materialId:2,cantidad:10,solicitante:'Taller',area:'Producción',prioridad:'Alta'});
  assert.equal(r.status,201,JSON.stringify(r.body));const sol=r.body.data.id;
  r=await request(app).patch(`/api/compras/solicitudes/${sol}/estado`).set(auth()).send({estado:'Aprobada'});assert.equal(r.status,200,JSON.stringify(r.body));
  r=await request(app).post('/api/compras/ordenes').set(auth()).send({solicitudId:sol,materialId:2,proveedorId:1,cantidad:10,precio:500});
  assert.equal(r.status,201,JSON.stringify(r.body));const order=r.body.data.id;
  r=await request(app).patch(`/api/compras/ordenes/${order}/estado`).set(auth()).send({estado:'Enviada'});assert.equal(r.status,200,JSON.stringify(r.body));
  r=await request(app).post('/api/compras/recepciones').set(auth()).send({ordenId:order,cantidad:4,documento:'FAC-99'});assert.equal(r.status,201,JSON.stringify(r.body));
  let current=(await pg.query('SELECT existencia,costo FROM materiales WHERE id=2')).rows[0];assert.equal(Number(current.existencia),89);
  r=await request(app).post('/api/compras/recepciones').set(auth()).send({ordenId:order,cantidad:7});assert.equal(r.status,409,JSON.stringify(r.body));
  current=(await pg.query('SELECT existencia FROM materiales WHERE id=2')).rows[0];assert.equal(Number(current.existencia),89);
  r=await request(app).post('/api/compras/recepciones').set(auth()).send({ordenId:order,cantidad:6});assert.equal(r.status,201,JSON.stringify(r.body));
  r=await request(app).get('/api/compras').set(auth());assert.equal(r.status,200,JSON.stringify(r.body));
  const o=r.body.data.ordenes.find(x=>x.id===order);assert.equal(o.estado,'Recibida');assert.equal(o.recibido,10);
  assert.equal(Number((await pg.query('SELECT existencia FROM materiales WHERE id=2')).rows[0].existencia),95);
});
test('el saldo inicial y la entrada guardan trazabilidad y datos del formulario',async()=>{
  let r=await request(app).post('/api/recursos/materiales').set(auth()).send({id:88001,code:'MAT-TEST',name:'Material prueba',stock:3,cost:100,minimum:1});assert.equal(r.status,201,JSON.stringify(r.body));
  r=await request(app).post('/api/materiales/88001/entradas').set(auth()).send({quantity:2,unitCost:200,supplier:'Proveedor prueba',invoice:'F-234',date:'2026-10-10',notes:'Nota de prueba'});assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.data.stock,5);
  const rows=await pg.query('SELECT notas,documento FROM entradas_material WHERE material_id=$1',[88001]);assert.equal(rows.rows[0].notas,'Nota de prueba');assert.equal(rows.rows[0].documento,'F-234');
  assert.equal(Number((await pg.query('SELECT count(*) AS n FROM movimientos_inventario WHERE material_id=$1',[88001])).rows[0].n),2);
});
test('edición de cotización detecta versión anterior',async()=>{
  let r=await request(app).post('/api/cotizaciones').set(auth()).send({id:'COT-EDIT',cliente:'Edición',vencimiento:'2099-12-31',items:[{productoId:1,cantidad:1}]});assert.equal(r.status,201,JSON.stringify(r.body));
  const q=r.body.data;
  r=await request(app).put('/api/cotizaciones/COT-EDIT').set(auth()).send({...q,cliente:'Actualizado'});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data._version,2);
  r=await request(app).put('/api/cotizaciones/COT-EDIT').set(auth()).send(q);assert.equal(r.status,409,JSON.stringify(r.body));
});
test('promoción vigente se refleja en catálogo y en venta',async()=>{
  let r=await request(app).post('/api/recursos/promociones').set(auth()).send({id:99901,nombre:'Descuento',productoId:1,tipo:'porcentaje',valor:10,inicio:'2000-01-01',fin:'2099-01-01',activa:true});assert.equal(r.status,201,JSON.stringify(r.body));
  r=await request(app).get('/api/recursos/productos').set(auth());assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.find(x=>x.id===1).precioVigente,765);
  r=await request(app).post('/api/ventas').set(auth()).send({cliente:'Test promoción',metodo:'Efectivo',items:[{productoId:1,cantidad:1}]});assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.data.total,765);
});
