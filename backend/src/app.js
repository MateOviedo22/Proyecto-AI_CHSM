import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Decimal from 'decimal.js';
import { resources } from './resources.js';
import {HttpError,fail,asyncRoute,dateValue,audit} from './http.js';
import {exigir,guard} from './permisos.js';
import usuarios from './routes/usuarios.js';
import {moverStock,salidaFIFO,almacenId,crearLote,ALMACEN} from './stock.js';
import maestros from './routes/maestros.js';
import compras from './routes/compras.js';
import inventario from './routes/inventario.js';
import produccion from './routes/produccion.js';
import traslados from './routes/traslados.js';
import ventas from './routes/ventas.js';
import reportes from './routes/reportes.js';
export {HttpError};

function resultRows(result, config) {
  return result.rows.map(row=>{
    const out={};
    for (const [key,col] of Object.entries(config.fields)) {
      let v=dateValue(row[col]);
      if (config.numbers.includes(key) && v!==null && v!==undefined) v=Number(v);
      out[key]=v;
    }
    out._version=row.version;
    if(config.computedSaldo) out.saldo=Number(new Decimal(out.monto).minus(out.abonado).toDecimalPlaces(2));
    if(config.table==='clientes') out.purchases=Number(row.purchases || 0);
    if(config.table==='proveedores') out.materials=Number(row.materials || 0);
    if(config.table==='productos') out.precioVigente=Number(row.precio_vigente);
    return out;
  });
}
// El proveedor escrito en el formulario de materiales se vincula al registro de proveedores y a material_proveedores.
async function syncProveedor(tx,id){
  await tx.query('UPDATE materiales m SET proveedor_id=(SELECT p.id FROM proveedores p WHERE lower(p.nombre)=lower(m.proveedor) ORDER BY p.id LIMIT 1) WHERE m.id=$1',[id]);
  await tx.query('UPDATE material_proveedores SET preferido=false WHERE material_id=$1',[id]);
  await tx.query('INSERT INTO material_proveedores(material_id,proveedor_id,precio_ref,preferido) SELECT id,proveedor_id,costo,true FROM materiales WHERE id=$1 AND proveedor_id IS NOT NULL ON CONFLICT (material_id,proveedor_id) DO UPDATE SET preferido=true',[id]);
}
function selectSql(c) {
  let base=`SELECT t.*`;
  if(c.table==='clientes') base+=`, (SELECT COUNT(*) FROM ventas v WHERE v.cliente_id=t.id AND v.estado='Completada') AS purchases, (SELECT COALESCE(SUM(v.total),0) FROM ventas v WHERE v.cliente_id=t.id AND v.estado='Completada') AS amount, (SELECT MAX(v.fecha)::date FROM ventas v WHERE v.cliente_id=t.id AND v.estado='Completada') AS last_purchase`;
  if(c.table==='proveedores') base+=`, (SELECT COUNT(*) FROM material_proveedores mp WHERE mp.proveedor_id=t.id) AS materials`;
  if(c.table==='productos') base+=`, COALESCE((SELECT ROUND(GREATEST(0,CASE WHEN pr.tipo='porcentaje' THEN t.precio*(1-pr.valor/100) ELSE t.precio-pr.valor END),2) FROM promociones pr WHERE pr.producto_id=t.id AND pr.activa=true AND CURRENT_DATE BETWEEN pr.inicio AND pr.fin ORDER BY pr.id DESC LIMIT 1),t.precio) AS precio_vigente`;
  base+=` FROM ${c.table} t`;
  return base;
}
function fixedWhere(c,params,alias='t') {
  const clauses=[];
  for(const [column,value] of Object.entries(c.fixed || {})) {params.push(value); clauses.push(`${alias}.${column}=$${params.length}`)}
  return clauses;
}
function validate(c, body, isNew) {
  if (!body || typeof body!=='object' || Array.isArray(body)) fail(400,'El cuerpo debe ser un objeto JSON.');
  const clean={};
  if(isNew) Object.assign(clean,c.defaults);
  for(const key of Object.keys(c.fields)) {
    if (key in body && body[key] !== undefined) clean[key]=(['due','contratacion'].includes(key) && body[key]==='') ? null : body[key];
  }
  if(isNew) for(const k of c.required) if(clean[k]===undefined || clean[k]===null || String(clean[k]).trim()==='') fail(400,`El campo ${k} es obligatorio.`);
  for(const [key,val] of Object.entries(clean)) {
    if(c.numbers.includes(key)) {
      if(val==='' || val===null || !Number.isFinite(Number(val)) || Number(val)<0) fail(400,`El campo ${key} debe ser un número no negativo.`);
      clean[key]=Number(val);
      if (['id','quantity','progress','stock','minimo','plazas','order','paymentDays'].includes(key) && (key!=='stock' || c.table==='productos') && !Number.isSafeInteger(clean[key])) fail(400,`El campo ${key} debe ser entero.`);
    } else if (val!==null && typeof val!=='string' && typeof val!=='boolean') fail(400,`El campo ${key} no es válido.`);
    if(typeof clean[key]==='string') { clean[key]=clean[key].trim(); if(clean[key].length>1000) fail(400,`El campo ${key} es demasiado largo.`); }
  }
  for(const k of c.required) if(k in clean && (clean[k]===null || String(clean[k]).trim()==='')) fail(400,`El campo ${k} es obligatorio.`);
  if(clean.quantity!==undefined && clean.quantity<=0) fail(400,'La cantidad debe ser mayor que cero.');
  if(clean.progress!==undefined && clean.progress>100) fail(400,'El progreso no puede superar 100.');
  if(c.table==='promociones' && clean.tipo!==undefined && !['porcentaje','fijo'].includes(clean.tipo)) fail(400,'Tipo de promoción inválido.');
  return clean;
}

