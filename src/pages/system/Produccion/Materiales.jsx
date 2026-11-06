import {useState} from 'react';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {Header,Section,Table,Cell,Badge,Notice,Stat,input,button,buttonLight,num,fechaHora,useAction} from '../../../components/erp/Erp';
// Requisiciones de materiales vinculadas a órdenes de producción: aprobación de adicionales y entrega desde bodega.
export default function Materiales(){
  const {user}=useAuth();
  const [reqs,reload]=useApiList('/produccion/requisiciones');
  const [almacenes]=useApiList('/almacenes');
  const {busy,notice,run}=useAction(reload);
  const [filtro,setFiltro]=useState('Por atender'),[alm,setAlm]=useState({});
  const lista=reqs.filter(q=>filtro==='Todas'||(filtro==='Por atender'?['Pendiente','Aprobada'].includes(q.estado):q.estado===filtro));
  const entrega=['admin','produccion','inventario'].includes(user?.role), aprueba=['admin','produccion'].includes(user?.role);
  return <div className="space-y-6">
    <Header modulo="Producción" title="Requisiciones de materiales" subtitle="La requisición base se calcula con la ficha técnica al autorizar la orden; los materiales adicionales requieren justificación y aprobación."/>
    <div className="grid gap-4 sm:grid-cols-4"><Stat label="Por aprobar" value={reqs.filter(q=>q.estado==='Pendiente').length}/><Stat label="Por entregar" value={reqs.filter(q=>q.estado==='Aprobada').length}/><Stat label="Entregadas" value={reqs.filter(q=>q.estado==='Entregada').length}/><Stat label="Adicionales" value={reqs.filter(q=>q.tipo==='Adicional').length}/></div>
    <Notice notice={notice}/>
    <Section title="Requisiciones" actions={<select className={`${input} w-44`} value={filtro} onChange={e=>setFiltro(e.target.value)}>{['Por atender','Todas','Pendiente','Aprobada','Entregada','Rechazada'].map(x=><option key={x}>{x}</option>)}</select>}>
      <div className="space-y-4">{lista.map(q=><div key={q.id} className="rounded-xl border p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2"><b>{q.codigo}</b><span className="text-sm">Orden {q.ordenId} · {q.producto}</span><span className="text-sm">{q.tipo}</span><Badge value={q.estado}/><span className="text-xs text-gray-500">Solicitó {q.solicitadoPor} {fechaHora(q.solicitadoEn)}{q.aprobadoPor&&` · aprobó ${q.aprobadoPor}`}{q.entregadoPor&&` · entregó ${q.entregadoPor}`}</span></div>
        {q.justificacion&&<p className="mb-2 text-sm text-gray-600">Justificación: {q.justificacion}</p>}
        <Table headers={['Material','Teórico','Solicitado','Existencia total','Entregado','Devuelto']} min={620}>{q.materiales.map(m=><tr key={m.materialId}><Cell>{m.material}</Cell><Cell>{m.teorica?num(m.teorica,3):'—'}</Cell><Cell>{num(m.cantidad,3)} {m.unidad}</Cell><Cell className={m.disponibleTotal<m.cantidad&&q.estado!=='Entregada'?'text-red-700':''}>{num(m.disponibleTotal,3)}</Cell><Cell>{num(m.entregada,3)}</Cell><Cell>{num(m.devuelta,3)}</Cell></tr>)}</Table>
        <div className="mt-3 flex flex-wrap gap-2">
          {q.estado==='Pendiente'&&aprueba&&q.solicitadoPorId!==user?.id&&<><button className={button} disabled={busy} onClick={()=>run(`/produccion/requisiciones/${q.id}/aprobar`,{method:'PATCH'},'Requisición aprobada.')}>Aprobar</button><button className={buttonLight} disabled={busy} onClick={()=>run(`/produccion/requisiciones/${q.id}/rechazar`,{method:'PATCH'},'Requisición rechazada.')}>Rechazar</button></>}
          {q.estado==='Pendiente'&&q.solicitadoPorId===user?.id&&<span className="text-xs text-gray-500">Debe aprobarla otra persona.</span>}
          {q.estado==='Aprobada'&&entrega&&<><select className={`${input} w-56`} value={alm[q.id]||''} onChange={e=>setAlm({...alm,[q.id]:e.target.value})}><option value="">{q.almacen||'Taller'} (de la orden)</option>{almacenes.filter(a=>a.activo).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select>
            <button className={button} disabled={busy} onClick={()=>run(`/produccion/requisiciones/${q.id}/entregar`,{method:'PATCH',body:{almacenId:alm[q.id]?Number(alm[q.id]):null}},'Materiales entregados; existencias descontadas por lote.')}>Entregar materiales</button></>}
        </div></div>)}
        {!lista.length&&<p className="p-6 text-center text-sm text-gray-500">No hay requisiciones en esta vista.</p>}</div>
    </Section>
  </div>;
}
