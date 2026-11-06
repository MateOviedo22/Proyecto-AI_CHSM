import 'dotenv/config';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
// RF-37/RF-38: genera un respaldo con pg_dump (formato custom) y registra fecha, archivo y tamaño.
// Uso: npm run db:backup  (requiere pg_dump en el PATH; destino configurable con BACKUP_DIR).
if(!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL en backend/.env');
const dir=path.resolve(process.env.BACKUP_DIR || 'respaldos');
fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,`sunshine-${new Date().toISOString().replace(/[:.]/g,'-')}.dump`);
const code=await new Promise(resolve=>{
  const p=spawn('pg_dump',['--format=custom','--no-owner','--file',file,process.env.DATABASE_URL],{stdio:'inherit'});
  p.on('error',e=>{console.error('No se pudo ejecutar pg_dump:',e.message);resolve(1)}); p.on('exit',resolve);
});
const db=new pg.Client({connectionString:process.env.DATABASE_URL}); await db.connect();
try{
  const size=code===0 && fs.existsSync(file)?fs.statSync(file).size:0;
  await db.query('INSERT INTO respaldos(archivo,tamano,tipo,estado,usuario) VALUES($1,$2,$3,$4,$5)',[path.basename(file),size,'Respaldo',code===0?'Completado':'Fallido',process.env.USER || 'script']);
  if(code!==0) {console.error('El respaldo falló.'); process.exitCode=1;} else console.log(`Respaldo creado: ${file} (${size} bytes)`);
} finally {await db.end()}
