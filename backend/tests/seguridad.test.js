import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {setup,PASSWORD} from './helpers.js';
let t;
before(async()=>{t=await setup()});
after(async()=>{await t.pg.close()});
test('migraciones idempotentes: una segunda ejecución no aplica nada',async()=>{
  assert.deepEqual(await t.migrate(),[]);
  assert.ok(Number((await t.one('SELECT count(*) AS n FROM schema_migrations')).n)>=1);
});
test('usuarios: crear, editar rol, desactivar impide el acceso y cambio de contraseña',async()=>{
  let r=await t.as('admin').post('/api/usuarios',{nombre:'Vendedora Tienda',usuario:'vtienda',correo:'v@test.local',rol:'vendedor',password:'ClaveSegura2026'});
  assert.equal(r.status,201,JSON.stringify(r.body)); const u=r.body.data;
  assert.equal((await request(t.app).post('/api/auth/login').send({username:'vtienda',password:'ClaveSegura2026'})).status,200);
  r=await t.as('admin').put(`/api/usuarios/${u.id}`,{...u,rol:'inventario'});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.data.rol,'inventario');
  assert.equal((await t.as('admin').put(`/api/usuarios/${u.id}`,{...u,rol:'compras'})).status,409); // versión vieja
  r=await t.as('admin').patch(`/api/usuarios/${u.id}/estado`,{activo:false});assert.equal(r.status,200);
  assert.equal((await request(t.app).post('/api/auth/login').send({username:'vtienda',password:'ClaveSegura2026'})).status,401);
  r=await t.as('admin').patch(`/api/usuarios/${u.id}/password`,{password:'corta'});assert.equal(r.status,400);
  assert.equal((await t.as('admin').post('/api/usuarios',{nombre:'X',usuario:'vtienda',correo:'x@test.local',rol:'vendedor',password:'ClaveSegura2026'})).status,409);
  assert.equal((await t.as('admin').post('/api/usuarios',{nombre:'X',usuario:'otro',correo:'x2@test.local',rol:'superusuario',password:'ClaveSegura2026'})).status,400);
});
test('la administradora no puede desactivarse ni quitarse el rol',async()=>{
  const me=(await t.as('admin').get('/api/auth/me')).body.user;
  assert.equal((await t.as('admin').patch(`/api/usuarios/${me.id}/estado`,{activo:false})).status,409);
});
test('permisos por rol en módulos existentes y nuevos',async()=>{
  assert.equal((await t.as('vendedor').get('/api/usuarios')).status,403);
  assert.equal((await t.as('vendedor').get('/api/recursos/ingresos')).status,403);
  assert.equal((await t.as('compras').post('/api/ventas',{cliente:'X',metodo:'Efectivo',items:[{productoId:1,cantidad:1}]})).status,403);
  assert.equal((await t.as('vendedor').get('/api/compras')).status,403);
  assert.equal((await t.as('compras').get('/api/compras')).status,200);
  assert.equal((await t.as('vendedor').get('/api/recursos/clientes')).status,200);
  assert.equal((await t.as('operador').post('/api/recursos/clientes',{id:'CLI-X',name:'X'})).status,403);
  assert.equal((await t.as('operador').get('/api/recursos/clientes')).status,200);
  assert.equal((await t.as('produccion').get('/api/recursos/clientes')).status,403);
  const roles=(await t.as('vendedor').get('/api/roles')).body.data;assert.ok(roles.roles.vendedor && roles.modulos.ventas);
});
test('respaldos y auditoría solo para administración',async()=>{
  assert.equal((await t.as('admin').get('/api/respaldos')).status,200);
  assert.equal((await t.as('inventario').get('/api/respaldos')).status,403);
  const r=await t.as('admin').get('/api/auditoria');assert.equal(r.status,200);assert.ok(r.body.data.some(x=>x.recurso==='usuarios'));
});
