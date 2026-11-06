import 'dotenv/config';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import bcrypt from 'bcryptjs';
import {createPostgres} from '../src/db.js';
if(!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL en backend/.env');
const {ADMIN_USER,ADMIN_PASSWORD,ADMIN_NAME,ADMIN_EMAIL}=process.env;
if(!ADMIN_USER || !ADMIN_PASSWORD || ADMIN_PASSWORD.length<10 || !ADMIN_NAME || !ADMIN_EMAIL) throw new Error('Configura ADMIN_USER, ADMIN_PASSWORD (mínimo 10 caracteres), ADMIN_NAME y ADMIN_EMAIL en backend/.env');
const db=createPostgres(process.env.DATABASE_URL);
const root=new URL('../../database/',import.meta.url);
try {
  await db.query(await fs.readFile(fileURLToPath(new URL('01_schema.sql',root)),'utf8'));
  if(process.env.SEED_DEMO==='true') await db.query(await fs.readFile(fileURLToPath(new URL('02_datos_demo.sql',root)),'utf8'));
  const exists=await db.query('SELECT id FROM usuarios WHERE lower(usuario)=lower($1)',[ADMIN_USER]);
  if(!exists.rows.length){
    const hash=await bcrypt.hash(ADMIN_PASSWORD,12);
    await db.query("INSERT INTO usuarios(nombre,usuario,correo,password_hash,rol) VALUES($1,$2,$3,$4,'admin')",[ADMIN_NAME,ADMIN_USER,ADMIN_EMAIL,hash]);
    console.log('Cuenta administradora creada.');
  } else console.log('La cuenta administradora ya existe; su contraseña no fue modificada.');
  console.log('Base de datos preparada.');
} finally {await db.close()}
