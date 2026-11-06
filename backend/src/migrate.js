import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
// Aplica en orden los archivos database/migrations/NNN_*.sql que aún no constan en schema_migrations.
// `exec(sql)` ejecuta varias sentencias; `query(sql,params)` devuelve {rows}.
export const migrationsDir=new URL('../../database/migrations/',import.meta.url);
export async function migrate({exec,query}){
  await exec('CREATE TABLE IF NOT EXISTS schema_migrations(nombre TEXT PRIMARY KEY, aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now())');
  const files=(await fs.readdir(fileURLToPath(migrationsDir))).filter(f=>/^\d{3}_.+\.sql$/.test(f)).sort();
  const applied=[];
  for(const file of files){
    const done=await query('SELECT 1 FROM schema_migrations WHERE nombre=$1',[file]);
    if(done.rows.length) continue;
    const sql=await fs.readFile(fileURLToPath(new URL(file,migrationsDir)),'utf8');
    await exec(`BEGIN;\n${sql}\nINSERT INTO schema_migrations(nombre) VALUES ('${file.replaceAll("'","''")}');\nCOMMIT;`).catch(async e=>{await exec('ROLLBACK').catch(()=>{});throw new Error(`Migración ${file}: ${e.message}`)});
    applied.push(file);
  }
  return applied;
}
