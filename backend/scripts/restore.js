import 'dotenv/config';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
// RF-39: restaura un respaldo creado con backup.js. Sustituye los objetos existentes, por eso exige --confirmar.
// Uso: npm run db:restore -- respaldos/archivo.dump --confirmar
const [file,flag]=process.argv.slice(2);
if(!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL en backend/.env');
if(!file || !fs.existsSync(file)) throw new Error('Indica la ruta de un archivo .dump existente.');
if(flag!=='--confirmar') { console.error('La restauración reemplaza los datos actuales. Repite el comando agregando --confirmar.'); process.exit(1); }
const code=await new Promise(resolve=>{
  const p=spawn('pg_restore',['--clean','--if-exists','--no-owner','--dbname',process.env.DATABASE_URL,file],{stdio:'inherit'});
  p.on('error',e=>{console.error('No se pudo ejecutar pg_restore:',e.message);resolve(1)}); p.on('exit',resolve);
});
const db=new pg.Client({connectionString:process.env.DATABASE_URL}); await db.connect();
try{ await db.query('INSERT INTO respaldos(archivo,tamano,tipo,estado,usuario) VALUES($1,$2,$3,$4,$5)',[path.basename(file),fs.statSync(file).size,'Restauración',code===0?'Completado':'Fallido',process.env.USER || 'script']); }
finally {await db.end()}
if(code!==0) process.exitCode=1; else console.log('Restauración completada.');
