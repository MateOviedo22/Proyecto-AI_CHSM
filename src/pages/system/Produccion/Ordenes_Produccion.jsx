import {useMemo,useState} from 'react';
import {Plus,Trash2,Printer} from 'lucide-react';
import {api} from '../../../services/api';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Header,Section,Field,Table,Cell,Badge,Notice,Stat,input,button,buttonLight,num,fecha,fechaHora,useAction,imprimir} from '../../../components/erp/Erp';
const emptyLine={productoId:'',cantidad:''};
const empty={planId:'',lineaId:'',prioridad:'Media',fechaEntrega:'',responsable:'',justificacion:'',observaciones:'',almacenMaterialesId:'',almacenDestinoId:'',detalles:[{...emptyLine}]};
const ESTADOS=['Todas','Borrador','Revisada','Autorizada','En proceso','En calidad','Cerrada','Cancelada'];
// Orden de producción: código y fecha, varios productos, validación contra el plan, firmas y ciclo completo hasta el lote.
export default function Ordenes_Produccion(){
  const {user}=useAuth(); const editable=puede(user,'produccion','escribir');
  const [ordenes,reload]=useApiList('/produccion/ordenes');
  const [planes]=useApiList('/produccion/planes'); const [productos]=useApiList('/recursos/productos');
  const [lineas]=useApiList('/recursos/lineas-produccion'); const [almacenes]=useApiList('/almacenes'); const [etapas]=useApiList('/recursos/etapas');
  const [detalle,setDetalle]=useState(null);
  const refresh=async()=>{await reload(); if(detalle) setDetalle((await api(`/produccion/ordenes/${detalle.id}`)).data);};
  const {busy,notice,run}=useAction(refresh);
  const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[showForm,setShowForm]=useState(false),[filtro,setFiltro]=useState('Todas'),[search,setSearch]=useState('');
  const planesAut=planes.filter(p=>p.estado==='Autorizado'), plan=planesAut.find(p=>p.id===form.planId);
  // Indica en pantalla si la orden queda fuera del plan (requiere justificación).
  const fueraPlan=useMemo(()=>!form.planId||form.detalles.some(d=>{const pd=plan?.detalles.find(x=>x.productoId===Number(d.productoId));return !pd||Number(d.cantidad)>pd.pendiente+(editing?.detalles.find(x=>x.productoId===pd.productoId)?.planificada||0);}),[form,plan,editing]);
  const setLine=(i,k,v)=>setForm(f=>({...f,detalles:f.detalles.map((l,j)=>j===i?{...l,[k]:v}:l)}));
  const usarPlan=id=>{const p=planesAut.find(x=>x.id===id);setForm(f=>({...f,planId:id,lineaId:p?.detalles[0]?.lineaId?String(p.detalles[0].lineaId):f.lineaId,detalles:p?p.detalles.filter(d=>d.pendiente>0).map(d=>({productoId:String(d.productoId),cantidad:String(d.pendiente)})):f.detalles}));};
  const body=()=>({...form,planId:form.planId||null,lineaId:form.lineaId?Number(form.lineaId):null,fechaEntrega:form.fechaEntrega||null,almacenMaterialesId:form.almacenMaterialesId?Number(form.almacenMaterialesId):null,almacenDestinoId:form.almacenDestinoId?Number(form.almacenDestinoId):null,detalles:form.detalles.map(d=>({productoId:Number(d.productoId),cantidad:Number(d.cantidad)}))});
  const save=async e=>{e.preventDefault();const r=editing?await run(`/produccion/ordenes/${editing.id}`,{method:'PUT',body:{...body(),_version:editing._version}},'Orden actualizada.'):await run('/produccion/ordenes',{body:body()},'Orden registrada en borrador. Debe revisarla otra persona y autorizarla gerencia.');if(r){setForm(empty);setEditing(null);setShowForm(false);setDetalle(r);}};
  const lista=ordenes.filter(o=>(filtro==='Todas'||o.estado===filtro)&&`${o.id} ${o.producto} ${o.responsable}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6">
    <Header modulo="Producción" title="Órdenes de producción" subtitle="Elaborada → revisada → autorizada → materiales entregados → producción → control de calidad → cierre con lote.">{editable&&<button className={button} onClick={()=>{setShowForm(!showForm);setEditing(null);setForm(empty)}}><Plus size={16} className="inline"/> Nueva orden</button>}</Header>
    <div className="grid gap-4 sm:grid-cols-4"><Stat label="Por autorizar" value={ordenes.filter(o=>['Borrador','Revisada'].includes(o.estado)).length}/><Stat label="En proceso / calidad" value={ordenes.filter(o=>['Autorizada','En proceso','En calidad'].includes(o.estado)).length}/><Stat label="Cerradas" value={ordenes.filter(o=>o.estado==='Cerrada').length}/><Stat label="Unidades aprobadas" value={ordenes.reduce((s,o)=>s+o.totalAprobado,0)}/></div>
    <Notice notice={notice}/>
    {showForm&&editable&&<Section title={editing?`Editar ${editing.id}`:'Nueva orden de producción'}><form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Plan autorizado"><select className={input} value={form.planId} onChange={e=>usarPlan(e.target.value)}><option value="">Sin plan (requiere justificación)</option>{planesAut.map(p=><option key={p.id} value={p.id}>{p.id} · {fecha(p.inicio)} – {fecha(p.fin)}</option>)}</select></Field>
        <Field label="Línea de trabajo"><select className={input} value={form.lineaId} onChange={e=>setForm({...form,lineaId:e.target.value})}><option value="">Sin asignar</option>{lineas.filter(l=>l.activa).map(l=><option key={l.id} value={l.id}>{l.nombre}</option>)}</select></Field>
        <Field label="Prioridad"><select className={input} value={form.prioridad} onChange={e=>setForm({...form,prioridad:e.target.value})}><option>Alta</option><option>Media</option><option>Baja</option></select></Field>
        <Field label="Fecha de entrega"><input type="date" className={input} value={form.fechaEntrega} onChange={e=>setForm({...form,fechaEntrega:e.target.value})}/></Field>
        <Field label="Responsable de producción"><input className={input} value={form.responsable} onChange={e=>setForm({...form,responsable:e.target.value})}/></Field>
        <Field label="Almacén de materiales"><select className={input} value={form.almacenMaterialesId} onChange={e=>setForm({...form,almacenMaterialesId:e.target.value})}><option value="">Taller (predeterminado)</option>{almacenes.filter(a=>a.activo).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
        <Field label="Almacén destino del producto terminado"><select className={input} value={form.almacenDestinoId} onChange={e=>setForm({...form,almacenDestinoId:e.target.value})}><option value="">Taller (predeterminado)</option>{almacenes.filter(a=>a.activo).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
        <Field label="Observaciones" className="md:col-span-2"><input className={input} value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})}/></Field>
      </div>
      <p className="text-sm font-semibold text-gray-700">Productos de la orden</p>
      {form.detalles.map((l,i)=>{const pd=plan?.detalles.find(x=>x.productoId===Number(l.productoId));return <div key={i} className="grid grid-cols-[2fr_1fr_1.5fr_auto] items-center gap-2">
        <select required className={input} value={l.productoId} onChange={e=>setLine(i,'productoId',e.target.value)}><option value="">Producto...</option>{productos.filter(p=>p.activo).map(p=><option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}</select>
        <input required type="number" min="1" step="1" placeholder="Cantidad" className={input} value={l.cantidad} onChange={e=>setLine(i,'cantidad',e.target.value)}/>
        <span className="text-xs text-gray-500">{form.planId?(pd?`Pendiente en plan: ${pd.pendiente}`:'No está en el plan'):'—'}</span>
        <button type="button" disabled={form.detalles.length===1} className="p-2 text-red-700 disabled:opacity-30" onClick={()=>setForm(f=>({...f,detalles:f.detalles.filter((_,j)=>j!==i)}))}><Trash2 size={16}/></button></div>})}
      <button type="button" className={buttonLight} onClick={()=>setForm(f=>({...f,detalles:[...f.detalles,{...emptyLine}]}))}>+ Agregar producto</button>
      {fueraPlan&&<Field label="Justificación (la orden está fuera del plan o lo excede)"><textarea required minLength={10} rows="2" className={input} value={form.justificacion} onChange={e=>setForm({...form,justificacion:e.target.value})}/></Field>}
      <div className="flex gap-2"><button className={button} disabled={busy}>{editing?'Guardar cambios':'Registrar orden'}</button><button type="button" className={buttonLight} onClick={()=>{setShowForm(false);setEditing(null)}}>Cancelar</button></div>
    </form></Section>}
    {detalle&&<OrdenDetalle o={detalle} user={user} editable={editable} busy={busy} run={run} etapas={etapas} almacenes={almacenes} onClose={()=>setDetalle(null)} onEdit={()=>{setEditing(detalle);setShowForm(true);setForm({planId:detalle.planId||'',lineaId:detalle.lineaId?String(detalle.lineaId):'',prioridad:detalle.prioridad,fechaEntrega:detalle.fechaEntrega||'',responsable:detalle.responsable,justificacion:detalle.justificacion,observaciones:detalle.observaciones,almacenMaterialesId:detalle.almacenMaterialesId?String(detalle.almacenMaterialesId):'',almacenDestinoId:detalle.almacenDestinoId?String(detalle.almacenDestinoId):'',detalles:detalle.detalles.map(d=>({productoId:String(d.productoId),cantidad:String(d.planificada)}))});}}/>}
    <Section title="Órdenes registradas" actions={<div className="flex gap-2"><input className={`${input} w-56`} placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/><select className={`${input} w-40`} value={filtro} onChange={e=>setFiltro(e.target.value)}>{ESTADOS.map(x=><option key={x}>{x}</option>)}</select></div>}>
      <Table headers={['Código / fecha','Productos','Plan','Planificado','Producido','Aprobado','Estado','']} min={960} empty={lista.length?null:'No hay órdenes.'}>
        {lista.map(o=><tr key={o.id}><Cell><b>{o.id}</b><span className="block text-xs text-gray-500">{fecha(o.fecha)} · {o.prioridad}</span></Cell><Cell>{o.legado?o.producto:o.detalles.map(d=>`${d.producto} ×${d.planificada}`).join(', ')}</Cell><Cell>{o.planId||(o.legado?'Histórica':<span className="text-amber-700">Fuera de plan</span>)}</Cell><Cell>{o.totalPlanificado}</Cell><Cell>{o.totalProducido}</Cell><Cell>{o.totalAprobado}</Cell><Cell><Badge value={o.estado}/></Cell>
          <Cell><button className={buttonLight} onClick={async()=>setDetalle((await api(`/produccion/ordenes/${o.id}`)).data)}>Ver</button></Cell></tr>)}
      </Table></Section>
  </div>;
}
function OrdenDetalle({o,user,editable,busy,run,etapas,almacenes,onClose,onEdit}){
  const [reg,setReg]=useState({ordenDetalleId:'',cantidad:'',etapa:'',notas:''});
  const [qc,setQc]=useState({ordenDetalleId:'',aprobada:'',rechazada:'0',defecto:'',observaciones:''});
  const [adic,setAdic]=useState({justificacion:'',materialId:'',cantidad:''});
  const [dev,setDev]=useState({}),[destino,setDestino]=useState('');
  const accion=(a,msg)=>run(`/produccion/ordenes/${o.id}/${a}`,{method:'PATCH'},msg);
  const entregados=[...new Map(o.requisiciones.filter(q=>q.estado==='Entregada').flatMap(q=>q.materiales).map(m=>[m.materialId,m])).values()];
  const activa=['En proceso','En calidad'].includes(o.estado);
  return <Section title={`Orden ${o.id}`} actions={<div className="flex gap-2 print:hidden"><button className={buttonLight} onClick={imprimir}><Printer size={14} className="inline"/> Imprimir</button><button className={buttonLight} onClick={onClose}>Cerrar</button></div>}>
    <div className="space-y-5 text-sm">
      <p className="hidden text-xl font-bold print:block">Orden de producción {o.id}</p>
      <div className="grid gap-3 sm:grid-cols-4">
        <p><span className="block text-xs text-gray-500">Fecha</span>{fecha(o.fecha)}</p><p><span className="block text-xs text-gray-500">Estado</span><Badge value={o.estado}/></p>
        <p><span className="block text-xs text-gray-500">Plan</span>{o.planId||'Fuera de plan'}</p><p><span className="block text-xs text-gray-500">Línea</span>{o.linea||'—'}</p>
        <p><span className="block text-xs text-gray-500">Elaborado por</span>{o.elaboradoPor||'—'}</p><p><span className="block text-xs text-gray-500">Revisado por</span>{o.revisadoPor||'Pendiente'}{o.revisadoEn&&<span className="block text-xs text-gray-500">{fechaHora(o.revisadoEn)}</span>}</p>
        <p><span className="block text-xs text-gray-500">Autorizado por</span>{o.autorizadoPor||'Pendiente'}{o.autorizadoEn&&<span className="block text-xs text-gray-500">{fechaHora(o.autorizadoEn)}</span>}</p><p><span className="block text-xs text-gray-500">Responsable</span>{o.responsable||'—'}</p>
        <p><span className="block text-xs text-gray-500">Materiales desde</span>{o.almacenMateriales||'Taller'}</p><p><span className="block text-xs text-gray-500">Destino del terminado</span>{o.almacenDestino||'Taller'}</p>
        {o.justificacion&&<p className="sm:col-span-2"><span className="block text-xs text-gray-500">Justificación</span>{o.justificacion}</p>}
      </div>
      {o.legado&&<p className="rounded bg-amber-50 p-3 text-amber-900">Orden histórica registrada antes del flujo de autorización: {o.producto} ({o.cantidad} u.).</p>}
      <div><h3 className="mb-2 font-semibold">Planificado vs. real</h3><Table headers={['Producto','Ficha','Planificado','Producido','Aprobado','Rechazado','Pend. calidad','Lote']} min={760}>
        {o.detalles.map(d=><tr key={d.id}><Cell>{d.codigo} · {d.producto}</Cell><Cell>{d.ficha}</Cell><Cell>{d.planificada}</Cell><Cell>{d.producida}</Cell><Cell>{d.aprobada}</Cell><Cell>{d.rechazada}</Cell><Cell>{d.pendienteCalidad}</Cell><Cell>{d.lote||'—'}</Cell></tr>)}
        <tr className="font-semibold"><Cell>Total</Cell><Cell/><Cell>{o.totalPlanificado}</Cell><Cell>{o.totalProducido}</Cell><Cell>{o.totalAprobado}</Cell><Cell>{o.totalRechazado}</Cell><Cell/><Cell>{o.cumplimientoPct}%</Cell></tr></Table></div>
      {editable&&!o.legado&&<div className="flex flex-wrap gap-2 print:hidden">
        {o.estado==='Borrador'&&<><button className={buttonLight} onClick={onEdit}>Editar</button><button className={button} disabled={busy} onClick={()=>accion('revisar','Orden revisada.')}>Marcar revisada</button></>}
        {o.estado==='Revisada'&&<>{user?.role==='admin'&&<button className={button} disabled={busy} onClick={()=>accion('autorizar','Orden autorizada: se generó la requisición de materiales.')}>Autorizar producción (gerencia)</button>}<button className={buttonLight} disabled={busy} onClick={()=>accion('devolver','Orden devuelta a borrador.')}>Devolver a borrador</button></>}
        {['Borrador','Revisada','Autorizada'].includes(o.estado)&&<button className={buttonLight} disabled={busy} onClick={()=>accion('cancelar','Orden cancelada.')}>Cancelar orden</button>}
      </div>}
      <div><h3 className="mb-2 font-semibold">Requisiciones de materiales</h3>
        {o.requisiciones.map(q=><div key={q.id} className="mb-3 rounded-lg border p-3"><div className="mb-2 flex flex-wrap items-center gap-2"><b>{q.codigo}</b><span>{q.tipo}</span><Badge value={q.estado}/><span className="text-xs text-gray-500">Solicitó {q.solicitadoPor}{q.aprobadoPor&&` · aprobó ${q.aprobadoPor}`}{q.entregadoPor&&` · entregó ${q.entregadoPor} ${fechaHora(q.entregadoEn)}`}</span></div>
          {q.justificacion&&<p className="mb-2 text-xs text-gray-600">Justificación: {q.justificacion}</p>}
          <Table headers={['Material','Teórico (ficha)','Solicitado','Entregado','Devuelto']} min={520}>{q.materiales.map(m=><tr key={m.materialId}><Cell>{m.material}</Cell><Cell>{m.teorica?`${num(m.teorica,3)} ${m.unidad}`:'—'}</Cell><Cell>{num(m.cantidad,3)} {m.unidad}</Cell><Cell>{num(m.entregada,3)}</Cell><Cell>{num(m.devuelta,3)}</Cell></tr>)}</Table>
          <div className="mt-2 flex gap-2 print:hidden">{q.estado==='Aprobada'&&['admin','produccion','inventario'].includes(user?.role)&&<button className={button} disabled={busy} onClick={()=>run(`/produccion/requisiciones/${q.id}/entregar`,{method:'PATCH'},'Materiales entregados y descontados del inventario.')}>Entregar materiales</button>}
            {q.estado==='Pendiente'&&['admin','produccion'].includes(user?.role)&&q.solicitadoPorId!==user?.id&&<><button className={button} disabled={busy} onClick={()=>run(`/produccion/requisiciones/${q.id}/aprobar`,{method:'PATCH'},'Requisición adicional aprobada.')}>Aprobar</button><button className={buttonLight} disabled={busy} onClick={()=>run(`/produccion/requisiciones/${q.id}/rechazar`,{method:'PATCH'},'Requisición rechazada.')}>Rechazar</button></>}</div></div>)}
        {!o.requisiciones.length&&<p className="text-gray-500">La requisición base se genera al autorizar la orden.</p>}
        {editable&&['Autorizada','En proceso','En calidad'].includes(o.estado)&&<form className="mt-2 grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto] print:hidden" onSubmit={async e=>{e.preventDefault();if(await run('/produccion/requisiciones/adicional',{body:{ordenId:o.id,justificacion:adic.justificacion,materiales:[{materialId:Number(adic.materialId),cantidad:Number(adic.cantidad)}]}},'Material adicional solicitado; requiere aprobación.'))setAdic({justificacion:'',materialId:'',cantidad:''})}}>
          <input required minLength={10} className={input} placeholder="Justificación del material adicional" value={adic.justificacion} onChange={e=>setAdic({...adic,justificacion:e.target.value})}/>
          <MaterialSelect value={adic.materialId} onChange={v=>setAdic({...adic,materialId:v})}/>
          <input required type="number" min="0.001" step="0.001" className={input} placeholder="Cantidad" value={adic.cantidad} onChange={e=>setAdic({...adic,cantidad:e.target.value})}/>
          <button className={buttonLight} disabled={busy}>Solicitar adicional</button></form>}
      </div>
      {activa&&editable&&<div className="grid gap-4 lg:grid-cols-2 print:hidden">
        <form className="space-y-2 rounded-lg border p-3" onSubmit={async e=>{e.preventDefault();if(await run(`/produccion/ordenes/${o.id}/registros`,{body:{...reg,ordenDetalleId:Number(reg.ordenDetalleId),cantidad:Number(reg.cantidad)}},'Avance registrado.'))setReg({ordenDetalleId:'',cantidad:'',etapa:'',notas:''})}}>
          <h3 className="font-semibold">Registrar cantidades producidas</h3>
          <select required className={input} value={reg.ordenDetalleId} onChange={e=>setReg({...reg,ordenDetalleId:e.target.value})}><option value="">Producto...</option>{o.detalles.map(d=><option key={d.id} value={d.id}>{d.producto} (producido {d.producida}/{d.planificada})</option>)}</select>
          <div className="grid grid-cols-2 gap-2"><input required type="number" min="1" step="1" className={input} placeholder="Unidades" value={reg.cantidad} onChange={e=>setReg({...reg,cantidad:e.target.value})}/><select className={input} value={reg.etapa} onChange={e=>setReg({...reg,etapa:e.target.value})}><option value="">Etapa...</option>{etapas.filter(x=>x.active).map(x=><option key={x.id}>{x.name}</option>)}</select></div>
          <input className={input} placeholder="Notas" value={reg.notas} onChange={e=>setReg({...reg,notas:e.target.value})}/><button className={button} disabled={busy}>Registrar avance</button></form>
        <form className="space-y-2 rounded-lg border p-3" onSubmit={async e=>{e.preventDefault();if(await run(`/produccion/ordenes/${o.id}/calidad`,{body:{...qc,ordenDetalleId:Number(qc.ordenDetalleId),aprobada:Number(qc.aprobada||0),rechazada:Number(qc.rechazada||0)}},'Inspección de calidad registrada.'))setQc({ordenDetalleId:'',aprobada:'',rechazada:'0',defecto:'',observaciones:''})}}>
          <h3 className="font-semibold">Control de calidad</h3>
          <select required className={input} value={qc.ordenDetalleId} onChange={e=>setQc({...qc,ordenDetalleId:e.target.value})}><option value="">Producto...</option>{o.detalles.filter(d=>d.pendienteCalidad>0).map(d=><option key={d.id} value={d.id}>{d.producto} (por inspeccionar {d.pendienteCalidad})</option>)}</select>
          <div className="grid grid-cols-2 gap-2"><input required type="number" min="0" step="1" className={input} placeholder="Aprobadas" value={qc.aprobada} onChange={e=>setQc({...qc,aprobada:e.target.value})}/><input type="number" min="0" step="1" className={input} placeholder="Rechazadas" value={qc.rechazada} onChange={e=>setQc({...qc,rechazada:e.target.value})}/></div>
          <input className={input} required={Number(qc.rechazada)>0} placeholder="Defecto encontrado" value={qc.defecto} onChange={e=>setQc({...qc,defecto:e.target.value})}/>
          <input className={input} placeholder="Observaciones" value={qc.observaciones} onChange={e=>setQc({...qc,observaciones:e.target.value})}/><button className={button} disabled={busy}>Registrar inspección</button></form>
      </div>}
      {activa&&editable&&<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 print:hidden"><h3 className="mb-2 font-semibold">Cerrar orden</h3>
        <p className="mb-2 text-xs text-gray-600">Solo las unidades aprobadas ingresan al inventario, con un lote nuevo por producto. Registra los sobrantes de material que regresan a bodega; el resto se considera consumo real y el exceso sobre la ficha, desperdicio.</p>
        <div className="grid gap-2 md:grid-cols-3">{entregados.map(m=><label key={m.materialId} className="text-xs">{m.material} — sobrante a devolver ({m.unidad})<input type="number" min="0" step="0.001" className={input} value={dev[m.materialId]||''} onChange={e=>setDev({...dev,[m.materialId]:e.target.value})}/></label>)}
          <label className="text-xs">Almacén de ingreso del producto terminado<select className={input} value={destino} onChange={e=>setDestino(e.target.value)}><option value="">{o.almacenDestino||'Taller'} (de la orden)</option>{almacenes.filter(a=>a.activo).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label></div>
        <button className={`${button} mt-3`} disabled={busy} onClick={()=>run(`/produccion/ordenes/${o.id}/cerrar`,{body:{almacenDestinoId:destino?Number(destino):null,devoluciones:Object.entries(dev).filter(([,v])=>Number(v)>0).map(([k,v])=>({materialId:Number(k),cantidad:Number(v)}))}},'Orden cerrada: producto terminado ingresado al inventario con su lote.')}>Cerrar producción</button></div>}
      {o.resumenMateriales?.length>0&&<div><h3 className="mb-2 font-semibold">Consumo de materiales: teórico vs. real</h3><Table headers={['Material','Teórico (ficha × producido)','Entregado','Devuelto','Consumo real','Desperdicio']} min={700}>
        {o.resumenMateriales.map(m=><tr key={m.materialId}><Cell>{m.material}</Cell><Cell>{num(m.teorico,3)} {m.unidad}</Cell><Cell>{num(m.entregado,3)}</Cell><Cell>{num(m.devuelto,3)}</Cell><Cell>{num(m.consumoReal,3)}</Cell><Cell className={m.desperdicio>0?'text-red-700':''}>{num(m.desperdicio,3)}</Cell></tr>)}</Table></div>}
      {o.registros?.length>0&&<div><h3 className="mb-2 font-semibold">Avances registrados</h3><Table headers={['Fecha','Producto','Unidades','Etapa','Usuario','Notas']} min={600}>{o.registros.map(r=><tr key={r.id}><Cell>{fechaHora(r.fecha)}</Cell><Cell>{o.detalles.find(d=>d.id===r.ordenDetalleId)?.producto}</Cell><Cell>{r.cantidad}</Cell><Cell>{r.etapa||'—'}</Cell><Cell>{r.usuario}</Cell><Cell>{r.notas||'—'}</Cell></tr>)}</Table></div>}
      {o.calidad?.length>0&&<div><h3 className="mb-2 font-semibold">Inspecciones de calidad</h3><Table headers={['Fecha','Producto','Revisadas','Aprobadas','Rechazadas','Defecto / observaciones','Inspector']} min={700}>{o.calidad.map(c=><tr key={c.id}><Cell>{fechaHora(c.fecha)}</Cell><Cell>{c.producto}</Cell><Cell>{c.revisada}</Cell><Cell>{c.aprobada}</Cell><Cell>{c.rechazada}</Cell><Cell>{[c.defecto,c.observaciones].filter(Boolean).join(' · ')||'—'}</Cell><Cell>{c.inspector}</Cell></tr>)}</Table></div>}
    </div>
  </Section>;
}
function MaterialSelect({value,onChange}){const [m]=useApiList('/recursos/materiales');return <select required className={input} value={value} onChange={e=>onChange(e.target.value)}><option value="">Material...</option>{m.map(x=><option key={x.id} value={x.id}>{x.name} ({x.unit})</option>)}</select>;}
