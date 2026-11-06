import {useState} from 'react';
import {CalendarDays,ClipboardList,Plus,Trash2} from 'lucide-react';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Header,Section,Field,Table,Cell,Badge,Notice,Stat,input,button,buttonLight,fecha,fechaHora,useAction,imprimir} from '../../../components/erp/Erp';
const emptyLine={productoId:'',cantidad:'',lineaId:''};
const empty={inicio:'',fin:'',notas:'',detalles:[{...emptyLine}]};
// Plan de producción con detalle de todo lo que se producirá; firmas elaborado/revisado/autorizado y avance real vs. planificado.
export default function Planificacion(){
  const {user}=useAuth(); const editable=puede(user,'produccion','escribir');
  const [planes,reload]=useApiList('/produccion/planes');
  const [productos]=useApiList('/recursos/productos'); const [lineas]=useApiList('/recursos/lineas-produccion');
  const {busy,notice,run}=useAction(reload);
  const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[ver,setVer]=useState(null),[filtro,setFiltro]=useState('Todos');
  const setLine=(i,k,v)=>setForm(f=>({...f,detalles:f.detalles.map((l,j)=>j===i?{...l,[k]:v}:l)}));
  const body=()=>({...form,detalles:form.detalles.map(d=>({productoId:Number(d.productoId),cantidad:Number(d.cantidad),lineaId:d.lineaId?Number(d.lineaId):null}))});
  const save=async e=>{e.preventDefault();const ok=editing?await run(`/produccion/planes/${editing.id}`,{method:'PUT',body:{...body(),_version:editing._version}},'Plan actualizado.'):await run('/produccion/planes',{body:body()},'Plan registrado en borrador.');if(ok){setForm(empty);setEditing(null);}};
  const accion=(p,a,msg)=>run(`/produccion/planes/${p.id}/${a}`,{method:'PATCH'},msg).then(r=>r&&ver?.id===p.id&&setVer(r));
  const lista=planes.filter(p=>filtro==='Todos'||p.estado===filtro), actual=ver&&planes.find(p=>p.id===ver.id)||ver;
  return <div className="space-y-6">
    <Header modulo="Producción" title="Planificación de producción" subtitle="El plan detalla qué se producirá, en qué línea y cuánto; las órdenes se validan contra el plan autorizado."/>
    <div className="grid gap-4 sm:grid-cols-4"><Stat label="Planes" value={planes.length}/><Stat label="Autorizados" value={planes.filter(p=>p.estado==='Autorizado').length}/><Stat label="Unidades planificadas (autorizados)" value={planes.filter(p=>p.estado==='Autorizado').reduce((s,p)=>s+p.totalPlanificado,0)}/><Stat label="Cumplimiento promedio" value={`${planes.length?Math.round(planes.reduce((s,p)=>s+p.cumplimientoPct,0)/planes.length):0}%`} hint="Aprobado en calidad / planificado"/></div>
    <Notice notice={notice}/>
    {editable&&<Section title={editing?`Editar ${editing.id}`:'Nuevo plan'}><form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3"><Field label="Inicio del periodo"><input required type="date" className={input} value={form.inicio} onChange={e=>setForm({...form,inicio:e.target.value})}/></Field><Field label="Fin del periodo"><input required type="date" min={form.inicio} className={input} value={form.fin} onChange={e=>setForm({...form,fin:e.target.value})}/></Field><Field label="Notas"><input className={input} value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})}/></Field></div>
      <p className="text-sm font-semibold text-gray-700">Detalle del plan</p>
      {form.detalles.map((l,i)=><div key={i} className="grid grid-cols-[2fr_1fr_1.5fr_auto] gap-2">
        <select required className={input} value={l.productoId} onChange={e=>setLine(i,'productoId',e.target.value)}><option value="">Producto...</option>{productos.filter(p=>p.activo).map(p=><option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}</select>
        <input required type="number" min="1" step="1" placeholder="Cantidad" className={input} value={l.cantidad} onChange={e=>setLine(i,'cantidad',e.target.value)}/>
        <select className={input} value={l.lineaId} onChange={e=>setLine(i,'lineaId',e.target.value)}><option value="">Línea de trabajo...</option>{lineas.filter(x=>x.activa).map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
        <button type="button" disabled={form.detalles.length===1} className="p-2 text-red-700 disabled:opacity-30" onClick={()=>setForm(f=>({...f,detalles:f.detalles.filter((_,j)=>j!==i)}))}><Trash2 size={16}/></button></div>)}
      <div className="flex gap-3"><button type="button" className={buttonLight} onClick={()=>setForm(f=>({...f,detalles:[...f.detalles,{...emptyLine}]}))}><Plus size={14} className="inline"/> Agregar producto</button>
        <button className={button} disabled={busy}>{editing?'Guardar cambios':'Registrar plan'}</button>{editing&&<button type="button" className={buttonLight} onClick={()=>{setEditing(null);setForm(empty)}}>Cancelar</button>}</div>
      <p className="text-xs text-gray-500">Cada producto debe tener una ficha técnica vigente. El plan queda en borrador hasta que otra persona lo revise y gerencia lo autorice.</p>
    </form></Section>}
    {actual&&<Section title={`Plan ${actual.id}`} actions={<div className="flex gap-2 print:hidden"><button className={buttonLight} onClick={imprimir}>Imprimir</button><button className={buttonLight} onClick={()=>setVer(null)}>Cerrar</button></div>}>
      <div className="mb-4 grid gap-3 text-sm sm:grid-cols-4">
        <p><span className="block text-xs text-gray-500">Periodo</span>{fecha(actual.inicio)} – {fecha(actual.fin)}</p><p><span className="block text-xs text-gray-500">Estado</span><Badge value={actual.estado}/></p>
        <p><span className="block text-xs text-gray-500">Elaborado por</span>{actual.elaboradoPor}</p><p><span className="block text-xs text-gray-500">Revisado por</span>{actual.revisadoPor||'Pendiente'} {actual.revisadoEn&&<span className="text-xs text-gray-500">{fechaHora(actual.revisadoEn)}</span>}</p>
        <p><span className="block text-xs text-gray-500">Autorizado por</span>{actual.autorizadoPor||'Pendiente'} {actual.autorizadoEn&&<span className="text-xs text-gray-500">{fechaHora(actual.autorizadoEn)}</span>}</p><p className="sm:col-span-3"><span className="block text-xs text-gray-500">Notas</span>{actual.notas||'—'}</p></div>
      <Table headers={['Producto','Línea','Planificado','En órdenes','Producido','Aprobado','Pendiente de ordenar','Cumplimiento']}>
        {actual.detalles.map(d=><tr key={d.id}><Cell>{d.codigo} · {d.producto}</Cell><Cell>{d.linea||'—'}</Cell><Cell>{d.cantidad}</Cell><Cell>{d.ordenado}</Cell><Cell>{d.producido}</Cell><Cell>{d.aprobado}</Cell><Cell>{d.pendiente}</Cell><Cell><div className="h-2 w-24 rounded bg-gray-100"><div className="h-2 rounded bg-emerald-600" style={{width:`${Math.min(100,d.cumplimientoPct)}%`}}/></div><span className="text-xs">{d.cumplimientoPct}%</span></Cell></tr>)}
        <tr className="font-semibold"><Cell>Total</Cell><Cell/><Cell>{actual.totalPlanificado}</Cell><Cell/><Cell>{actual.totalProducido}</Cell><Cell>{actual.totalAprobado}</Cell><Cell/><Cell>{actual.cumplimientoPct}%</Cell></tr>
      </Table>
      {editable&&<div className="mt-4 flex flex-wrap gap-2 print:hidden">
        {actual.estado==='Borrador'&&<><button className={buttonLight} onClick={()=>{setEditing(actual);setForm({inicio:actual.inicio,fin:actual.fin,notas:actual.notas,detalles:actual.detalles.map(d=>({productoId:String(d.productoId),cantidad:String(d.cantidad),lineaId:d.lineaId?String(d.lineaId):''}))});setVer(null)}}>Editar</button>
          <button className={button} disabled={busy} onClick={()=>accion(actual,'revisar','Plan revisado.')}>Marcar revisado</button><button className={buttonLight} disabled={busy} onClick={()=>accion(actual,'cancelar','Plan cancelado.')}>Cancelar</button></>}
        {actual.estado==='Revisado'&&<>{user?.role==='admin'&&<button className={button} disabled={busy} onClick={()=>accion(actual,'autorizar','Plan autorizado.')}>Autorizar (gerencia)</button>}<button className={buttonLight} disabled={busy} onClick={()=>accion(actual,'devolver','Plan devuelto a borrador.')}>Devolver a borrador</button><button className={buttonLight} disabled={busy} onClick={()=>accion(actual,'cancelar','Plan cancelado.')}>Cancelar</button></>}
        {actual.estado==='Autorizado'&&<button className={buttonLight} disabled={busy} onClick={()=>accion(actual,'cerrar','Plan cerrado.')}>Cerrar plan</button>}
      </div>}
    </Section>}
    <Section title="Planes registrados" actions={<select className={`${input} w-44`} value={filtro} onChange={e=>setFiltro(e.target.value)}>{['Todos','Borrador','Revisado','Autorizado','Cerrado','Cancelado'].map(x=><option key={x}>{x}</option>)}</select>}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{lista.map(p=><button key={p.id} onClick={()=>setVer(p)} className="rounded-xl border border-gray-200 p-4 text-left hover:shadow-md">
        <div className="flex items-center justify-between"><span className="flex items-center gap-2 font-semibold"><ClipboardList size={16}/>{p.id}</span><Badge value={p.estado}/></div>
        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500"><CalendarDays size={14}/>{fecha(p.inicio)} – {fecha(p.fin)}</p>
        <p className="mt-1 text-sm">{p.detalles.map(d=>`${d.producto} (${d.cantidad})`).join(', ')}</p>
        <p className="mt-2 text-xs text-gray-500">Planificado {p.totalPlanificado} · aprobado {p.totalAprobado} · {p.cumplimientoPct}%</p></button>)}</div>
      {!lista.length&&<p className="p-6 text-center text-sm text-gray-500">No hay planes registrados.</p>}
    </Section>
  </div>;
}
