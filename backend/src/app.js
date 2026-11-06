import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Decimal from 'decimal.js';
import { resources } from './resources.js';

class HttpError extends Error { constructor(status,message) { super(message); this.status=status; } }
const fail=(status,msg)=>{throw new HttpError(status,msg)};
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const dateValue=x=>x instanceof Date ? x.toISOString().slice(0,10) : x;
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
function selectSql(c) {
  let base=`SELECT t.*`;
  if(c.table==='clientes') base+=`, (SELECT COUNT(*) FROM ventas v WHERE v.cliente_id=t.id AND v.estado='Completada') AS purchases, (SELECT COALESCE(SUM(v.total),0) FROM ventas v WHERE v.cliente_id=t.id AND v.estado='Completada') AS amount, (SELECT MAX(v.fecha)::date FROM ventas v WHERE v.cliente_id=t.id AND v.estado='Completada') AS last_purchase`;
  if(c.table==='proveedores') base+=`, (SELECT COUNT(*) FROM materiales m WHERE m.proveedor=t.nombre) AS materials`;
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
      if (['id','quantity','progress','stock','minimo','plazas'].includes(key) && (key!=='stock' || c.table==='productos') && !Number.isSafeInteger(clean[key])) fail(400,`El campo ${key} debe ser entero.`);
    } else if (val!==null && typeof val!=='string' && typeof val!=='boolean') fail(400,`El campo ${key} no es válido.`);
    if(typeof clean[key]==='string') { clean[key]=clean[key].trim(); if(clean[key].length>1000) fail(400,`El campo ${key} es demasiado largo.`); }
  }
  for(const k of c.required) if(k in clean && (clean[k]===null || String(clean[k]).trim()==='')) fail(400,`El campo ${k} es obligatorio.`);
  if(clean.quantity!==undefined && clean.quantity<=0) fail(400,'La cantidad debe ser mayor que cero.');
  if(clean.progress!==undefined && clean.progress>100) fail(400,'El progreso no puede superar 100.');
  if(c.table==='promociones' && clean.tipo!==undefined && !['porcentaje','fijo'].includes(clean.tipo)) fail(400,'Tipo de promoción inválido.');
  return clean;
}
const audit = (db,user,action,resource,id)=>db.query('INSERT INTO auditoria(usuario_id,accion,recurso,registro) VALUES($1,$2,$3,$4)',[user.id,action,resource,String(id)]);