export function createApp({db, jwtSecret, corsOrigin='http://localhost:5173'}) {
  if(!db || !jwtSecret || jwtSecret.length<32) throw new Error('La clave JWT debe contener al menos 32 caracteres.');
  const app=express();
  app.disable('x-powered-by');
  app.use(helmet()); app.use(cors({origin:corsOrigin.split(',')})); app.use('/api/traslados/:id/evidencias',express.json({limit:'3mb'})); app.use(express.json({limit:'256kb'}));
  app.get('/api/salud', asyncRoute(async(req,res)=>{await db.query('SELECT 1'); res.json({estado:'ok'});}));
  app.post('/api/auth/login', rateLimit({windowMs:15*60*1000,limit:25,standardHeaders:true,legacyHeaders:false}), asyncRoute(async(req,res)=>{
    const {username,password}=req.body || {};
    if(typeof username!=='string' || typeof password!=='string' || username.length>100 || password.length>256) fail(400,'Indica usuario y contraseña.');
    const r=await db.query('SELECT id,nombre,usuario,password_hash,rol,activo FROM usuarios WHERE lower(usuario)=lower($1)',[username.trim()]);
    const u=r.rows[0];
    if(!u || !u.activo || !(await bcrypt.compare(password,u.password_hash))) fail(401,'Usuario o contraseña incorrectos.');
    const token=jwt.sign({sub:String(u.id)},jwtSecret,{expiresIn:'8h'});
    res.json({token,user:{id:Number(u.id),name:u.nombre,username:u.usuario,role:u.rol}});
  }));
  const auth=asyncRoute(async(req,res,next)=>{
    const bearer=req.headers.authorization || '';
    if(!bearer.startsWith('Bearer ')) fail(401,'Inicia sesión para continuar.');
    let payload; try {payload=jwt.verify(bearer.slice(7),jwtSecret,{algorithms:['HS256']});} catch {fail(401,'Sesión vencida o inválida.');}
    const r=await db.query('SELECT id,nombre,usuario,rol,activo FROM usuarios WHERE id=$1',[payload.sub]);
    if(!r.rows[0]?.activo) fail(401,'Usuario inactivo o inexistente.');
    req.user={id:Number(r.rows[0].id),name:r.rows[0].nombre,username:r.rows[0].usuario,role:r.rows[0].rol}; next();
  });
  app.get('/api/auth/me',auth,(req,res)=>res.json({user:req.user}));
  app.use('/api',auth);
  app.use('/api',usuarios(db));
  app.use(['/api/ventas','/api/cotizaciones','/api/ordenes-venta'],guard('ventas'));
  // Bodega (inventario) también registra la recepción física de compras.
  app.use(['/api/compras','/api/proveedores/:id/historial'],(req,res,next)=>req.method==='POST'&&req.path==='/recepciones'&&req.user.role==='inventario'?next():guard('compras')(req,res,next));
  app.use(['/api/materiales/:id/entradas'],guard('inventario'));
  // Routers de módulos (cada uno valida sus permisos de lectura/escritura).
  app.use('/api',maestros(db));
  app.use('/api',compras(db));
  app.use('/api',inventario(db));
  app.use('/api',produccion(db));
  app.use('/api',traslados(db));
  app.use('/api',ventas(db));
  app.use('/api',reportes(db));
  app.get('/api/recursos/:resource',asyncRoute(async(req,res)=>{
    const c=resources[req.params.resource]; if(!c) fail(404,'Recurso no disponible.');
    if(c.admin && req.user.role!=='admin') fail(403,'No tienes permiso para consultar este recurso.');
    exigir(req.user,c.modulo,'leer');
    const params=[], where=fixedWhere(c,params);
    const q=await db.query(selectSql(c)+(where.length?' WHERE '+where.join(' AND '):'')+' ORDER BY t.id DESC',params);
    res.json({data:resultRows(q,c)});
  }));
  app.post('/api/recursos/:resource',asyncRoute(async(req,res)=>{
    const c=resources[req.params.resource]; if(!c) fail(404,'Recurso no disponible.');
    if(c.admin && req.user.role!=='admin') fail(403,'No tienes permiso para este recurso.');
    exigir(req.user,c.modulo,'escribir');
    if(c.table==='ordenes_produccion') fail(409,'Las órdenes de producción se crean con el flujo de autorización (/api/produccion/ordenes).');
    const data=validate(c,req.body,true), fields=Object.keys(data), columns=fields.map(k=>c.fields[k]);
    // El saldo inicial se registra con moverStock para que exista por almacén y en el historial.
    const conStock=['materiales','productos'].includes(c.table) && Number(data.stock)>0;
    const vals=fields.map(k=>k==='stock'&&conStock?0:data[k]);
    for(const [k,v] of Object.entries(c.fixed || {})){columns.push(k); vals.push(v)}
    await db.transaction(async tx=>{
      await tx.query(`INSERT INTO ${c.table} (${columns.join(',')}) VALUES (${vals.map((_,i)=>'$'+(i+1)).join(',')})`,vals);
      if(conStock){
        const material=c.table==='materiales';
        const alm=await almacenId(tx,req.body.almacenId,material?ALMACEN.TALLER:ALMACEN.TIENDA);
        await moverStock(tx,{almacenId:alm,[material?'materialId':'productoId']:data.id,cantidad:data.stock,tipo:'Saldo inicial',referencia:String(data.code || data.codigo),usuarioId:req.user.id});
      }
      if(c.table==='materiales') await syncProveedor(tx,data.id);
      await audit(tx,req.user,'crear',req.params.resource,data.id);
    });
    const q=await db.query(selectSql(c)+' WHERE t.id=$1',[data.id]); res.status(201).json({data:resultRows(q,c)[0]});
  }));
  app.put('/api/recursos/:resource/:id',asyncRoute(async(req,res)=>{
    const c=resources[req.params.resource]; if(!c) fail(404,'Recurso no disponible.');
    if(c.admin && req.user.role!=='admin') fail(403,'No tienes permiso para este recurso.');
    exigir(req.user,c.modulo,'escribir');
    if(!Number.isInteger(req.body?._version)) fail(400,'Falta la versión del registro; vuelve a cargar la página.');
    const data=validate(c,req.body,false); delete data.id;
    for(const key of c.immutableOnUpdate || []) delete data[key];
    const keys=Object.keys(data); if(!keys.length) fail(400,'No hay campos para actualizar.');
    const vals=keys.map(k=>data[k]), where=[];
    if(c.table==='finanzas_movimientos') where.push('venta_id IS NULL','id>0'); // los movimientos automáticos (ventas, devoluciones) no se editan
    if(c.table==='ordenes_produccion') where.push('elaborado_por IS NULL'); // solo órdenes históricas; las nuevas siguen su flujo
    vals.push(req.params.id); where.push(`id=$${vals.length}`);
    vals.push(req.body._version); where.push(`version=$${vals.length}`);
    for(const [k,v] of Object.entries(c.fixed || {})){vals.push(v);where.push(`${k}=$${vals.length}`)}
    await db.transaction(async tx=>{
      const q=await tx.query(`UPDATE ${c.table} SET ${keys.map((k,i)=>`${c.fields[k]}=$${i+1}`).join(',')},version=version+1 WHERE ${where.join(' AND ')} RETURNING id`,vals);
      if(!q.rows.length) fail(409,'El registro cambió o ya no existe. Vuelve a cargar la página.');
      if(c.table==='materiales' && 'supplier' in data) await syncProveedor(tx,req.params.id);
      await audit(tx,req.user,'actualizar',req.params.resource,req.params.id);
    });
    const q=await db.query(selectSql(c)+' WHERE t.id=$1',[req.params.id]); res.json({data:resultRows(q,c)[0]});
  }));
  app.delete('/api/recursos/:resource/:id',asyncRoute(async(req,res)=>{
    const c=resources[req.params.resource]; if(!c) fail(404,'Recurso no disponible.');
    if(req.user.role!=='admin') fail(403,'Solo administración puede eliminar registros.');
    // Financial entries generated by a sale are protected and must not be edited or erased here.
    if(c.table==='finanzas_movimientos') fail(403,'Los movimientos financieros no se eliminan desde esta API.');
    const vals=[req.params.id],where=['id=$1'];
    for(const [k,v] of Object.entries(c.fixed || {})){vals.push(v);where.push(`${k}=$${vals.length}`)}
    await db.transaction(async tx=>{const q=await tx.query(`DELETE FROM ${c.table} WHERE ${where.join(' AND ')} RETURNING id`,vals); if(!q.rows.length) fail(404,'Registro no encontrado.'); await audit(tx,req.user,'eliminar',req.params.resource,req.params.id);});
    res.status(204).end();
  }));
  app.post('/api/materiales/:id/entradas',asyncRoute(async(req,res)=>{
    const {quantity,unitCost,supplier='',invoice='',date=null,notes='',almacenId:alm=null,lote=''}=req.body||{};
    const q=Number(quantity),cost=Number(unitCost);
    if(!Number.isFinite(q)||q<=0||q>100000000||!Number.isFinite(cost)||cost<0) fail(400,'Revisa la cantidad y el costo.');
    if(typeof supplier!=='string'||typeof invoice!=='string'||typeof notes!=='string'||typeof lote!=='string'||lote.length>60||supplier.length>200||invoice.length>200||notes.length>1000||(date!==null && (typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)))) fail(400,'Datos de entrada inválidos.');
    const row=await db.transaction(async tx=>{
      const r=await tx.query('SELECT * FROM materiales WHERE id=$1 FOR UPDATE',[req.params.id]); const m=r.rows[0]; if(!m) fail(404,'Material no encontrado.');
      const stock=new Decimal(m.existencia).plus(q), weighted=new Decimal(m.existencia).times(m.costo).plus(new Decimal(q).times(cost)).div(stock).toDecimalPlaces(2);
      await tx.query('UPDATE materiales SET costo=$1,proveedor=$2 WHERE id=$3',[weighted.toFixed(2),supplier.trim() || m.proveedor,m.id]);
      const almacen=await almacenId(tx,alm,ALMACEN.TALLER);
      const l=lote.trim()?await crearLote(tx,{materialId:m.id,origen:'Compra',referencia:invoice.trim(),codigo:lote.trim()}):null;
      await tx.query('INSERT INTO entradas_material(material_id,fecha,proveedor,cantidad,costo_unitario,documento,notas,usuario_id,almacen_id,lote_id) VALUES($1,COALESCE($2::date,CURRENT_DATE),$3,$4,$5,$6,$7,$8,$9,$10)',[m.id,date,supplier.trim(),q,cost,invoice.trim(),notes.trim(),req.user.id,almacen,l?.id??null]);
      await moverStock(tx,{almacenId:almacen,materialId:m.id,loteId:l?.id??null,cantidad:q,tipo:'Entrada',referencia:invoice.trim(),motivo:'Entrada directa',usuarioId:req.user.id});
      if(supplier.trim()) await syncProveedor(tx,m.id);
      await audit(tx,req.user,'registrar entrada','materiales',m.id);
      return (await tx.query(selectSql(resources.materiales)+' WHERE t.id=$1',[m.id]));
    });
    res.status(201).json({data:resultRows(row,resources.materiales)[0]});
  }));
  async function quoteRows(tx){
    const quotes=(await tx.query('SELECT * FROM cotizaciones ORDER BY fecha DESC,id DESC')).rows;
    const items=(await tx.query('SELECT cotizacion_id,producto_id,cantidad,precio FROM cotizacion_detalles ORDER BY id')).rows;
    return quotes.map(q=>({id:q.id,cliente:q.cliente_nombre,fecha:dateValue(q.fecha),vencimiento:dateValue(q.vencimiento),estado:q.estado,notas:q.notas,_version:Number(q.version),items:items.filter(i=>i.cotizacion_id===q.id).map(i=>({productoId:Number(i.producto_id),cantidad:Number(i.cantidad),precio:Number(i.precio)}))}));
  }
  async function orderRows(tx){
    const orders=(await tx.query('SELECT * FROM ordenes_venta ORDER BY fecha DESC,id DESC')).rows;
    const lines=(await tx.query('SELECT d.orden_id,d.producto_id,p.nombre,d.cantidad,d.precio FROM orden_venta_detalles d JOIN productos p ON p.id=d.producto_id ORDER BY d.id')).rows;
    return orders.map(o=>({id:o.id,cotizacionId:o.cotizacion_id,cliente:o.cliente_nombre,fecha:dateValue(o.fecha),estado:o.estado,notas:o.notas,telefono:'—',metodo:'Por definir',_version:Number(o.version),productos:lines.filter(x=>x.orden_id===o.id).map(x=>({productoId:Number(x.producto_id),nombre:x.nombre,cantidad:Number(x.cantidad),precio:Number(x.precio)}))}));
  }
  async function quoteInput(tx,body){
    const {cliente,vencimiento,notas='',items}=body || {};
    if(typeof cliente!=='string'||!cliente.trim()||cliente.length>200 || typeof notas!=='string'||notas.length>1000 || typeof vencimiento!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(vencimiento)) fail(400,'Revisa el cliente y la fecha de vencimiento.');
    const valid=(await tx.query('SELECT $1::date >= CURRENT_DATE AS valido',[vencimiento])).rows[0];
    if(!valid.valido) fail(400,'El vencimiento no puede ser anterior a hoy.');
    if(!Array.isArray(items)||!items.length||items.length>100) fail(400,'Agrega al menos un producto.');
    const lineas=[],ids=new Set();
    for(const i of items){
      const id=Number(i.productoId), quantity=Number(i.cantidad);
      if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(quantity)||quantity<=0||ids.has(id)) fail(400,'Revisa productos y cantidades; no repitas productos.');ids.add(id);
      const q=await tx.query('SELECT precio FROM productos WHERE id=$1 AND activo=true',[id]); if(!q.rows.length) fail(400,'Producto no disponible.');
      lineas.push({id,quantity,price:Number(q.rows[0].precio)});
    }
    return {cliente:cliente.trim(),vencimiento,notas:notas.trim(),lineas};
  }
  app.get('/api/cotizaciones',asyncRoute(async(req,res)=>res.json({data:await quoteRows(db)})));
  app.post('/api/cotizaciones',asyncRoute(async(req,res)=>{
    const id=req.body?.id;
    if(typeof id!=='string'||!/^COT-[A-Za-z0-9-]{1,50}$/.test(id)) fail(400,'Código de cotización inválido.');
    await db.transaction(async tx=>{
      const data=await quoteInput(tx,req.body);
      await tx.query("INSERT INTO cotizaciones(id,cliente_nombre,fecha,vencimiento,estado,notas) VALUES($1,$2,CURRENT_DATE,$3,'Pendiente',$4)",[id,data.cliente,data.vencimiento,data.notas]);
      for(const line of data.lineas) await tx.query('INSERT INTO cotizacion_detalles(cotizacion_id,producto_id,cantidad,precio) VALUES($1,$2,$3,$4)',[id,line.id,line.quantity,line.price]);
      await audit(tx,req.user,'crear','cotizaciones',id);
    });res.status(201).json({data:(await quoteRows(db)).find(x=>x.id===id)});
  }));
  app.put('/api/cotizaciones/:id',asyncRoute(async(req,res)=>{
    await db.transaction(async tx=>{
      const r=await tx.query('SELECT estado,vencimiento,version FROM cotizaciones WHERE id=$1 FOR UPDATE',[req.params.id]); if(!r.rows.length) fail(404,'Cotización inexistente.');
      if(r.rows[0].estado!=='Pendiente') fail(409,'Solo puedes editar cotizaciones pendientes.');
      if(!Number.isInteger(req.body?._version) || Number(r.rows[0].version)!==req.body._version) fail(409,'La cotización cambió. Vuelve a cargar la página.');
      const data=await quoteInput(tx,req.body);
      await tx.query('UPDATE cotizaciones SET cliente_nombre=$1,vencimiento=$2,notas=$3,version=version+1 WHERE id=$4',[data.cliente,data.vencimiento,data.notas,req.params.id]);
      await tx.query('DELETE FROM cotizacion_detalles WHERE cotizacion_id=$1',[req.params.id]);
      for(const line of data.lineas) await tx.query('INSERT INTO cotizacion_detalles(cotizacion_id,producto_id,cantidad,precio) VALUES($1,$2,$3,$4)',[req.params.id,line.id,line.quantity,line.price]);
      await audit(tx,req.user,'editar','cotizaciones',req.params.id);
    });res.json({data:(await quoteRows(db)).find(x=>x.id===req.params.id)});
  }));
  app.delete('/api/cotizaciones/:id',asyncRoute(async(req,res)=>{
    if(req.user.role!=='admin') fail(403,'Solo administración puede eliminar cotizaciones.');
    await db.transaction(async tx=>{
      const r=await tx.query('SELECT estado FROM cotizaciones WHERE id=$1 FOR UPDATE',[req.params.id]);if(!r.rows.length) fail(404,'Cotización inexistente.');
      if(r.rows[0].estado==='Convertida') fail(409,'Una cotización convertida no se puede eliminar.');
      await tx.query('DELETE FROM cotizacion_detalles WHERE cotizacion_id=$1',[req.params.id]);await tx.query('DELETE FROM cotizaciones WHERE id=$1',[req.params.id]);await audit(tx,req.user,'eliminar','cotizaciones',req.params.id);
    });res.status(204).end();
  }));
  app.post('/api/cotizaciones/:id/convertir',asyncRoute(async(req,res)=>{
    const orderId=`OV-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    await db.transaction(async tx=>{
      const q=await tx.query('SELECT *,vencimiento>=CURRENT_DATE AS vigente FROM cotizaciones WHERE id=$1 FOR UPDATE',[req.params.id]);const c=q.rows[0];
      if(!c) fail(404,'Cotización inexistente.');if(c.estado!=='Pendiente'||!c.vigente) fail(409,'Solo se puede convertir una cotización pendiente y vigente.');
      await tx.query("INSERT INTO ordenes_venta(id,cotizacion_id,cliente_nombre,notas) VALUES($1,$2,$3,$4)",[orderId,c.id,c.cliente_nombre,c.notas]);
      await tx.query('INSERT INTO orden_venta_detalles(orden_id,producto_id,cantidad,precio) SELECT $1,producto_id,cantidad,precio FROM cotizacion_detalles WHERE cotizacion_id=$2',[orderId,c.id]);
      await tx.query("UPDATE cotizaciones SET estado='Convertida',version=version+1 WHERE id=$1",[c.id]);await audit(tx,req.user,'convertir','cotizaciones',c.id);
    });res.status(201).json({data:(await orderRows(db)).find(x=>x.id===orderId)});
  }));
  app.get('/api/ordenes-venta',asyncRoute(async(req,res)=>res.json({data:await orderRows(db)})));
  app.patch('/api/ordenes-venta/:id/estado',asyncRoute(async(req,res)=>{
    const status=req.body?.estado;if(!['En preparación','Enviada','Cancelada'].includes(status)) fail(400,status==='Completada'?'La orden se completa al facturarla.':'Estado no válido.');
    await db.transaction(async tx=>{
      const r=await tx.query('SELECT estado FROM ordenes_venta WHERE id=$1 FOR UPDATE',[req.params.id]);const o=r.rows[0];if(!o) fail(404,'Orden inexistente.');
      if(['Completada','Cancelada'].includes(o.estado)) fail(409,'La orden ya está cerrada.');
      const rank={'Pendiente':0,'En preparación':1,'Enviada':2,'Completada':3};
      if(status!=='Cancelada' && rank[status]<rank[o.estado]) fail(409,'No se puede retroceder el estado.');
      await tx.query('UPDATE ordenes_venta SET estado=$1,version=version+1 WHERE id=$2',[status,req.params.id]);await audit(tx,req.user,'cambiar estado','ordenes-venta',req.params.id);
    });res.json({data:(await orderRows(db)).find(x=>x.id===req.params.id)});
  }));

  app.use((req,res)=>res.status(404).json({error:'Ruta no encontrada.'}));
  app.use((err,req,res,next)=>{
    if(err instanceof HttpError) return res.status(err.status).json({error:err.message});
    if(err.type==='entity.parse.failed') return res.status(400).json({error:'JSON inválido.'});
    if(err.code==='23505') return res.status(409).json({error:'Ya existe un registro con ese identificador o código.'});
    if(err.code==='23503') return res.status(409).json({error:'El registro está relacionado con otros datos o la referencia no existe.'});
    if(['23514','23502','22P02','22007','22008','22003'].includes(err.code)) return res.status(400).json({error:'Los datos no cumplen las reglas del registro.'});
    console.error('Error API:',err.message); return res.status(500).json({error:'No se pudo completar la operación.'});
  });
  return app;
}
