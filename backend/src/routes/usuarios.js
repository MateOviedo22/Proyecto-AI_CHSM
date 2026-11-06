import {Router} from 'express';
import bcrypt from 'bcryptjs';
import {asyncRoute,fail,audit,texto,uno,entero} from '../http.js';
import {ROLES,MODULOS,soloAdmin} from '../permisos.js';
// RF-01..RF-05: gestión de cuentas individuales, roles y estado. Solo administración.
export default function usuarios(db){
  const r=Router();
  const fila=u=>({id:Number(u.id),nombre:u.nombre,usuario:u.usuario,correo:u.correo,rol:u.rol,activo:u.activo,creadoEn:u.creado_en,_version:Number(u.version)});
  const SELECT='SELECT id,nombre,usuario,correo,rol,activo,creado_en,version FROM usuarios';
  const datos=(b,nuevo)=>{
    const out={nombre:texto(b.nombre,'nombre',{requerido:true}),correo:texto(b.correo,'correo',{requerido:true}),rol:uno(b.rol,Object.keys(ROLES),'rol')};
    if(!/^[^@\s]+@[^@\s]+$/.test(out.correo)) fail(400,'El correo no es válido.');
    if(nuevo){out.usuario=texto(b.usuario,'usuario',{requerido:true,max:60}); if(!/^[A-Za-z0-9._-]{3,60}$/.test(out.usuario)) fail(400,'El usuario solo admite letras, números, punto, guion y guion bajo (mínimo 3).');}
    return out;
  };
  const clave=p=>{if(typeof p!=='string'||p.length<10||p.length>256) fail(400,'La contraseña debe tener al menos 10 caracteres.'); return bcrypt.hash(p,12);};
  r.get('/roles',asyncRoute(async(req,res)=>res.json({data:{roles:ROLES,modulos:MODULOS}})));
  r.get('/usuarios',soloAdmin,asyncRoute(async(req,res)=>res.json({data:(await db.query(SELECT+' ORDER BY nombre')).rows.map(fila)})));
  r.post('/usuarios',soloAdmin,asyncRoute(async(req,res)=>{
    const d=datos(req.body||{},true), hash=await clave(req.body?.password);
    const q=await db.transaction(async tx=>{
      const q=await tx.query('INSERT INTO usuarios(nombre,usuario,correo,password_hash,rol) VALUES($1,$2,$3,$4,$5) RETURNING id,nombre,usuario,correo,rol,activo,creado_en,version',[d.nombre,d.usuario,d.correo,hash,d.rol]);
      await audit(tx,req.user,'crear','usuarios',q.rows[0].id); return q;
    });
    res.status(201).json({data:fila(q.rows[0])});
  }));
  r.put('/usuarios/:id',soloAdmin,asyncRoute(async(req,res)=>{
    const id=entero(req.params.id,'id'), d=datos(req.body||{},false), version=entero(req.body?._version,'_version');
    if(id===req.user.id && d.rol!=='admin') fail(409,'No puedes quitarte el rol de administración a ti mismo.');
    const q=await db.transaction(async tx=>{
      const q=await tx.query('UPDATE usuarios SET nombre=$1,correo=$2,rol=$3,actualizado_en=now(),version=version+1 WHERE id=$4 AND version=$5 RETURNING id,nombre,usuario,correo,rol,activo,creado_en,version',[d.nombre,d.correo,d.rol,id,version]);
      if(!q.rows.length) fail(409,'El usuario cambió o no existe. Vuelve a cargar la página.');
      await audit(tx,req.user,'actualizar','usuarios',id); return q;
    });
    res.json({data:fila(q.rows[0])});
  }));
  r.patch('/usuarios/:id/estado',soloAdmin,asyncRoute(async(req,res)=>{
    const id=entero(req.params.id,'id'), activo=req.body?.activo;
    if(typeof activo!=='boolean') fail(400,'Indica si la cuenta queda activa.');
    if(id===req.user.id && !activo) fail(409,'No puedes desactivar tu propia cuenta.');
    const q=await db.transaction(async tx=>{
      const q=await tx.query('UPDATE usuarios SET activo=$1,actualizado_en=now(),version=version+1 WHERE id=$2 RETURNING id,nombre,usuario,correo,rol,activo,creado_en,version',[activo,id]);
      if(!q.rows.length) fail(404,'Usuario no encontrado.');
      await audit(tx,req.user,activo?'activar':'desactivar','usuarios',id); return q;
    });
    res.json({data:fila(q.rows[0])});
  }));
  r.patch('/usuarios/:id/password',soloAdmin,asyncRoute(async(req,res)=>{
    const id=entero(req.params.id,'id'), hash=await clave(req.body?.password);
    await db.transaction(async tx=>{
      const q=await tx.query('UPDATE usuarios SET password_hash=$1,actualizado_en=now(),version=version+1 WHERE id=$2 RETURNING id',[hash,id]);
      if(!q.rows.length) fail(404,'Usuario no encontrado.');
      await audit(tx,req.user,'cambiar contraseña','usuarios',id);
    });
    res.json({data:{id}});
  }));
  // RF-38: historial de respaldos registrados por scripts/backup.js.
  r.get('/respaldos',soloAdmin,asyncRoute(async(req,res)=>res.json({data:(await db.query('SELECT id,fecha,archivo,tamano,tipo,estado,usuario FROM respaldos ORDER BY fecha DESC LIMIT 200')).rows})));
  r.get('/auditoria',soloAdmin,asyncRoute(async(req,res)=>res.json({data:(await db.query('SELECT a.id,a.fecha,a.accion,a.recurso,a.registro,u.nombre AS usuario FROM auditoria a LEFT JOIN usuarios u ON u.id=a.usuario_id ORDER BY a.fecha DESC LIMIT 300')).rows})));
  return r;
}
