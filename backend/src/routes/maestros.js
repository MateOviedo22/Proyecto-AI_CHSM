import {Router} from 'express';
import Decimal from 'decimal.js';
import {asyncRoute,fail,audit,entero,numero,texto,uno,lista,dateValue} from '../http.js';
import {exigir} from '../permisos.js';
export const UNIDADES=['unidad','par','m','cm','m²','dm²','pie²','kg','g','l','ml','carrete','rollo','pliego','juego'];
const MAX_NIVELES=5;
// Explosión de la ficha técnica (BOM multinivel): devuelve los materiales necesarios para `cantidad` unidades.
// Los componentes (subensambles) se resuelven con su ficha vigente; se detectan ciclos y se limita la profundidad.
export async function explotar(tx,fichaId,cantidad,{nivel=0,visitados=new Set(),acumulado=new Map()}={}){
  if(nivel>=MAX_NIVELES) fail(409,`La ficha supera ${MAX_NIVELES} niveles de componentes.`);
  const f=(await tx.query('SELECT f.id,f.producto_id,p.nombre FROM fichas_tecnicas f JOIN productos p ON p.id=f.producto_id WHERE f.id=$1',[fichaId])).rows[0];
  if(!f) fail(404,'Ficha técnica no encontrada.');
  if(visitados.has(Number(f.producto_id))) fail(409,`Ciclo detectado: ${f.nombre} se incluye a sí mismo como componente.`);
  const vis=new Set(visitados).add(Number(f.producto_id));
  const mats=(await tx.query('SELECT fm.material_id,fm.cantidad,fm.merma_pct,m.nombre,m.unidad,m.costo FROM ficha_materiales fm JOIN materiales m ON m.id=fm.material_id WHERE fm.ficha_id=$1',[fichaId])).rows;
  for(const m of mats){
    const q=new Decimal(m.cantidad).times(cantidad).times(new Decimal(1).plus(new Decimal(m.merma_pct).div(100)));
    const prev=acumulado.get(Number(m.material_id));
    acumulado.set(Number(m.material_id),{materialId:Number(m.material_id),nombre:m.nombre,unidad:m.unidad,costo:Number(m.costo),cantidad:(prev?prev.cantidad:new Decimal(0)).plus(q)});
  }
  const comps=(await tx.query('SELECT c.producto_id,c.cantidad,p.nombre,(SELECT id FROM fichas_tecnicas v WHERE v.producto_id=c.producto_id AND v.estado=\'Vigente\') AS ficha FROM ficha_componentes c JOIN productos p ON p.id=c.producto_id WHERE c.ficha_id=$1',[fichaId])).rows;
  for(const c of comps){
    if(vis.has(Number(c.producto_id))) fail(409,`Ciclo detectado con el componente ${c.nombre}.`);
    if(!c.ficha) fail(409,`El componente ${c.nombre} no tiene una ficha técnica vigente.`);
    await explotar(tx,c.ficha,new Decimal(c.cantidad).times(cantidad),{nivel:nivel+1,visitados:vis,acumulado});
  }
  return acumulado;
}
export const explosionLista=mapa=>[...mapa.values()].map(x=>({...x,cantidad:Number(x.cantidad.toDecimalPlaces(3)),costoTotal:Number(x.cantidad.times(x.costo).toDecimalPlaces(2))}));

