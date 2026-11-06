import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import {PGlite} from '@electric-sql/pglite';
import {createApp} from '../src/app.js';
import {migrate} from '../src/migrate.js';
const file=name=>fs.readFile(new URL(`../../database/${name}`,import.meta.url),'utf8');
export const PASSWORD='PruebaSegura123';
// Base PGlite aislada: esquema + datos demo + migraciones + datos demo ERP, con un usuario por rol.
export async function setup({erpDemo=true}={}){
  const pg=new PGlite();
  await pg.exec(await file('01_schema.sql'));
  await pg.exec(await file('02_datos_demo.sql'));
  await migrate({exec:sql=>pg.exec(sql),query:(sql,params)=>pg.query(sql,params)});
  if(erpDemo) await pg.exec(await file('03_datos_demo_erp.sql'));
  const hash=await bcrypt.hash(PASSWORD,4);
  const roles=['admin','vendedor','compras','inventario','produccion','operador'];
  for(const rol of roles) await pg.query('INSERT INTO usuarios(nombre,usuario,correo,password_hash,rol) VALUES($1,$2,$3,$4,$5)',[`Usuario ${rol}`,rol,`${rol}@test.local`,hash,rol]);
  await pg.query("INSERT INTO usuarios(nombre,usuario,correo,password_hash,rol) VALUES('Segunda admin','admin2','admin2@test.local',$1,'admin')",[hash]);
  const db={query:(sql,params=[])=>pg.query(sql,params),transaction:fn=>pg.transaction(tx=>fn(tx))};
  const app=createApp({db,jwtSecret:'1234567890123456789012345678901234567890'});
  const tokens={};
  for(const u of [...roles,'admin2']) tokens[u]=(await request(app).post('/api/auth/login').send({username:u,password:PASSWORD})).body.token;
  const as=u=>{const h={Authorization:`Bearer ${tokens[u]}`};return {
    get:p=>request(app).get(p).set(h), post:(p,b={})=>request(app).post(p).set(h).send(b),
    put:(p,b={})=>request(app).put(p).set(h).send(b), patch:(p,b={})=>request(app).patch(p).set(h).send(b), del:p=>request(app).delete(p).set(h)};};
  const one=async(sql,params=[])=>(await pg.query(sql,params)).rows[0];
  return {pg,app,tokens,as,one,migrate:()=>migrate({exec:sql=>pg.exec(sql),query:(sql,params)=>pg.query(sql,params)})};
}
// Comprueba que la suma de existencias por almacén coincide con el saldo global de cada artículo.
export async function invariante(pg){
  const r=await pg.query(`SELECT 'p' AS t,p.id,p.existencia::numeric AS g,COALESCE((SELECT SUM(cantidad) FROM existencias e WHERE e.producto_id=p.id),0) AS s FROM productos p
    UNION ALL SELECT 'm',m.id,m.existencia,COALESCE((SELECT SUM(cantidad) FROM existencias e WHERE e.material_id=m.id),0) FROM materiales m`);
  return r.rows.filter(x=>Number(x.g)!==Number(x.s));
}
