import {useCallback,useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api,reportApiError} from '../../../services/api';
import {useApiCollection} from '../../../hooks/useApiCollection';
const input='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm';
const button='rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const money=n=>new Intl.NumberFormat('es-NI',{style:'currency',currency:'NIO'}).format(n||0);
function Section({title,children}){return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-semibold text-gray-800">{title}</h2>{children}</section>}
function Field({label,children}){return <label className="block space-y-1 text-sm font-medium text-gray-700"><span>{label}</span>{children}</label>}
function Table({headers,children}){return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{headers.map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{children}</tbody></table></div>}
const Cell=({children})=><td className="p-3">{children}</td>;
const empty={solicitudes:[],ordenes:[],recepciones:[]};
export default function ComprasIntegradas({mode='panel'}){
  const [data,setData]=useState(empty),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const [materiales]=useApiCollection('materiales');
  const [proveedores]=useApiCollection('proveedores');
  const [sol,setSol]=useState({materialId:'',cantidad:'',solicitante:'',area:'Producción',prioridad:'Media',justificacion:''});
  const [order,setOrder]=useState({solicitudId:'',materialId:'',proveedorId:'',cantidad:'',precio:'',fechaEntrega:''});
  const [receipt,setReceipt]=useState({ordenId:'',cantidad:'',documento:'',observaciones:''});
  const reload=useCallback(async()=>{const r=await api('/compras');setData(r.data);},[]);
  useEffect(()=>{reload().catch(reportApiError)},[reload]);
  const run=async(path,method,body,success)=>{
    if(busy)return false;setBusy(true);setNotice('');
    try{await api(path,{method,body});await reload();setNotice(success);return true;}
    catch(error){setNotice(error.message);reportApiError(error);return false;}finally{setBusy(false)}
  };
  const selectRequest=id=>{
    const request=data.solicitudes.find(s=>s.id===id);
    setOrder(o=>({...o,solicitudId:id,materialId:request ? String(request.material_id) : '',cantidad:request ? String(request.cantidad) : ''}));
  };
  const crearSolicitud=async e=>{e.preventDefault();if(await run('/compras/solicitudes','POST',sol,'Solicitud registrada.'))setSol({materialId:'',cantidad:'',solicitante:'',area:'Producción',prioridad:'Media',justificacion:''});};
  const crearOrden=async e=>{e.preventDefault();if(await run('/compras/ordenes','POST',{...order,solicitudId:order.solicitudId||null,fechaEntrega:order.fechaEntrega||null},'Orden creada en borrador.'))setOrder({solicitudId:'',materialId:'',proveedorId:'',cantidad:'',precio:'',fechaEntrega:''});};
  const recibir=async e=>{e.preventDefault();if(await run('/compras/recepciones','POST',receipt,'Recepción registrada y existencias actualizadas.'))setReceipt({ordenId:'',cantidad:'',documento:'',observaciones:''});};
  const pending=data.ordenes.filter(o=>['Enviada','Parcial'].includes(o.estado)&&o.recibido<o.cantidad);
  const titles={panel:'Panel de compras',solicitudes:'Solicitudes de compra',ordenes:'Órdenes de compra',recepcion:'Recepción de compras'};
  return <div className="space-y-6">
    <header><p className="text-sm font-medium text-emerald-700">Sunshine / Compras</p><h1 className="text-2xl font-bold text-gray-900">{titles[mode]}</h1><p className="mt-1 text-sm text-gray-500">Gestiona solicitudes, proveedores, órdenes y recepción de materiales.</p></header>
    {notice && <div role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{notice}</div>}
    {mode==='panel' && <><div className="grid gap-4 sm:grid-cols-3">{[['Solicitudes pendientes',data.solicitudes.filter(x=>x.estado==='Pendiente').length],['Órdenes abiertas',data.ordenes.filter(x=>['Borrador','Enviada','Parcial'].includes(x.estado)).length],['Recepciones',data.recepciones.length]].map(([a,b])=><div key={a} className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{a}</p><p className="mt-2 text-2xl font-bold">{b}</p></div>)}</div><Section title="Operaciones"><div className="flex flex-wrap gap-3">{[['solicitudes','Solicitudes'],['ordenes','Órdenes'],['recepcion','Recepciones'],['proveedores','Proveedores']].map(([path,label])=><Link key={path} to={`/sistema/compras/${path}`} className="rounded-lg border border-emerald-300 px-4 py-2 text-sm text-emerald-800">{label}</Link>)}</div></Section></>}
    {mode==='solicitudes' && <><Section title="Nueva solicitud"><form onSubmit={crearSolicitud} className="grid gap-4 md:grid-cols-3">
      <Field label="Material"><select required className={input} value={sol.materialId} onChange={e=>setSol({...sol,materialId:e.target.value})}><option value="">Selecciona un material</option>{materiales.map(m=><option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></Field>
      <Field label="Cantidad"><input required type="number" min="0.001" step="0.001" className={input} value={sol.cantidad} onChange={e=>setSol({...sol,cantidad:e.target.value})}/></Field>
      <Field label="Solicitante"><input required className={input} value={sol.solicitante} onChange={e=>setSol({...sol,solicitante:e.target.value})}/></Field>
      <Field label="Área"><input className={input} value={sol.area} onChange={e=>setSol({...sol,area:e.target.value})}/></Field>
      <Field label="Prioridad"><select className={input} value={sol.prioridad} onChange={e=>setSol({...sol,prioridad:e.target.value})}><option>Alta</option><option>Media</option><option>Baja</option></select></Field>
      <Field label="Justificación"><input className={input} value={sol.justificacion} onChange={e=>setSol({...sol,justificacion:e.target.value})}/></Field>
      <div><button disabled={busy} className={button}>Registrar solicitud</button></div></form></Section>
      <Section title="Solicitudes registradas"><Table headers={['Código','Material','Cantidad','Solicitante','Estado','Acciones']}>{data.solicitudes.map(s=><tr key={s.id}><Cell>{s.id}</Cell><Cell>{s.producto}</Cell><Cell>{s.cantidad} {s.unidad}</Cell><Cell>{s.solicitante}</Cell><Cell>{s.estado}</Cell><Cell>{s.estado==='Pendiente' && <div className="flex gap-2"><button disabled={busy} className="text-emerald-700 underline" onClick={()=>run(`/compras/solicitudes/${s.id}/estado`,'PATCH',{estado:'Aprobada'},'Solicitud aprobada.')}>Aprobar</button><button disabled={busy} className="text-red-700 underline" onClick={()=>run(`/compras/solicitudes/${s.id}/estado`,'PATCH',{estado:'Rechazada'},'Solicitud rechazada.')}>Rechazar</button></div>}</Cell></tr>)}</Table></Section></>}
    {mode==='ordenes' && <><Section title="Nueva orden"><form onSubmit={crearOrden} className="grid gap-4 md:grid-cols-3">
      <Field label="Solicitud aprobada (opcional)"><select className={input} value={order.solicitudId} onChange={e=>selectRequest(e.target.value)}><option value="">Sin solicitud</option>{data.solicitudes.filter(s=>s.estado==='Aprobada').map(s=><option key={s.id} value={s.id}>{s.id} · {s.producto}</option>)}</select></Field>
      <Field label="Proveedor"><select required className={input} value={order.proveedorId} onChange={e=>setOrder({...order,proveedorId:e.target.value})}><option value="">Selecciona proveedor</option>{proveedores.filter(p=>p.status==='Activo').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <Field label="Material"><select required disabled={Boolean(order.solicitudId)} className={input} value={order.materialId} onChange={e=>setOrder({...order,materialId:e.target.value})}><option value="">Selecciona material</option>{materiales.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
      <Field label="Cantidad"><input required type="number" step="0.001" min="0.001" className={input} value={order.cantidad} onChange={e=>setOrder({...order,cantidad:e.target.value})}/></Field>
      <Field label="Precio unitario (C$)"><input required type="number" min="0" step="0.01" className={input} value={order.precio} onChange={e=>setOrder({...order,precio:e.target.value})}/></Field>
      <Field label="Fecha estimada"><input type="date" className={input} value={order.fechaEntrega} onChange={e=>setOrder({...order,fechaEntrega:e.target.value})}/></Field>
      <div><button disabled={busy} className={button}>Crear orden</button></div></form></Section>
      <Section title="Órdenes registradas"><Table headers={['Código','Proveedor / material','Cantidad','Total','Estado','Acciones']}>{data.ordenes.map(o=><tr key={o.id}><Cell>{o.id}</Cell><Cell>{o.proveedor}<br/>{o.producto}</Cell><Cell>{o.cantidad}</Cell><Cell>{money(o.total)}</Cell><Cell>{o.estado}</Cell><Cell><div className="flex gap-2">{o.estado==='Borrador' && <button disabled={busy} className="text-emerald-700 underline" onClick={()=>run(`/compras/ordenes/${o.id}/estado`,'PATCH',{estado:'Enviada'},'Orden enviada.')}>Enviar</button>}{['Borrador','Enviada'].includes(o.estado) && <button disabled={busy} className="text-red-700 underline" onClick={()=>run(`/compras/ordenes/${o.id}/estado`,'PATCH',{estado:'Cancelada'},'Orden cancelada.')}>Cancelar</button>}</div></Cell></tr>)}</Table></Section></>}
    {mode==='recepcion' && <><Section title="Registrar recepción"><form onSubmit={recibir} className="grid gap-4 md:grid-cols-2">
      <Field label="Orden enviada o parcialmente recibida"><select required className={input} value={receipt.ordenId} onChange={e=>setReceipt({...receipt,ordenId:e.target.value})}><option value="">Selecciona una orden</option>{pending.map(o=><option key={o.id} value={o.id}>{o.id} · {o.producto} · pendiente: {o.cantidad-o.recibido}</option>)}</select></Field>
      <Field label="Cantidad recibida"><input required type="number" step="0.001" min="0.001" className={input} value={receipt.cantidad} onChange={e=>setReceipt({...receipt,cantidad:e.target.value})}/></Field>
      <Field label="Documento de referencia"><input className={input} value={receipt.documento} onChange={e=>setReceipt({...receipt,documento:e.target.value})}/></Field>
      <Field label="Observaciones"><input className={input} value={receipt.observaciones} onChange={e=>setReceipt({...receipt,observaciones:e.target.value})}/></Field>
      <div><button disabled={busy} className={button}>Registrar recepción</button></div></form></Section>
      <Section title="Recepciones registradas"><Table headers={['Fecha','Orden','Proveedor','Material','Cantidad','Documento']}>{data.recepciones.map(r=><tr key={r.id}><Cell>{String(r.fecha).slice(0,10)}</Cell><Cell>{r.orden_id}</Cell><Cell>{r.proveedor}</Cell><Cell>{r.producto}</Cell><Cell>{r.cantidad}</Cell><Cell>{r.documento || '—'}</Cell></tr>)}</Table></Section></>}
  </div>;
}