export default function maestros(db){
  const r=Router();
  async function fichas(tx,where='',params=[]){
    const head=(await tx.query(`SELECT f.*,p.nombre AS producto,p.codigo AS producto_codigo,u.nombre AS creado_por_nombre FROM fichas_tecnicas f JOIN productos p ON p.id=f.producto_id LEFT JOIN usuarios u ON u.id=f.creado_por ${where} ORDER BY p.nombre,f.id DESC`,params)).rows;
    if(!head.length) return [];
    const ids=head.map(f=>f.id);
    const mats=(await tx.query('SELECT fm.*,m.nombre,m.codigo,m.unidad,m.costo FROM ficha_materiales fm JOIN materiales m ON m.id=fm.material_id WHERE fm.ficha_id=ANY($1) ORDER BY fm.parte,m.nombre',[ids])).rows;
    const comps=(await tx.query('SELECT c.*,p.nombre,p.codigo FROM ficha_componentes c JOIN productos p ON p.id=c.producto_id WHERE c.ficha_id=ANY($1) ORDER BY c.parte,p.nombre',[ids])).rows;
    return head.map(f=>{
      const materiales=mats.filter(m=>m.ficha_id===f.id).map(m=>({materialId:Number(m.material_id),codigo:m.codigo,nombre:m.nombre,unidad:m.unidad,cantidad:Number(m.cantidad),mermaPct:Number(m.merma_pct),parte:m.parte,costoUnitario:Number(m.costo),costo:Number(new Decimal(m.cantidad).times(1+Number(m.merma_pct)/100).times(m.costo).toDecimalPlaces(2))}));
      const componentes=comps.filter(c=>c.ficha_id===f.id).map(c=>({productoId:Number(c.producto_id),codigo:c.codigo,nombre:c.nombre,cantidad:Number(c.cantidad),parte:c.parte}));
      return {id:Number(f.id),codigo:f.codigo,productoId:Number(f.producto_id),producto:f.producto,productoCodigo:f.producto_codigo,nombre:f.nombre,versionFicha:f.version_ficha,tiempoMinutos:Number(f.tiempo_minutos),notas:f.notas,estado:f.estado,
        creadoPor:f.creado_por_nombre,actualizadoEn:f.actualizado_en,_version:Number(f.version),materiales,componentes,partes:[...new Set([...materiales,...componentes].map(x=>x.parte))],costoMateriales:Number(materiales.reduce((s,m)=>s+m.costo,0).toFixed(2))};
    });
  }
  async function datosFicha(tx,b){
    const d={productoId:entero(b.productoId,'producto'),nombre:texto(b.nombre,'nombre',{requerido:true}),versionFicha:texto(b.versionFicha||'1.0','versión',{max:20}),tiempoMinutos:entero(b.tiempoMinutos??0,'tiempo',{min:0}),notas:texto(b.notas,'notas',{max:2000}),codigo:texto(b.codigo,'código',{max:60})};
    const p=(await tx.query('SELECT codigo FROM productos WHERE id=$1',[d.productoId])).rows[0]; if(!p) fail(400,'El producto no existe.');
    if(!d.codigo) d.codigo=`FT-${p.codigo}-V${d.versionFicha}`;
    const mats=Array.isArray(b.materiales)?b.materiales:[], comps=Array.isArray(b.componentes)?b.componentes:[];
    if(!mats.length && !comps.length) fail(400,'La ficha debe incluir al menos un material o componente.');
    if(mats.length>200||comps.length>50) fail(400,'Demasiadas líneas en la ficha.');
    const seen=new Set(), seenC=new Set();
    d.materiales=mats.map(m=>{const id=entero(m.materialId,'material'); if(seen.has(id)) fail(400,'No repitas un material; ajusta su cantidad.'); seen.add(id);
      return {materialId:id,cantidad:numero(m.cantidad,'cantidad',{positivo:true}),mermaPct:numero(m.mermaPct??0,'merma',{max:99}),parte:texto(m.parte||'General','parte',{max:80})};});
    d.componentes=comps.map(c=>{const id=entero(c.productoId,'componente'); if(id===d.productoId) fail(400,'Un producto no puede ser componente de sí mismo.'); if(seenC.has(id)) fail(400,'No repitas un componente.'); seenC.add(id);
      return {productoId:id,cantidad:numero(c.cantidad,'cantidad',{positivo:true}),parte:texto(c.parte||'General','parte',{max:80})};});
    for(const m of d.materiales) if(!(await tx.query('SELECT 1 FROM materiales WHERE id=$1',[m.materialId])).rows.length) fail(400,'Hay un material inexistente.');
    for(const c of d.componentes) if(!(await tx.query('SELECT 1 FROM productos WHERE id=$1',[c.productoId])).rows.length) fail(400,'Hay un componente inexistente.');
    return d;
  }
  async function guardarLineas(tx,id,d){
    await tx.query('DELETE FROM ficha_materiales WHERE ficha_id=$1',[id]); await tx.query('DELETE FROM ficha_componentes WHERE ficha_id=$1',[id]);
    for(const m of d.materiales) await tx.query('INSERT INTO ficha_materiales(ficha_id,material_id,cantidad,merma_pct,parte) VALUES($1,$2,$3,$4,$5)',[id,m.materialId,m.cantidad,m.mermaPct,m.parte]);
    for(const c of d.componentes) await tx.query('INSERT INTO ficha_componentes(ficha_id,producto_id,cantidad,parte) VALUES($1,$2,$3,$4)',[id,c.productoId,c.cantidad,c.parte]);
    // Comprueba ciclos con los componentes que ya tienen ficha vigente.
    const comps=(await tx.query("SELECT c.producto_id,(SELECT id FROM fichas_tecnicas v WHERE v.producto_id=c.producto_id AND v.estado='Vigente') AS ficha FROM ficha_componentes c WHERE c.ficha_id=$1",[id])).rows;
    for(const c of comps) if(c.ficha) await explotar(tx,c.ficha,1,{visitados:new Set([d.productoId])});
  }
  r.get('/fichas-tecnicas',asyncRoute(async(req,res)=>{exigir(req.user,'produccion','leer');res.json({data:await fichas(db)})}));
  r.get('/fichas-tecnicas/:id',asyncRoute(async(req,res)=>{exigir(req.user,'produccion','leer');const f=(await fichas(db,'WHERE f.id=$1',[entero(req.params.id,'id')]))[0];if(!f)fail(404,'Ficha no encontrada.');res.json({data:f})}));
  r.get('/fichas-tecnicas/:id/explosion',asyncRoute(async(req,res)=>{
    exigir(req.user,'produccion','leer');const cantidad=numero(req.query.cantidad??1,'cantidad',{positivo:true});
    const lista=explosionLista(await explotar(db,entero(req.params.id,'id'),cantidad));
    res.json({data:{cantidad,materiales:lista,costoTotal:Number(lista.reduce((s,x)=>s+x.costoTotal,0).toFixed(2))}});
  }));
  r.post('/fichas-tecnicas',asyncRoute(async(req,res)=>{
    exigir(req.user,'produccion','escribir');
    const id=await db.transaction(async tx=>{
      const d=await datosFicha(tx,req.body||{});
      const q=await tx.query("INSERT INTO fichas_tecnicas(producto_id,nombre,tiempo_minutos,notas,codigo,version_ficha,estado,activa,creado_por) VALUES($1,$2,$3,$4,$5,$6,'Borrador',false,$7) RETURNING id",[d.productoId,d.nombre,d.tiempoMinutos,d.notas,d.codigo,d.versionFicha,req.user.id]);
      await guardarLineas(tx,q.rows[0].id,d); await audit(tx,req.user,'crear','fichas-tecnicas',q.rows[0].id); return q.rows[0].id;
    });
    res.status(201).json({data:(await fichas(db,'WHERE f.id=$1',[id]))[0]});
  }));
  r.put('/fichas-tecnicas/:id',asyncRoute(async(req,res)=>{
    exigir(req.user,'produccion','escribir');const id=entero(req.params.id,'id'),version=entero(req.body?._version,'_version');
    await db.transaction(async tx=>{
      const f=(await tx.query('SELECT estado,version FROM fichas_tecnicas WHERE id=$1 FOR UPDATE',[id])).rows[0]; if(!f) fail(404,'Ficha no encontrada.');
      if(f.estado!=='Borrador') fail(409,'Solo se editan fichas en borrador. Crea una nueva versión de la ficha vigente.');
      if(Number(f.version)!==version) fail(409,'La ficha cambió. Vuelve a cargar la página.');
      const d=await datosFicha(tx,req.body||{});
      await tx.query('UPDATE fichas_tecnicas SET producto_id=$1,nombre=$2,tiempo_minutos=$3,notas=$4,codigo=$5,version_ficha=$6,version=version+1,actualizado_en=now() WHERE id=$7',[d.productoId,d.nombre,d.tiempoMinutos,d.notas,d.codigo,d.versionFicha,id]);
      await guardarLineas(tx,id,d); await audit(tx,req.user,'editar','fichas-tecnicas',id);
    });
    res.json({data:(await fichas(db,'WHERE f.id=$1',[id]))[0]});
  }));
  r.patch('/fichas-tecnicas/:id/estado',asyncRoute(async(req,res)=>{
    exigir(req.user,'produccion','escribir');const id=entero(req.params.id,'id'),estado=uno(req.body?.estado,['Vigente','Obsoleta'],'estado');
    await db.transaction(async tx=>{
      const f=(await tx.query('SELECT * FROM fichas_tecnicas WHERE id=$1 FOR UPDATE',[id])).rows[0]; if(!f) fail(404,'Ficha no encontrada.');
      if(estado==='Vigente'){
        if(f.estado!=='Borrador') fail(409,'Solo una ficha en borrador puede pasar a vigente.');
        await explotar(tx,id,1); // valida componentes y ciclos antes de publicar
        await tx.query("UPDATE fichas_tecnicas SET estado='Obsoleta',activa=false,version=version+1 WHERE producto_id=$1 AND estado='Vigente'",[f.producto_id]);
      } else if(f.estado==='Obsoleta') fail(409,'La ficha ya es obsoleta.');
      await tx.query('UPDATE fichas_tecnicas SET estado=$1,activa=$2,version=version+1,actualizado_en=now() WHERE id=$3',[estado,estado==='Vigente',id]);
      await audit(tx,req.user,`ficha ${estado.toLowerCase()}`,'fichas-tecnicas',id);
    });
    res.json({data:(await fichas(db,'WHERE f.id=$1',[id]))[0]});
  }));
  r.post('/fichas-tecnicas/:id/nueva-version',asyncRoute(async(req,res)=>{
    exigir(req.user,'produccion','escribir');const id=entero(req.params.id,'id');
    const nueva=await db.transaction(async tx=>{
      const f=(await fichas(tx,'WHERE f.id=$1',[id]))[0]; if(!f) fail(404,'Ficha no encontrada.');
      const versionFicha=texto(req.body?.versionFicha||`${(Number.parseFloat(f.versionFicha)||1)+0.1}`.slice(0,4),'versión',{max:20});
      const d=await datosFicha(tx,{...f,versionFicha,codigo:''});
      const q=await tx.query("INSERT INTO fichas_tecnicas(producto_id,nombre,tiempo_minutos,notas,codigo,version_ficha,estado,activa,creado_por) VALUES($1,$2,$3,$4,$5,$6,'Borrador',false,$7) RETURNING id",[d.productoId,d.nombre,d.tiempoMinutos,d.notas,d.codigo,d.versionFicha,req.user.id]);
      await guardarLineas(tx,q.rows[0].id,d); await audit(tx,req.user,'nueva versión','fichas-tecnicas',q.rows[0].id); return q.rows[0].id;
    });
    res.status(201).json({data:(await fichas(db,'WHERE f.id=$1',[nueva]))[0]});
  }));
  // Interfaz de producto: datos, ficha vigente con partes y materiales, proveedores, existencias y lotes.
  r.get('/productos/:id/detalle',asyncRoute(async(req,res)=>{
    exigir(req.user,'productos','leer');const id=entero(req.params.id,'id');
    const p=(await db.query('SELECT * FROM productos WHERE id=$1',[id])).rows[0]; if(!p) fail(404,'Producto no encontrado.');
    const ficha=(await fichas(db,"WHERE f.producto_id=$1 AND f.estado='Vigente'",[id]))[0]||null;
    const versiones=(await db.query('SELECT id,codigo,version_ficha,estado,actualizado_en FROM fichas_tecnicas WHERE producto_id=$1 ORDER BY id DESC',[id])).rows.map(v=>({...v,id:Number(v.id)}));
    let proveedores=[];
    if(ficha) proveedores=(await db.query('SELECT mp.material_id,m.nombre AS material,pr.id,pr.nombre,pr.razon_social,mp.precio_ref,mp.plazo_entrega_dias,mp.preferido FROM material_proveedores mp JOIN proveedores pr ON pr.id=mp.proveedor_id JOIN materiales m ON m.id=mp.material_id WHERE mp.material_id=ANY($1) ORDER BY m.nombre,mp.preferido DESC',[ficha.materiales.map(m=>m.materialId)])).rows;
    const existencias=await db.query("SELECT to_regclass('existencias') IS NOT NULL AS ok").then(async q=>q.rows[0].ok?(await db.query('SELECT a.nombre AS almacen,l.codigo AS lote,e.cantidad FROM existencias e JOIN almacenes a ON a.id=e.almacen_id LEFT JOIN lotes l ON l.id=e.lote_id WHERE e.producto_id=$1 AND e.cantidad>0 ORDER BY a.nombre,l.codigo',[id])).rows.map(x=>({...x,cantidad:Number(x.cantidad)})):[]);
    res.json({data:{producto:{id:Number(p.id),codigo:p.codigo,nombre:p.nombre,categoria:p.categoria,precio:Number(p.precio),unidad:p.unidad,existencia:Number(p.existencia),minimo:Number(p.minimo),descripcion:p.descripcion,material:p.material,activo:p.activo},
      ficha,versiones,proveedores:proveedores.map(x=>({...x,id:Number(x.id),material_id:Number(x.material_id),precio_ref:Number(x.precio_ref)})),existencias}});
  }));
  r.get('/unidades',(req,res)=>res.json({data:UNIDADES}));
  // Varios proveedores por material (precio de referencia, plazo y preferido).
  r.get('/materiales/:id/proveedores',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','leer');
    const q=await db.query('SELECT mp.proveedor_id,p.nombre,p.razon_social,mp.precio_ref,mp.plazo_entrega_dias,mp.preferido FROM material_proveedores mp JOIN proveedores p ON p.id=mp.proveedor_id WHERE mp.material_id=$1 ORDER BY mp.preferido DESC,p.nombre',[entero(req.params.id,'id')]);
    res.json({data:q.rows.map(x=>({proveedorId:Number(x.proveedor_id),nombre:x.nombre,razonSocial:x.razon_social,precioRef:Number(x.precio_ref),plazoEntregaDias:Number(x.plazo_entrega_dias),preferido:x.preferido}))});
  }));
  r.put('/materiales/:id/proveedores',asyncRoute(async(req,res)=>{
    if(!['admin','compras','inventario'].includes(req.user.role)) fail(403,'Tu rol no tiene permiso para esta operación.');
    const id=entero(req.params.id,'id'), items=Array.isArray(req.body?.proveedores)?req.body.proveedores:fail(400,'Indica la lista de proveedores.');
    if(items.length>30) fail(400,'Demasiados proveedores.');
    const seen=new Set(); let pref=0;
    const rows=items.map(x=>{const p=entero(x.proveedorId,'proveedor'); if(seen.has(p)) fail(400,'No repitas proveedores.'); seen.add(p); if(x.preferido===true) pref++;
      return {p,precio:numero(x.precioRef??0,'precio'),plazo:entero(x.plazoEntregaDias??0,'plazo',{min:0}),preferido:x.preferido===true};});
    if(pref>1) fail(400,'Solo un proveedor puede ser el preferido.');
    await db.transaction(async tx=>{
      const m=(await tx.query('SELECT id FROM materiales WHERE id=$1 FOR UPDATE',[id])).rows[0]; if(!m) fail(404,'Material no encontrado.');
      await tx.query('DELETE FROM material_proveedores WHERE material_id=$1',[id]);
      for(const x of rows){
        if(!(await tx.query("SELECT 1 FROM proveedores WHERE id=$1",[x.p])).rows.length) fail(400,'Hay un proveedor inexistente.');
        await tx.query('INSERT INTO material_proveedores(material_id,proveedor_id,precio_ref,plazo_entrega_dias,preferido) VALUES($1,$2,$3,$4,$5)',[id,x.p,x.precio,x.plazo,x.preferido]);
      }
      const preferido=rows.find(x=>x.preferido)||rows[0];
      await tx.query('UPDATE materiales SET proveedor_id=$1,proveedor=COALESCE((SELECT nombre FROM proveedores WHERE id=$1),\'\'),version=version+1 WHERE id=$2',[preferido?.p??null,id]);
      await audit(tx,req.user,'asignar proveedores','materiales',id);
    });
    res.json({data:{materialId:id,proveedores:rows.length}});
  }));
  r.get('/proveedores/:id/materiales',asyncRoute(async(req,res)=>{
    exigir(req.user,'compras','leer');
    const q=await db.query('SELECT m.id,m.codigo,m.nombre,m.unidad,mp.precio_ref,mp.plazo_entrega_dias,mp.preferido FROM material_proveedores mp JOIN materiales m ON m.id=mp.material_id WHERE mp.proveedor_id=$1 ORDER BY m.nombre',[entero(req.params.id,'id')]);
    res.json({data:q.rows.map(x=>({id:Number(x.id),codigo:x.codigo,nombre:x.nombre,unidad:x.unidad,precioRef:Number(x.precio_ref),plazoEntregaDias:Number(x.plazo_entrega_dias),preferido:x.preferido}))});
  }));
  // Reclamos a proveedores.
  const reclamoRow=x=>({id:Number(x.id),proveedorId:Number(x.proveedor_id),proveedor:x.proveedor,ordenId:x.orden_id,tipo:x.tipo,descripcion:x.descripcion,estado:x.estado,respuesta:x.respuesta,fecha:x.fecha,cerradoEn:x.cerrado_en,usuario:x.usuario,_version:Number(x.version)});
  const RECLAMOS='SELECT r.*,p.nombre AS proveedor,u.nombre AS usuario FROM reclamos_proveedor r JOIN proveedores p ON p.id=r.proveedor_id JOIN usuarios u ON u.id=r.usuario_id';
  r.get('/reclamos',asyncRoute(async(req,res)=>{exigir(req.user,'compras','leer');
    const pid=req.query.proveedorId?entero(req.query.proveedorId,'proveedor'):null;
    res.json({data:(await db.query(RECLAMOS+(pid?' WHERE r.proveedor_id=$1':'')+' ORDER BY r.fecha DESC',pid?[pid]:[])).rows.map(reclamoRow)});}));
  r.post('/reclamos',asyncRoute(async(req,res)=>{
    exigir(req.user,'compras','escribir');const b=req.body||{};
    const d={proveedorId:entero(b.proveedorId,'proveedor'),ordenId:texto(b.ordenId,'orden',{max:80})||null,tipo:uno(b.tipo,['Calidad','Entrega tardía','Cantidad incorrecta','Precio','Otro'],'tipo'),descripcion:texto(b.descripcion,'descripción',{requerido:true,max:2000})};
    const id=await db.transaction(async tx=>{
      if(!(await tx.query('SELECT 1 FROM proveedores WHERE id=$1',[d.proveedorId])).rows.length) fail(400,'El proveedor no existe.');
      if(d.ordenId){const o=(await tx.query('SELECT proveedor_id FROM ordenes_compra WHERE id=$1',[d.ordenId])).rows[0]; if(!o||Number(o.proveedor_id)!==d.proveedorId) fail(400,'La orden no corresponde al proveedor.');}
      const q=await tx.query('INSERT INTO reclamos_proveedor(proveedor_id,orden_id,tipo,descripcion,usuario_id) VALUES($1,$2,$3,$4,$5) RETURNING id',[d.proveedorId,d.ordenId,d.tipo,d.descripcion,req.user.id]);
      await audit(tx,req.user,'crear','reclamos',q.rows[0].id); return q.rows[0].id;
    });
    res.status(201).json({data:reclamoRow((await db.query(RECLAMOS+' WHERE r.id=$1',[id])).rows[0])});
  }));
  r.patch('/reclamos/:id',asyncRoute(async(req,res)=>{
    exigir(req.user,'compras','escribir');const id=entero(req.params.id,'id');
    const estado=uno(req.body?.estado,['En seguimiento','Resuelto','Rechazado'],'estado'), respuesta=texto(req.body?.respuesta,'respuesta',{max:2000,requerido:estado!=='En seguimiento'});
    await db.transaction(async tx=>{
      const q=await tx.query("UPDATE reclamos_proveedor SET estado=$1,respuesta=$2,cerrado_en=CASE WHEN $1 IN ('Resuelto','Rechazado') THEN now() ELSE NULL END,version=version+1 WHERE id=$3 AND estado IN ('Abierto','En seguimiento') RETURNING id",[estado,respuesta,id]);
      if(!q.rows.length) fail(409,'El reclamo ya está cerrado o no existe.'); await audit(tx,req.user,'actualizar','reclamos',id);
    });
    res.json({data:reclamoRow((await db.query(RECLAMOS+' WHERE r.id=$1',[id])).rows[0])});
  }));
  return r;
}
