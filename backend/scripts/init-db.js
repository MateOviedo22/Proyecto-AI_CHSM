import 'dotenv/config';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import {migrate} from '../src/migrate.js';
if(!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL en backend/.env');
const {ADMIN_USER,ADMIN_PASSWORD,ADMIN_NAME,ADMIN_EMAIL}=process.env;
if(!ADMIN_USER || !ADMIN_PASSWORD || ADMIN_PASSWORD.length<10 || !ADMIN_NAME || !ADMIN_EMAIL) throw new Error('Configura ADMIN_USER, ADMIN_PASSWORD (mínimo 10 caracteres), ADMIN_NAME y ADMIN_EMAIL en backend/.env');
// Una sola conexión: las migraciones usan BEGIN/COMMIT explícitos.
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
await db.connect();
const root=new URL('../../database/',import.meta.url);
const run=async file=>db.query(await fs.readFile(fileURLToPath(new URL(file,root)),'utf8'));
try {
  await run('01_schema.sql');
  if(process.env.SEED_DEMO==='true') await run('02_datos_demo.sql');
  const applied=await migrate({exec:sql=>db.query(sql),query:(sql,params)=>db.query(sql,params)});
  console.log(applied.length?`Migraciones aplicadas: ${applied.join(', ')}`:'No hay migraciones pendientes.');
  if(process.env.SEED_DEMO==='true') await run('03_datos_demo_erp.sql');
  const exists=await db.query('SELECT id FROM usuarios WHERE lower(usuario)=lower($1)',[ADMIN_USER]);
  if(!exists.rows.length){
    const hash=await bcrypt.hash(ADMIN_PASSWORD,12);
    await db.query("INSERT INTO usuarios(nombre,usuario,correo,password_hash,rol) VALUES($1,$2,$3,$4,'admin')",[ADMIN_NAME,ADMIN_USER,ADMIN_EMAIL,hash]);
    console.log('Cuenta administradora creada.');
  } else console.log('La cuenta administradora ya existe; su contraseña no fue modificada.');
  console.log('Base de datos preparada.');
} finally {await db.end()}
