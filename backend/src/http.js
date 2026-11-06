// Utilidades HTTP y de validación compartidas por app.js y los routers de módulos.
export class HttpError extends Error { constructor(status,message) { super(message); this.status=status; } }
export const fail=(status,msg)=>{throw new HttpError(status,msg)};
export const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
export const dateValue=x=>x instanceof Date ? x.toISOString().slice(0,10) : x;
export const audit=(db,user,action,resource,id)=>db.query('INSERT INTO auditoria(usuario_id,accion,recurso,registro) VALUES($1,$2,$3,$4)',[user.id,action,resource,String(id)]);

// Validadores: lanzan 400 con un mensaje en español.
export function entero(v,campo,{min=1,opcional=false}={}){
  if(opcional && (v===undefined || v===null || v==='')) return null;
  const n=Number(v); if(!Number.isSafeInteger(n) || n<min) fail(400,`El campo ${campo} no es válido.`); return n;
}
export function numero(v,campo,{min=0,positivo=false,max=100000000,opcional=false}={}){
  if(opcional && (v===undefined || v===null || v==='')) return null;
  const n=Number(v); if(v===''||v===null||v===undefined||!Number.isFinite(n)||n<min||(positivo&&n<=0)||n>max) fail(400,`El campo ${campo} debe ser un número ${positivo?'mayor que cero':'válido'}.`); return n;
}
export function texto(v,campo,{max=200,requerido=false}={}){
  if(v===undefined || v===null) v='';
  if(typeof v!=='string') fail(400,`El campo ${campo} no es válido.`);
  v=v.trim(); if(requerido && !v) fail(400,`El campo ${campo} es obligatorio.`); if(v.length>max) fail(400,`El campo ${campo} es demasiado largo.`); return v;
}
export function fecha(v,campo,{opcional=true}={}){
  if(v===undefined || v===null || v==='') { if(opcional) return null; fail(400,`El campo ${campo} es obligatorio.`); }
  if(typeof v!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) fail(400,`El campo ${campo} debe ser una fecha AAAA-MM-DD.`); return v;
}
export function uno(v,lista,campo){ if(!lista.includes(v)) fail(400,`El campo ${campo} no es válido.`); return v; }
export function lista(v,campo,{max=100}={}){ if(!Array.isArray(v) || !v.length || v.length>max) fail(400,`Agrega entre 1 y ${max} elementos en ${campo}.`); return v; }
// Código legible con prefijo y fecha; el sufijo aleatorio evita colisiones entre usuarios simultáneos.
export const codigo=prefix=>`${prefix}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.floor(Math.random()*90000+10000)}`;
// Cambio de estado atómico: solo procede si el estado actual es uno de los esperados (evita dobles operaciones).
export async function transicion(tx,tabla,id,desde,hacia,extraSql='',extraVals=[]){
  const vals=[hacia,id,desde,...extraVals];
  const q=await tx.query(`UPDATE ${tabla} SET estado=$1${extraSql},version=version+1 WHERE id=$2 AND estado=ANY($3::text[]) RETURNING *`,vals);
  if(!q.rows.length) fail(409,'La operación no es válida para el estado actual o el registro ya cambió. Vuelve a cargar la página.');
  return q.rows[0];
}