export function createApp({db, jwtSecret, corsOrigin='http://localhost:5173'}) {
  if(!db || !jwtSecret || jwtSecret.length<32) throw new Error('La clave JWT debe contener al menos 32 caracteres.');
  const app=express();
  app.disable('x-powered-by');
  app.use(helmet()); app.use(cors({origin:corsOrigin.split(',')})); app.use(express.json({limit:'256kb'}));
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
  app.get('/api/recursos/:resource',asyncRoute(async(req,res)=>{
    const c=resources[req.params.resource]; if(!c) fail(404,'Recurso no disponible.');
    if(c.admin && req.user.role!=='admin') fail(403,'No tienes permiso para consultar este recurso.');
    const params=[], where=fixedWhere(c,params);
    const q=await db.query(selectSql(c)+(where.length?' WHERE '+where.join(' AND '):'')+' ORDER BY t.id DESC',params);
    res.json({data:resultRows(q,c)});
  }));
  app.post('/api/recursos/:resource',asyncRoute(async(req,res)=>{
    const c=resources[req.params.resource]; if(!c) fail(404,'Recurso no disponible.');
    if(c.admin && req.user.role!=='admin') fail(403,'No tienes permiso para este recurso.');
    const data=validate(c,req.body,true), fields=Object.keys(data), columns=fields.map(k=>c.fields[k]), vals=fields.map(k=>data[k]);
    for(const [k,v] of Object.entries(c.fixed || {})){columns.push(k); vals.push(v)}
    await db.transaction(async tx=>{
      await tx.query(`INSERT INTO ${c.table} (${columns.join(',')}) VALUES (${vals.map((_,i)=>'$'+(i+1)).join(',')})`,vals);
      if(['materiales','productos'].includes(c.table) && Number(data.stock)>0){
        const itemColumn=c.table==='materiales'?'material_id':'producto_id';
        await tx.query(`INSERT INTO movimientos_inventario(${itemColumn},tipo,cantidad,saldo,referencia,usuario_id) VALUES($1,$2,$3,$4,$5,$6)`,[data.id,'Saldo inicial',data.stock,data.stock,String(data.code || data.codigo),req.user.id]);
      }
      await audit(tx,req.user,'crear',req.params.resource,data.id);
    });
    const q=await db.query(selectSql(c)+' WHERE t.id=$1',[data.id]); res.status(201).json({data:resultRows(q,c)[0]});
  }));
  app.put('/api/recursos/:resource/:id',asyncRoute(async(req,res)=>{
    const c=resources[req.params.resource]; if(!c) fail(404,'Recurso no disponible.');
    if(c.admin && req.user.role!=='admin') fail(403,'No tienes permiso para este recurso.');
    if(!Number.isInteger(req.body?._version)) fail(400,'Falta la versión del registro; vuelve a cargar la página.');
    const data=validate(c,req.body,false); delete data.id;
    for(const key of c.immutableOnUpdate || []) delete data[key];
    const keys=Object.keys(data); if(!keys.length) fail(400,'No hay campos para actualizar.');
    const vals=keys.map(k=>data[k]), where=[];
    if(c.table==='finanzas_movimientos') where.push('venta_id IS NULL');
    vals.push(req.params.id); where.push(`id=$${vals.length}`);
    vals.push(req.body._version); where.push(`version=$${vals.length}`);
    for(const [k,v] of Object.entries(c.fixed || {})){vals.push(v);where.push(`${k}=$${vals.length}`)}
    await db.transaction(async tx=>{
      const q=await tx.query(`UPDATE ${c.table} SET ${keys.map((k,i)=>`${c.fields[k]}=$${i+1}`).join(',')},version=version+1 WHERE ${where.join(' AND ')} RETURNING id`,vals);
      if(!q.rows.length) fail(409,'El registro cambió o ya no existe. Vuelve a cargar la página.');
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
  app.get('/api/ventas',asyncRoute(async(req,res)=>{
    const q=await db.query('SELECT id,cliente_nombre AS cliente,fecha,metodo,subtotal,descuento,total,estado FROM ventas ORDER BY fecha DESC LIMIT 500');
    res.json({data:q.rows.map(row=>({...row,id:Number(row.id),subtotal:Number(row.subtotal),descuento:Number(row.descuento),total:Number(row.total)}))});
  }));
  app.post('/api/ventas',asyncRoute(async(req,res)=>{
    const {cliente='Cliente de mostrador',clienteId=null,metodo='Efectivo',porcentajeDescuento=0,items}=req.body || {};
    if(typeof cliente!=='string'||!cliente.trim()||cliente.length>200) fail(400,'Indica un cliente válido.');
    if(!['Efectivo','Transferencia','Tarjeta'].includes(metodo)) fail(400,'Método de pago inválido.');
    if(!Array.isArray(items)||!items.length||items.length>100) fail(400,'Agrega entre 1 y 100 productos.');
    const pct=Number(porcentajeDescuento); if(!Number.isFinite(pct)||pct<0||pct>100) fail(400,'El descuento debe estar entre 0 y 100.');
    const ids=new Set();
    for(const item of items){
      if(!Number.isSafeInteger(Number(item.productoId)) || Number(item.productoId)<=0 || !Number.isSafeInteger(Number(item.cantidad)) || Number(item.cantidad)<=0) fail(400,'Los productos y cantidades deben ser válidos.');
      if(ids.has(Number(item.productoId))) fail(400,'No repitas un producto en el carrito.'); ids.add(Number(item.productoId));
    }
    const sale=await db.transaction(async tx=>{
      let lines=[], subtotal=new Decimal(0);
      // Stable lock order prevents deadlocks when several sales share products.
      for(const item of [...items].sort((a,b)=>Number(a.productoId)-Number(b.productoId))){
        const q=await tx.query(`SELECT p.id,p.codigo,p.nombre,p.existencia,p.activo,COALESCE((SELECT ROUND(GREATEST(0,CASE WHEN pr.tipo='porcentaje' THEN p.precio*(1-pr.valor/100) ELSE p.precio-pr.valor END),2) FROM promociones pr WHERE pr.producto_id=p.id AND pr.activa=true AND CURRENT_DATE BETWEEN pr.inicio AND pr.fin ORDER BY pr.id DESC LIMIT 1),p.precio) AS precio FROM productos p WHERE p.id=$1 FOR UPDATE`,[Number(item.productoId)]);
        const p=q.rows[0]; if(!p || !p.activo) fail(400,'Hay un producto inexistente o inactivo.');
        const qty=Number(item.cantidad); if(Number(p.existencia)<qty) fail(409,`Stock insuficiente para ${p.nombre}.`);
        const line=new Decimal(p.precio).times(qty).toDecimalPlaces(2); subtotal=subtotal.plus(line);
        lines.push({id:Number(p.id),nombre:p.nombre,codigo:p.codigo,precio:Number(p.precio),cantidad:qty,subtotal:line.toFixed(2),stock:Number(p.existencia)});
      }
      const descuento=subtotal.times(pct).div(100).toDecimalPlaces(2), total=subtotal.minus(descuento);
      if(clienteId){const c=await tx.query('SELECT id FROM clientes WHERE id=$1 AND estado=$2',[clienteId,'Activo']); if(!c.rows.length) fail(400,'El cliente seleccionado no existe o está inactivo.');}
      const created=await tx.query('INSERT INTO ventas(cliente_id,cliente_nombre,metodo,subtotal,descuento,total,usuario_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,fecha',[clienteId,cliente.trim(),metodo,subtotal.toFixed(2),descuento.toFixed(2),total.toFixed(2),req.user.id]);
      const saleId=Number(created.rows[0].id);
      for(const l of lines){
        await tx.query('INSERT INTO venta_detalles(venta_id,producto_id,cantidad,precio,subtotal) VALUES($1,$2,$3,$4,$5)',[saleId,l.id,l.cantidad,l.precio,l.subtotal]);
        await tx.query('UPDATE productos SET existencia=existencia-$1,version=version+1 WHERE id=$2',[l.cantidad,l.id]);
        await tx.query('INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,saldo,referencia,usuario_id) VALUES($1,$2,$3,$4,$5,$6)',[l.id,'Venta',-l.cantidad,l.stock-l.cantidad,`VENTA-${saleId}`,req.user.id]);
      }
      await tx.query("INSERT INTO finanzas_movimientos(id,tipo,fecha,concepto,categoria,monto,metodo,estado,venta_id) VALUES($1,'Ingreso',CURRENT_DATE,$2,'Ventas',$3,$4,'Confirmado',$5)",[-saleId,`Venta #${saleId}`,total.toFixed(2),metodo,saleId]);
      await audit(tx,req.user,'registrar','ventas',saleId);
      return {id:`V-${saleId}`,cliente:cliente.trim(),fecha:created.rows[0].fecha,metodo,productos:lines,subtotal:Number(subtotal),descuento:Number(descuento),total:Number(total)};
    });
    res.status(201).json({data:sale});
  }));
  app.post('/api/materiales/:id/entradas',asyncRoute(async(req,res)=>{
    const {quantity,unitCost,supplier='',invoice='',date=null,notes=''}=req.body||{};
    const q=Number(quantity),cost=Number(unitCost);
    if(!Number.isFinite(q)||q<=0||q>100000000||!Number.isFinite(cost)||cost<0) fail(400,'Revisa la cantidad y el costo.');
    if(typeof supplier!=='string'||typeof invoice!=='string'||typeof notes!=='string'||supplier.length>200||invoice.length>200||notes.length>1000||(date!==null && (typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)))) fail(400,'Datos de entrada inválidos.');
    const row=await db.transaction(async tx=>{
      const r=await tx.query('SELECT * FROM materiales WHERE id=$1 FOR UPDATE',[req.params.id]); const m=r.rows[0]; if(!m) fail(404,'Material no encontrado.');
      const stock=new Decimal(m.existencia).plus(q), weighted=new Decimal(m.existencia).times(m.costo).plus(new Decimal(q).times(cost)).div(stock).toDecimalPlaces(2);
      await tx.query('UPDATE materiales SET existencia=$1,costo=$2,proveedor=$3,version=version+1 WHERE id=$4',[stock.toFixed(3),weighted.toFixed(2),supplier.trim() || m.proveedor,m.id]);
      await tx.query('INSERT INTO entradas_material(material_id,fecha,proveedor,cantidad,costo_unitario,documento,notas,usuario_id) VALUES($1,COALESCE($2::date,CURRENT_DATE),$3,$4,$5,$6,$7,$8)',[m.id,date,supplier.trim(),q,cost,invoice.trim(),notes.trim(),req.user.id]);
      await tx.query('INSERT INTO movimientos_inventario(material_id,tipo,cantidad,saldo,referencia,usuario_id) VALUES($1,$2,$3,$4,$5,$6)',[m.id,'Entrada',q,stock.toFixed(3),invoice.trim(),req.user.id]);
      await audit(tx,req.user,'registrar entrada','materiales',m.id);
      return (await tx.query(selectSql(resources.materiales)+' WHERE t.id=$1',[m.id]));
    });
    res.status(201).json({data:resultRows(row,resources.materiales)[0]});
  }));
  app.get('/api/movimientos',asyncRoute(async(req,res)=>{
    const r=await db.query('SELECT m.id,m.tipo,m.cantidad,m.saldo,m.referencia,m.fecha,COALESCE(p.nombre,ma.nombre) AS articulo,u.nombre AS usuario FROM movimientos_inventario m LEFT JOIN productos p ON p.id=m.producto_id LEFT JOIN materiales ma ON ma.id=m.material_id JOIN usuarios u ON u.id=m.usuario_id ORDER BY m.fecha DESC LIMIT 500');
    res.json({data:r.rows});
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
    const status=req.body?.estado;if(!['En preparación','Enviada','Completada','Cancelada'].includes(status)) fail(400,'Estado no válido.');
    await db.transaction(async tx=>{
      const r=await tx.query('SELECT estado FROM ordenes_venta WHERE id=$1 FOR UPDATE',[req.params.id]);const o=r.rows[0];if(!o) fail(404,'Orden inexistente.');
      if(['Completada','Cancelada'].includes(o.estado)) fail(409,'La orden ya está cerrada.');
      const rank={'Pendiente':0,'En preparación':1,'Enviada':2,'Completada':3};
      if(status!=='Cancelada' && rank[status]<rank[o.estado]) fail(409,'No se puede retroceder el estado.');
      await tx.query('UPDATE ordenes_venta SET estado=$1,version=version+1 WHERE id=$2',[status,req.params.id]);await audit(tx,req.user,'cambiar estado','ordenes-venta',req.params.id);
    });res.json({data:(await orderRows(db)).find(x=>x.id===req.params.id)});
  }));

  const code=(prefix)=>`${prefix}-${Date.now()}-${Math.floor(Math.random()*100000)}`;
  app.get('/api/compras',asyncRoute(async(req,res)=>{
    const solicitudes=(await db.query(`SELECT s.id,s.fecha,s.solicitante,s.area,s.material_id,m.nombre AS producto,s.cantidad,s.unidad,s.prioridad,s.estado,s.observaciones AS justificacion
      FROM solicitudes_compra s JOIN materiales m ON m.id=s.material_id ORDER BY s.fecha DESC,s.id DESC`)).rows;
    const ordenes=(await db.query(`SELECT o.id,o.solicitud_id,o.fecha,o.fecha_entrega,o.estado,p.nombre AS proveedor,p.id AS proveedor_id,m.nombre AS producto,m.id AS material_id,d.cantidad,d.precio,
      COALESCE((SELECT SUM(r.cantidad) FROM recepciones_compra r WHERE r.orden_detalle_id=d.id),0) AS recibido
      FROM ordenes_compra o JOIN proveedores p ON p.id=o.proveedor_id JOIN orden_compra_detalles d ON d.orden_id=o.id JOIN materiales m ON m.id=d.material_id ORDER BY o.fecha DESC,o.id DESC`)).rows;
    const recepciones=(await db.query(`SELECT r.id,r.fecha,r.cantidad,r.documento,r.observaciones,o.id AS orden_id,m.nombre AS producto,p.nombre AS proveedor
      FROM recepciones_compra r JOIN orden_compra_detalles d ON d.id=r.orden_detalle_id JOIN ordenes_compra o ON o.id=d.orden_id
      JOIN proveedores p ON p.id=o.proveedor_id JOIN materiales m ON m.id=d.material_id ORDER BY r.fecha DESC`)).rows;
    res.json({data:{solicitudes:solicitudes.map(x=>({...x,fecha:dateValue(x.fecha),cantidad:Number(x.cantidad),material_id:Number(x.material_id)})),
      ordenes:ordenes.map(x=>({...x,fecha:dateValue(x.fecha),fecha_entrega:dateValue(x.fecha_entrega),cantidad:Number(x.cantidad),precio:Number(x.precio),recibido:Number(x.recibido),total:Number(new Decimal(x.cantidad).times(x.precio))})),
      recepciones:recepciones.map(x=>({...x,cantidad:Number(x.cantidad)}))}});
  }));
  app.post('/api/compras/solicitudes',asyncRoute(async(req,res)=>{
    const {materialId,cantidad,solicitante,area='',prioridad='Media',justificacion=''}=req.body||{};
    if(!Number.isSafeInteger(Number(materialId))||Number(materialId)<=0||!Number.isFinite(Number(cantidad))||Number(cantidad)<=0||typeof solicitante!=='string'||!solicitante.trim()||solicitante.length>200||typeof area!=='string'||area.length>200||!['Alta','Media','Baja'].includes(prioridad)||typeof justificacion!=='string'||justificacion.length>1000) fail(400,'Revisa los datos de la solicitud.');
    const id=code('SOL');
    await db.transaction(async tx=>{
      const mat=(await tx.query('SELECT unidad FROM materiales WHERE id=$1',[Number(materialId)])).rows[0];if(!mat) fail(400,'El material no existe.');
      await tx.query('INSERT INTO solicitudes_compra(id,material_id,solicitante,cantidad,area,unidad,prioridad,observaciones) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,Number(materialId),solicitante.trim(),Number(cantidad),area,mat.unidad,prioridad,justificacion]);await audit(tx,req.user,'crear','solicitudes-compra',id);
    });res.status(201).json({data:{id}});
  }));
  app.patch('/api/compras/solicitudes/:id/estado',asyncRoute(async(req,res)=>{
    const estado=req.body?.estado;if(!['Aprobada','Rechazada'].includes(estado)) fail(400,'Estado inválido.');
    await db.transaction(async tx=>{
      const q=await tx.query("UPDATE solicitudes_compra SET estado=$1 WHERE id=$2 AND estado='Pendiente' RETURNING id",[estado,req.params.id]);if(!q.rows.length) fail(409,'La solicitud ya no está pendiente o no existe.');await audit(tx,req.user,'cambiar estado','solicitudes-compra',req.params.id);
    });res.json({data:{id:req.params.id,estado}});
  }));
  app.post('/api/compras/ordenes',asyncRoute(async(req,res)=>{
    const {proveedorId,materialId,solicitudId=null,cantidad,precio,fechaEntrega=null}=req.body||{};
    const supplier=Number(proveedorId),material=Number(materialId),qty=Number(cantidad),price=Number(precio);
    if(precio==='' || precio===null || precio===undefined) fail(400,'Indica el precio unitario.');
    if(!Number.isSafeInteger(supplier)||supplier<=0||!Number.isSafeInteger(material)||material<=0||!Number.isFinite(qty)||qty<=0||!Number.isFinite(price)||price<0||(fechaEntrega!==null && (typeof fechaEntrega!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(fechaEntrega)))) fail(400,'Revisa el proveedor, material, cantidad y precio.');
    const id=code('OC');
    await db.transaction(async tx=>{
      if(!(await tx.query("SELECT id FROM proveedores WHERE id=$1 AND estado='Activo'",[supplier])).rows.length) fail(400,'El proveedor no existe o está inactivo.');
      if(!(await tx.query('SELECT id FROM materiales WHERE id=$1',[material])).rows.length) fail(400,'El material no existe.');
      if(solicitudId){
        const r=await tx.query('SELECT estado,material_id FROM solicitudes_compra WHERE id=$1 FOR UPDATE',[solicitudId]);const sol=r.rows[0];
        if(!sol || sol.estado!=='Aprobada' || Number(sol.material_id)!==material) fail(409,'La solicitud debe estar aprobada y corresponder al material.');
        await tx.query("UPDATE solicitudes_compra SET estado='Orden generada' WHERE id=$1",[solicitudId]);
      }
      await tx.query('INSERT INTO ordenes_compra(id,solicitud_id,proveedor_id,fecha_entrega,usuario_id) VALUES($1,$2,$3,$4,$5)',[id,solicitudId||null,supplier,fechaEntrega||null,req.user.id]);
      await tx.query('INSERT INTO orden_compra_detalles(orden_id,material_id,cantidad,precio) VALUES($1,$2,$3,$4)',[id,material,qty,price]);await audit(tx,req.user,'crear','ordenes-compra',id);
    });res.status(201).json({data:{id}});
  }));
  app.patch('/api/compras/ordenes/:id/estado',asyncRoute(async(req,res)=>{
    const estado=req.body?.estado;if(!['Enviada','Cancelada'].includes(estado)) fail(400,'Estado inválido.');
    await db.transaction(async tx=>{
      const o=(await tx.query('SELECT estado,solicitud_id FROM ordenes_compra WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];if(!o) fail(404,'Orden inexistente.');
      if((estado==='Enviada' && o.estado!=='Borrador')||(estado==='Cancelada' && !['Borrador','Enviada'].includes(o.estado))) fail(409,'Esta orden no admite ese cambio de estado.');
      await tx.query('UPDATE ordenes_compra SET estado=$1 WHERE id=$2',[estado,req.params.id]);
      if(estado==='Cancelada' && o.solicitud_id) await tx.query("UPDATE solicitudes_compra SET estado='Aprobada' WHERE id=$1",[o.solicitud_id]);await audit(tx,req.user,'cambiar estado','ordenes-compra',req.params.id);
    });res.json({data:{id:req.params.id,estado}});
  }));
  app.post('/api/compras/recepciones',asyncRoute(async(req,res)=>{
    const {ordenId,cantidad,documento='',observaciones=''}=req.body||{};const qty=Number(cantidad);
    if(typeof ordenId!=='string'||!Number.isFinite(qty)||qty<=0||qty>100000000||typeof documento!=='string'||documento.length>200||typeof observaciones!=='string'||observaciones.length>1000) fail(400,'Revisa la recepción.');
    await db.transaction(async tx=>{
      const o=(await tx.query('SELECT id,estado FROM ordenes_compra WHERE id=$1 FOR UPDATE',[ordenId])).rows[0];
      if(!o||!['Enviada','Parcial'].includes(o.estado)) fail(409,'La orden no permite recibir mercancía.');
      const d=(await tx.query('SELECT * FROM orden_compra_detalles WHERE orden_id=$1',[ordenId])).rows[0];
      const received=Number((await tx.query('SELECT COALESCE(SUM(cantidad),0) AS n FROM recepciones_compra WHERE orden_detalle_id=$1',[d.id])).rows[0].n);
      if(new Decimal(received).plus(qty).greaterThan(d.cantidad)) fail(409,'La cantidad supera lo pendiente de recepción.');
      const m=(await tx.query('SELECT * FROM materiales WHERE id=$1 FOR UPDATE',[d.material_id])).rows[0];
      const balance=new Decimal(m.existencia).plus(qty), avg=new Decimal(m.existencia).times(m.costo).plus(new Decimal(qty).times(d.precio)).div(balance).toDecimalPlaces(2);
      await tx.query('INSERT INTO recepciones_compra(orden_detalle_id,cantidad,documento,observaciones,usuario_id) VALUES($1,$2,$3,$4,$5)',[d.id,qty,documento,observaciones,req.user.id]);
      await tx.query('UPDATE materiales SET existencia=$1,costo=$2,version=version+1 WHERE id=$3',[balance.toFixed(3),avg.toFixed(2),m.id]);
      await tx.query('INSERT INTO movimientos_inventario(material_id,tipo,cantidad,saldo,referencia,usuario_id) VALUES($1,$2,$3,$4,$5,$6)',[m.id,'Recepción de compra',qty,balance.toFixed(3),ordenId,req.user.id]);
      await tx.query('UPDATE ordenes_compra SET estado=$1 WHERE id=$2',[new Decimal(received).plus(qty).equals(d.cantidad)?'Recibida':'Parcial',ordenId]);await audit(tx,req.user,'recibir','ordenes-compra',ordenId);
    });res.status(201).json({data:{ordenId}});
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
