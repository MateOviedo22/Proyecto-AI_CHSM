import {Router} from 'express';
import {asyncRoute,fail,fecha} from '../http.js';
import {exigir,puede} from '../permisos.js';
// FRQ-0010/0011 y observaciones del docente: reportes con resultados estadísticos sobre datos persistidos.
// Todos son de solo lectura y aceptan ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD.
const N=v=>v===null||v===undefined?0:Number(v);
const r1=v=>Math.round(v*10)/10, r2=v=>Math.round(v*100)/100;
// Estadística descriptiva de una serie numérica.
export function estadistica(valores){
  const xs=valores.map(Number).filter(Number.isFinite).sort((a,b)=>a-b); const n=xs.length;
  if(!n) return {n:0,total:0,promedio:0,mediana:0,desviacion:0,minimo:0,maximo:0};
  const total=xs.reduce((s,x)=>s+x,0),prom=total/n,med=n%2?xs[(n-1)/2]:(xs[n/2-1]+xs[n/2])/2;
  const desv=n>1?Math.sqrt(xs.reduce((s,x)=>s+(x-prom)**2,0)/(n-1)):0;
  return {n,total:r2(total),promedio:r2(prom),mediana:r2(med),desviacion:r2(desv),minimo:r2(xs[0]),maximo:r2(xs[n-1])};
}
function rango(req){
  const desde=fecha(req.query.desde,'desde')||'1900-01-01', hasta=fecha(req.query.hasta,'hasta')||'2999-12-31';
  if(hasta<desde) fail(400,'El rango de fechas no es válido.'); return [desde,hasta];
}
export default function reportes(db){
  const r=Router();
  const q=async(sql,p)=>(await db.query(sql,p)).rows;

  // Producción: planificado vs. real, cumplimiento, rechazo y tiempos, por orden, producto, línea y plan.
  r.get('/reportes/produccion',asyncRoute(async(req,res)=>{
    exigir(req.user,'produccion','leer'); const [d,h]=rango(req);
    const ordenes=await q(`SELECT o.id,o.fecha,o.estado,li.nombre AS linea,o.plan_id,o.fuera_plan,SUM(od.cantidad_planificada) AS planificado,SUM(od.cantidad_producida) AS producido,SUM(od.aprobada) AS aprobado,SUM(od.rechazada) AS rechazado,
      EXTRACT(EPOCH FROM (o.fecha_cierre-o.fecha_inicio))/3600 AS horas FROM ordenes_produccion o JOIN orden_produccion_detalles od ON od.orden_id=o.id LEFT JOIN lineas_produccion li ON li.id=o.linea_id
      WHERE o.fecha BETWEEN $1 AND $2 AND o.estado<>'Cancelada' GROUP BY o.id,li.nombre ORDER BY o.fecha,o.id`,[d,h]);
    const productos=await q(`SELECT p.codigo,p.nombre,SUM(od.cantidad_planificada) AS planificado,SUM(od.cantidad_producida) AS producido,SUM(od.aprobada) AS aprobado,SUM(od.rechazada) AS rechazado
      FROM orden_produccion_detalles od JOIN ordenes_produccion o ON o.id=od.orden_id JOIN productos p ON p.id=od.producto_id WHERE o.fecha BETWEEN $1 AND $2 AND o.estado<>'Cancelada' GROUP BY p.codigo,p.nombre ORDER BY p.nombre`,[d,h]);
    const lineas=await q(`SELECT COALESCE(li.nombre,'Sin línea') AS linea,date_trunc('week',r.fecha)::date AS semana,SUM(r.cantidad) AS unidades FROM produccion_registros r JOIN orden_produccion_detalles od ON od.id=r.orden_detalle_id JOIN ordenes_produccion o ON o.id=od.orden_id LEFT JOIN lineas_produccion li ON li.id=o.linea_id
      WHERE r.fecha::date BETWEEN $1 AND $2 GROUP BY 1,2 ORDER BY 2,1`,[d,h]);
    const planes=await q(`SELECT pl.id,pl.inicio,pl.fin,pl.estado,SUM(pd.cantidad) AS planificado,
      COALESCE((SELECT SUM(od.aprobada) FROM orden_produccion_detalles od JOIN ordenes_produccion o ON o.id=od.orden_id WHERE o.plan_id=pl.id AND o.estado<>'Cancelada' AND od.plan_detalle_id IS NOT NULL),0) AS aprobado
      FROM planes_produccion pl JOIN plan_detalles pd ON pd.plan_id=pl.id WHERE pl.inicio<=$2 AND pl.fin>=$1 AND pl.estado IN ('Autorizado','Cerrado') GROUP BY pl.id ORDER BY pl.inicio`,[d,h]);
    const fmt=x=>({...x,planificado:N(x.planificado),producido:N(x.producido),aprobado:N(x.aprobado),rechazado:N(x.rechazado),cumplimientoPct:N(x.planificado)?r1(N(x.aprobado)*100/N(x.planificado)):0,rechazoPct:N(x.aprobado)+N(x.rechazado)?r1(N(x.rechazado)*100/(N(x.aprobado)+N(x.rechazado))):0});
    const os=ordenes.map(o=>({...fmt(o),horas:o.horas===null?null:r1(N(o.horas))}));
    const tot=os.reduce((s,o)=>({planificado:s.planificado+o.planificado,producido:s.producido+o.producido,aprobado:s.aprobado+o.aprobado,rechazado:s.rechazado+o.rechazado}),{planificado:0,producido:0,aprobado:0,rechazado:0});
    res.json({data:{resumen:{...fmt(tot),ordenes:os.length,cerradas:os.filter(o=>o.estado==='Cerrada').length,fueraDePlan:os.filter(o=>o.fuera_plan).length},
      estadisticas:{cumplimientoPorOrden:estadistica(os.map(o=>o.cumplimientoPct)),rechazoPorOrden:estadistica(os.map(o=>o.rechazoPct)),horasDeCiclo:estadistica(os.filter(o=>o.horas!==null).map(o=>o.horas))},
      ordenes:os,productos:productos.map(fmt),lineas:lineas.map(x=>({...x,unidades:N(x.unidades)})),planes:planes.map(p=>({...p,planificado:N(p.planificado),aprobado:N(p.aprobado),cumplimientoPct:N(p.planificado)?r1(N(p.aprobado)*100/N(p.planificado)):0}))}});
  }));
  // Consumo de materiales y desperdicios (órdenes cerradas) + defectos de calidad.
  r.get('/reportes/consumo-materiales',asyncRoute(async(req,res)=>{
    exigir(req.user,'produccion','leer'); const [d,h]=rango(req);
    const mats=await q(`SELECT m.codigo,m.nombre,m.unidad,SUM(x.teorico) AS teorico,SUM(x.entregado) AS entregado,SUM(x.devuelto) AS devuelto,SUM(x.consumo_real) AS real,SUM(x.desperdicio) AS desperdicio,SUM(x.desperdicio*x.costo_unitario) AS costo_desperdicio,SUM(x.consumo_real*x.costo_unitario) AS costo_real
      FROM produccion_resumen_materiales x JOIN ordenes_produccion o ON o.id=x.orden_id JOIN materiales m ON m.id=x.material_id WHERE o.fecha_cierre::date BETWEEN $1 AND $2 GROUP BY m.codigo,m.nombre,m.unidad ORDER BY m.nombre`,[d,h]);
    const porOrden=await q(`SELECT o.id,o.fecha_cierre,SUM(x.desperdicio*x.costo_unitario) AS costo_desperdicio,SUM(x.consumo_real*x.costo_unitario) AS costo_real,SUM(x.teorico*x.costo_unitario) AS costo_teorico
      FROM produccion_resumen_materiales x JOIN ordenes_produccion o ON o.id=x.orden_id WHERE o.fecha_cierre::date BETWEEN $1 AND $2 GROUP BY o.id ORDER BY o.fecha_cierre`,[d,h]);
    const defectos=await q(`SELECT COALESCE(NULLIF(c.defecto,''),'Sin especificar') AS defecto,SUM(c.rechazada) AS unidades FROM control_calidad c WHERE c.rechazada>0 AND c.fecha::date BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 2 DESC`,[d,h]);
    const m=mats.map(x=>({...x,teorico:N(x.teorico),entregado:N(x.entregado),devuelto:N(x.devuelto),real:N(x.real),desperdicio:N(x.desperdicio),costo_desperdicio:r2(N(x.costo_desperdicio)),costo_real:r2(N(x.costo_real)),desviacionPct:N(x.teorico)?r1((N(x.real)-N(x.teorico))*100/N(x.teorico)):0}));
    const po=porOrden.map(x=>({...x,costo_desperdicio:r2(N(x.costo_desperdicio)),costo_real:r2(N(x.costo_real)),costo_teorico:r2(N(x.costo_teorico)),desperdicioPct:N(x.costo_real)?r1(N(x.costo_desperdicio)*100/N(x.costo_real)):0}));
    res.json({data:{materiales:m,ordenes:po,defectos:defectos.map(x=>({...x,unidades:N(x.unidades)})),
      resumen:{costoReal:r2(m.reduce((s,x)=>s+x.costo_real,0)),costoDesperdicio:r2(m.reduce((s,x)=>s+x.costo_desperdicio,0)),unidadesRechazadas:defectos.reduce((s,x)=>s+N(x.unidades),0)},
      estadisticas:{desperdicioPctPorOrden:estadistica(po.map(x=>x.desperdicioPct)),desviacionPctPorMaterial:estadistica(m.map(x=>x.desviacionPct))}}});
  }));
  // Informe final de inventario: valor por almacén, existencias por artículo/almacén, rotación y cobertura.
  r.get('/reportes/inventario',asyncRoute(async(req,res)=>{
    exigir(req.user,'inventario','leer'); const [d,h]=rango(req);
    const almacenes=await q(`SELECT a.id,a.codigo,a.nombre,a.tipo,COALESCE(SUM(e.cantidad),0) AS unidades,COALESCE(SUM(e.cantidad*COALESCE(m.costo,p.precio)),0) AS valor,COUNT(DISTINCT e.lote_id) AS lotes
      FROM almacenes a LEFT JOIN existencias e ON e.almacen_id=a.id AND e.cantidad>0 LEFT JOIN materiales m ON m.id=e.material_id LEFT JOIN productos p ON p.id=e.producto_id GROUP BY a.id ORDER BY a.id`);
    const dias=Math.max(1,Math.round((Math.min(Date.parse(h),Date.now())-Math.max(Date.parse(d),Date.parse('2000-01-01')))/86400000)+1);
    const articulos=await q(`SELECT 'Material' AS tipo,m.id,m.codigo,m.nombre,m.unidad,m.existencia,m.minimo,m.costo AS valor_unitario,
        COALESCE((SELECT -SUM(cantidad) FROM movimientos_inventario x WHERE x.material_id=m.id AND x.cantidad<0 AND x.tipo NOT LIKE 'Traslado%' AND x.fecha::date BETWEEN $1 AND $2),0) AS salidas,
        COALESCE((SELECT SUM(cantidad) FROM movimientos_inventario x WHERE x.material_id=m.id AND x.cantidad>0 AND x.tipo NOT LIKE 'Traslado%' AND x.fecha::date BETWEEN $1 AND $2),0) AS entradas,
        (SELECT json_object_agg(a.nombre,s) FROM (SELECT e.almacen_id,SUM(e.cantidad) s FROM existencias e WHERE e.material_id=m.id AND e.cantidad>0 GROUP BY e.almacen_id) t JOIN almacenes a ON a.id=t.almacen_id) AS por_almacen FROM materiales m
      UNION ALL SELECT 'Producto',p.id,p.codigo,p.nombre,p.unidad,p.existencia,p.minimo,p.precio,
        COALESCE((SELECT -SUM(cantidad) FROM movimientos_inventario x WHERE x.producto_id=p.id AND x.cantidad<0 AND x.tipo NOT LIKE 'Traslado%' AND x.fecha::date BETWEEN $1 AND $2),0),
        COALESCE((SELECT SUM(cantidad) FROM movimientos_inventario x WHERE x.producto_id=p.id AND x.cantidad>0 AND x.tipo NOT LIKE 'Traslado%' AND x.fecha::date BETWEEN $1 AND $2),0),
        (SELECT json_object_agg(a.nombre,s) FROM (SELECT e.almacen_id,SUM(e.cantidad) s FROM existencias e WHERE e.producto_id=p.id AND e.cantidad>0 GROUP BY e.almacen_id) t JOIN almacenes a ON a.id=t.almacen_id) FROM productos p ORDER BY 1,4`,[d,h]);
    const movimientos=await q(`SELECT tipo,COUNT(*) AS n,SUM(ABS(cantidad)) AS unidades FROM movimientos_inventario WHERE fecha::date BETWEEN $1 AND $2 GROUP BY tipo ORDER BY 2 DESC`,[d,h]);
    const arts=articulos.map(x=>{const ex=N(x.existencia),sal=N(x.salidas),diario=sal/dias;
      return {...x,id:N(x.id),existencia:ex,minimo:N(x.minimo),valor_unitario:N(x.valor_unitario),valor:r2(ex*N(x.valor_unitario)),entradas:N(x.entradas),salidas:sal,
        porAlmacen:Object.fromEntries(Object.entries(x.por_almacen||{}).map(([k,v])=>[k,N(v)])),rotacion:ex?r2(sal/ex):null,coberturaDias:diario>0?Math.round(ex/diario):null,estado:ex===0?'Agotado':ex<=N(x.minimo)?'Bajo mínimo':'Normal'};});
    res.json({data:{almacenes:almacenes.map(a=>({...a,id:N(a.id),unidades:N(a.unidades),valor:r2(N(a.valor)),lotes:N(a.lotes)})),articulos:arts,movimientos:movimientos.map(m=>({...m,n:N(m.n),unidades:N(m.unidades)})),
      resumen:{valorTotal:r2(almacenes.reduce((s,a)=>s+N(a.valor),0)),articulos:arts.length,bajoMinimo:arts.filter(a=>a.estado!=='Normal').length,diasDelPeriodo:dias},
      estadisticas:{rotacion:estadistica(arts.filter(a=>a.rotacion!==null).map(a=>a.rotacion)),coberturaDias:estadistica(arts.filter(a=>a.coberturaDias!==null).map(a=>a.coberturaDias))}}});
  }));
  // Compras y desempeño de proveedores: montos, puntualidad, tiempo de entrega, devoluciones, reclamos y puntaje.
  r.get('/reportes/compras-proveedores',asyncRoute(async(req,res)=>{
    exigir(req.user,'compras','leer'); const [d,h]=rango(req);
    const prov=await q(`SELECT p.id,p.nombre,p.razon_social,p.condiciones_pago,
      (SELECT COUNT(*) FROM ordenes_compra o WHERE o.proveedor_id=p.id AND o.estado<>'Cancelada' AND o.fecha BETWEEN $1 AND $2) AS ordenes,
      (SELECT COALESCE(SUM(dd.cantidad*dd.precio),0) FROM ordenes_compra o JOIN orden_compra_detalles dd ON dd.orden_id=o.id WHERE o.proveedor_id=p.id AND o.estado<>'Cancelada' AND o.fecha BETWEEN $1 AND $2) AS monto,
      (SELECT COALESCE(SUM(dv.cantidad*dd.precio),0) FROM devoluciones_compra dv JOIN recepciones_compra rc ON rc.id=dv.recepcion_id JOIN orden_compra_detalles dd ON dd.id=rc.orden_detalle_id JOIN ordenes_compra o ON o.id=dd.orden_id WHERE o.proveedor_id=p.id AND dv.estado<>'Cancelada' AND dv.fecha::date BETWEEN $1 AND $2) AS devuelto,
      (SELECT COUNT(*) FROM reclamos_proveedor rp WHERE rp.proveedor_id=p.id AND rp.fecha::date BETWEEN $1 AND $2) AS reclamos,
      (SELECT COUNT(*) FROM reclamos_proveedor rp WHERE rp.proveedor_id=p.id AND rp.estado IN ('Abierto','En seguimiento')) AS reclamos_abiertos FROM proveedores p ORDER BY p.nombre`,[d,h]);
    const entregas=await q(`SELECT o.proveedor_id,r.fecha::date-o.fecha AS dias,CASE WHEN o.fecha_entrega IS NULL THEN NULL WHEN r.fecha::date<=o.fecha_entrega THEN 1 ELSE 0 END AS a_tiempo
      FROM recepciones_compra r JOIN orden_compra_detalles dd ON dd.id=r.orden_detalle_id JOIN ordenes_compra o ON o.id=dd.orden_id WHERE r.fecha::date BETWEEN $1 AND $2`,[d,h]);
    const mensual=await q(`SELECT to_char(o.fecha,'YYYY-MM') AS mes,SUM(dd.cantidad*dd.precio) AS monto FROM ordenes_compra o JOIN orden_compra_detalles dd ON dd.orden_id=o.id WHERE o.estado<>'Cancelada' AND o.fecha BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 1`,[d,h]);
    const proveedores=prov.map(p=>{const e=entregas.filter(x=>N(x.proveedor_id)===N(p.id)),c=e.filter(x=>x.a_tiempo!==null),at=c.filter(x=>N(x.a_tiempo)===1).length;
      const puntual=c.length?at*100/c.length:null, devPct=N(p.monto)?N(p.devuelto)*100/N(p.monto):0;
      // Puntaje 0-100: 60% puntualidad, 25% calidad (sin devoluciones), 15% sin reclamos.
      const puntaje=e.length?Math.round(0.6*(puntual??100)+0.25*Math.max(0,100-devPct*5)+0.15*Math.max(0,100-N(p.reclamos)*25)):null;
      return {id:N(p.id),nombre:p.nombre,razonSocial:p.razon_social,condicionesPago:p.condiciones_pago,ordenes:N(p.ordenes),monto:r2(N(p.monto)),recepciones:e.length,puntualidadPct:puntual===null?null:r1(puntual),
        tiempoEntrega:estadistica(e.map(x=>N(x.dias))),devuelto:r2(N(p.devuelto)),devolucionPct:r1(devPct),reclamos:N(p.reclamos),reclamosAbiertos:N(p.reclamos_abiertos),puntaje};});
    const conE=proveedores.filter(p=>p.recepciones>0);
    res.json({data:{proveedores,mensual:mensual.map(m=>({...m,monto:r2(N(m.monto))})),resumen:{montoTotal:r2(proveedores.reduce((s,p)=>s+p.monto,0)),ordenes:proveedores.reduce((s,p)=>s+p.ordenes,0),recepciones:entregas.length,reclamosAbiertos:proveedores.reduce((s,p)=>s+p.reclamosAbiertos,0)},
      estadisticas:{tiempoEntregaDias:estadistica(entregas.map(x=>N(x.dias))),puntualidadPct:estadistica(conE.filter(p=>p.puntualidadPct!==null).map(p=>p.puntualidadPct)),puntaje:estadistica(conE.map(p=>p.puntaje))}}});
  }));
  // Traslados: volumen por estado, motivo y ruta; diferencias y tiempo de tránsito.
  r.get('/reportes/traslados',asyncRoute(async(req,res)=>{
    exigir(req.user,'traslados','leer'); const [d,h]=rango(req);
    const t=await q(`SELECT t.id,t.estado,t.motivo,ao.nombre||' → '||ad.nombre AS ruta,EXTRACT(EPOCH FROM (t.recibido_en-t.despachado_en))/3600 AS horas,
      SUM(dt.cantidad) AS enviado,SUM(COALESCE(dt.cantidad_recibida,0)) AS recibido FROM traslados t JOIN almacenes ao ON ao.id=t.origen_id JOIN almacenes ad ON ad.id=t.destino_id JOIN traslado_detalles dt ON dt.traslado_id=t.id
      WHERE t.fecha BETWEEN $1 AND $2 GROUP BY t.id,ao.nombre,ad.nombre ORDER BY t.fecha`,[d,h]);
    const grupo=k=>Object.entries(t.reduce((m,x)=>{m[x[k]]=(m[x[k]]||0)+1;return m;},{})).map(([nombre,n])=>({nombre,n})).sort((a,b)=>b.n-a.n);
    const recibidos=t.filter(x=>x.estado.startsWith('Recibido')), env=recibidos.reduce((s,x)=>s+N(x.enviado),0), rec=recibidos.reduce((s,x)=>s+N(x.recibido),0);
    res.json({data:{porEstado:grupo('estado'),porMotivo:grupo('motivo'),porRuta:grupo('ruta'),resumen:{traslados:t.length,recibidos:recibidos.length,conDiferencias:t.filter(x=>x.estado==='Recibido con diferencias').length,unidadesEnviadas:r2(env),unidadesRecibidas:r2(rec),diferenciaPct:env?r1((env-rec)*100/env):0},
      estadisticas:{horasEnTransito:estadistica(recibidos.filter(x=>x.horas!==null).map(x=>N(x.horas)))}}});
  }));
  // Ventas: totales, ticket promedio, productos más vendidos, métodos, almacenes, mensual y devoluciones.
  r.get('/reportes/ventas',asyncRoute(async(req,res)=>{
    exigir(req.user,'ventas','leer'); const [d,h]=rango(req);
    const v=await q("SELECT v.id,v.total,v.metodo,a.nombre AS almacen,to_char(v.fecha,'YYYY-MM') AS mes FROM ventas v LEFT JOIN almacenes a ON a.id=v.almacen_id WHERE v.estado='Completada' AND v.fecha::date BETWEEN $1 AND $2",[d,h]);
    const top=await q(`SELECT p.codigo,p.nombre,SUM(d.cantidad) AS unidades,SUM(d.subtotal) AS monto FROM venta_detalles d JOIN ventas v ON v.id=d.venta_id JOIN productos p ON p.id=d.producto_id WHERE v.estado='Completada' AND v.fecha::date BETWEEN $1 AND $2 GROUP BY p.codigo,p.nombre ORDER BY 3 DESC LIMIT 10`,[d,h]);
    const dev=(await q("SELECT COALESCE(SUM(x.monto),0) AS monto,COALESCE(SUM(x.cantidad),0) AS unidades FROM devoluciones_venta x WHERE x.fecha::date BETWEEN $1 AND $2",[d,h]))[0];
    const sum=(arr,k)=>Object.entries(arr.reduce((m,x)=>{m[x[k]||'—']=(m[x[k]||'—']||0)+N(x.total);return m;},{})).map(([nombre,monto])=>({nombre,monto:r2(monto)}));
    const total=v.reduce((s,x)=>s+N(x.total),0);
    res.json({data:{resumen:{ventas:v.length,total:r2(total),devoluciones:r2(N(dev.monto)),devolucionPct:total?r1(N(dev.monto)*100/total):0,neto:r2(total-N(dev.monto))},estadisticas:{ticket:estadistica(v.map(x=>N(x.total)))},
      top:top.map(t=>({...t,unidades:N(t.unidades),monto:r2(N(t.monto))})),porMetodo:sum(v,'metodo'),porAlmacen:sum(v,'almacen'),mensual:sum(v,'mes').sort((a,b)=>a.nombre.localeCompare(b.nombre))}});
  }));
  // Dashboard ejecutivo (FRQ-0011): cada bloque se incluye solo si el rol puede consultar ese módulo.
  r.get('/reportes/dashboard',asyncRoute(async(req,res)=>{
    const u=req.user,out={};
    if(puede(u,'ventas','leer')){
      out.ventas=(await q(`SELECT COALESCE(SUM(total) FILTER (WHERE fecha::date=CURRENT_DATE),0) AS hoy,COUNT(*) FILTER (WHERE fecha::date=CURRENT_DATE) AS n_hoy,
        COALESCE(SUM(total) FILTER (WHERE date_trunc('month',fecha)=date_trunc('month',now())),0) AS mes,COUNT(*) FILTER (WHERE date_trunc('month',fecha)=date_trunc('month',now())) AS n_mes FROM ventas WHERE estado='Completada'`))[0];
      out.ventasSemanales=(await q(`SELECT date_trunc('week',fecha)::date AS semana,SUM(total) AS total,COUNT(*) AS n FROM ventas WHERE estado='Completada' AND fecha>=now()-interval '8 weeks' GROUP BY 1 ORDER BY 1`)).map(x=>({semana:x.semana,total:N(x.total),n:N(x.n)}));
      for(const k of Object.keys(out.ventas)) out.ventas[k]=N(out.ventas[k]);
      out.ordenesVentaPendientes=N((await q("SELECT COUNT(*) AS n FROM ordenes_venta WHERE estado NOT IN ('Completada','Cancelada')"))[0].n);
    }
    if(puede(u,'produccion','leer')){
      out.produccionSemanal=(await q(`SELECT COALESCE(li.nombre,'Sin línea') AS linea,SUM(r.cantidad) AS unidades FROM produccion_registros r JOIN orden_produccion_detalles od ON od.id=r.orden_detalle_id JOIN ordenes_produccion o ON o.id=od.orden_id LEFT JOIN lineas_produccion li ON li.id=o.linea_id
        WHERE r.fecha>=date_trunc('week',now()) GROUP BY 1 ORDER BY 1`)).map(x=>({linea:x.linea,unidades:N(x.unidades)}));
      out.ordenesActivas=(await q(`SELECT o.id,o.estado,o.progreso,o.producto,o.fecha_entrega FROM ordenes_produccion o WHERE o.estado IN ('Autorizada','En proceso','En calidad') ORDER BY o.fecha_entrega NULLS LAST,o.id LIMIT 10`)).map(x=>({...x,progreso:N(x.progreso)}));
      out.produccionPorAutorizar=N((await q("SELECT COUNT(*) AS n FROM ordenes_produccion WHERE estado IN ('Borrador','Revisada')"))[0].n);
    }
    if(puede(u,'inventario','leer')){
      out.alertasStock=(await q(`SELECT 'Material' AS tipo,codigo,nombre,existencia,minimo FROM materiales WHERE minimo>0 AND existencia<=minimo UNION ALL SELECT 'Producto',codigo,nombre,existencia,minimo FROM productos WHERE activo AND minimo>0 AND existencia<=minimo ORDER BY existencia`)).map(x=>({...x,existencia:N(x.existencia),minimo:N(x.minimo)}));
      out.valorInventario=r2(N((await q('SELECT COALESCE(SUM(e.cantidad*COALESCE(m.costo,p.precio)),0) AS v FROM existencias e LEFT JOIN materiales m ON m.id=e.material_id LEFT JOIN productos p ON p.id=e.producto_id'))[0].v));
    }
    if(puede(u,'traslados','leer')) out.trasladosPendientes=N((await q("SELECT COUNT(*) AS n FROM traslados WHERE estado IN ('Borrador','Revisado','Autorizado','En tránsito')"))[0].n);
    if(puede(u,'compras','leer')) out.comprasAbiertas=N((await q("SELECT COUNT(*) AS n FROM ordenes_compra WHERE estado IN ('Borrador','Enviada','Parcial')"))[0].n);
    if(u.role==='admin') out.finanzas=(await q(`SELECT COALESCE(SUM(monto) FILTER (WHERE tipo='Ingreso' AND estado='Confirmado' AND date_trunc('month',fecha)=date_trunc('month',now())),0) AS ingresos,
      COALESCE(SUM(monto) FILTER (WHERE tipo='Gasto' AND estado='Pagado' AND date_trunc('month',fecha)=date_trunc('month',now())),0) AS gastos FROM finanzas_movimientos`)).map(x=>({ingresos:N(x.ingresos),gastos:N(x.gastos)}))[0];
    res.json({data:out});
  }));
  return r;
}
