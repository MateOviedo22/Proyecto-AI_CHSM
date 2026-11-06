import {useCallback,useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {api,reportApiError} from '../../../services/api';
import {useApiCollection} from '../../../hooks/useApiCollection';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Badge} from '../../../components/erp/Erp';
const input='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm';
const button='rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const money=n=>new Intl.NumberFormat('es-NI',{style:'currency',currency:'NIO'}).format(n||0);
function Section({title,children}){return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-semibold text-gray-800">{title}</h2>{children}</section>}
function Field({label,children}){return <label className="block space-y-1 text-sm font-medium text-gray-700"><span>{label}</span>{children}</label>}
function Table({headers,children}){return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{headers.map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{children}</tbody></table></div>}
const Cell=({children})=><td className="p-3 align-top">{children}</td>;
const empty={solicitudes:[],ordenes:[],recepciones:[]};
const emptyLine={materialId:'',cantidad:'',precio:''};
const emptyOrder={solicitudId:'',proveedorId:'',fechaEntrega:'',observaciones:'',lineas:[{...emptyLine}]};
const emptyReceipt={detalleId:'',cantidad:'',documento:'',observaciones:'',almacenId:'',lote:'',vencimiento:''};
export default function ComprasIntegradas({mode='panel'}){
  const {user}=useAuth(); const editable=puede(user,'compras','escribir'), recibe=editable||user?.role==='inventario';
  const [data,setData]=useState(empty),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const [materiales]=useApiCollection('materiales');
  const [proveedores]=useApiCollection('proveedores');
  const [almacenes]=useApiList('/almacenes');
  const [sol,setSol]=useState({materialId:'',cantidad:'',solicitante:'',area:'Producción',prioridad:'Media',justificacion:''});
  const [order,setOrder]=useState(emptyOrder);
  const [receipt,setReceipt]=useState(emptyReceipt);
  const reload=useCallback(async()=>{const r=await api('/compras');setData(r.data);},[]);
  useEffect(()=>{reload().catch(reportApiError)},[reload]);
  const run=async(path,method,body,success)=>{
    if(busy)return false;setBusy(true);setNotice('');
    try{const r=await api(path,{method,body});await reload();setNotice(success+(r?.data?.lote?` Lote asignado: ${r.data.lote}.`:''));return true;}
    catch(error){setNotice(error.message);reportApiError(error);return false;}finally{setBusy(false)}
  };
  const materialCost=id=>materiales.find(m=>m.id===Number(id))?.cost??'';
  const selectRequest=id=>{
    const request=data.solicitudes.find(s=>s.id===id);
    setOrder(o=>({...o,solicitudId:id,lineas:request?[{materialId:String(request.material_id),cantidad:String(request.cantidad),precio:String(materialCost(request.material_id))},...o.lineas.slice(1)]:o.lineas}));
  };
  const setLine=(i,k,v)=>setOrder(o=>({...o,lineas:o.lineas.map((l,j)=>j===i?{...l,[k]:v,...(k==='materialId'&&!l.precio?{precio:String(materialCost(v))}:{})}:l)}));
  const crearSolicitud=async e=>{e.preventDefault();if(await run('/compras/solicitudes','POST',sol,'Solicitud registrada.'))setSol({materialId:'',cantidad:'',solicitante:'',area:'Producción',prioridad:'Media',justificacion:''});};
  const crearOrden=async e=>{e.preventDefault();if(await run('/compras/ordenes','POST',{...order,solicitudId:order.solicitudId||null,fechaEntrega:order.fechaEntrega||null,lineas:order.lineas.map(l=>({materialId:Number(l.materialId),cantidad:Number(l.cantidad),precio:l.precio===''?'':Number(l.precio)}))},'Orden creada en borrador.'))setOrder(emptyOrder);};
  const pending=data.ordenes.filter(o=>['Enviada','Parcial'].includes(o.estado)&&o.recibido<o.cantidad);
  const lineaSel=pending.find(o=>o.detalle_id===Number(receipt.detalleId));
  const recibir=async e=>{e.preventDefault();if(await run('/compras/recepciones','POST',{ordenId:lineaSel?.id,ordenDetalleId:Number(receipt.detalleId),cantidad:Number(receipt.cantidad),documento:receipt.documento,observaciones:receipt.observaciones,almacenId:receipt.almacenId?Number(receipt.almacenId):null,lote:receipt.lote,vencimiento:receipt.vencimiento||null},'Recepción registrada y existencias actualizadas.'))setReceipt(emptyReceipt);};
  // Agrupa las líneas por orden para mostrar una fila por orden con su detalle.
  const ordenes=useMemo(()=>{const m=new Map();for(const l of data.ordenes){if(!m.has(l.id))m.set(l.id,{...l,lineasDet:[],total:0});const o=m.get(l.id);o.lineasDet.push(l);o.total+=l.total;}return [...m.values()];},[data.ordenes]);
  const totalOrden=order.lineas.reduce((s,l)=>s+(Number(l.cantidad)||0)*(Number(l.precio)||0),0);
  const titles={panel:'Panel de compras',solicitudes:'Solicitudes de compra',ordenes:'Órdenes de compra',recepcion:'Recepción de compras'};
  return <div className="space-y-6">
    <header><p className="text-sm font-medium text-emerald-700">Sunshine / Compras</p><h1 className="text-2xl font-bold text-gray-900">{titles[mode]}</h1><p className="mt-1 text-sm text-gray-500">Gestiona solicitudes, proveedores, órdenes y recepción de materiales por lote.</p></header>
    {notice && <div role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{notice}</div>}
    {mode==='panel' && <><div className="grid gap-4 sm:grid-cols-4">{[['Solicitudes pendientes',data.solicitudes.filter(x=>x.estado==='Pendiente').length],['Órdenes abiertas',ordenes.filter(x=>['Borrador','Enviada','Parcial'].includes(x.estado)).length],['Recepciones',data.recepciones.length],['Comprado (órdenes vigentes)',money(ordenes.filter(o=>o.estado!=='Cancelada').reduce((s,o)=>s+o.total,0))]].map(([a,b])=><div key={a} className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{a}</p><p className="mt-2 text-2xl font-bold">{b}</p></div>)}</div><Section title="Operaciones"><div className="flex flex-wrap gap-3">{[['solicitudes','Solicitudes'],['ordenes','Órdenes'],['recepcion','Recepciones'],['devoluciones','Devoluciones'],['proveedores','Proveedores'],['reportes','Reportes']].map(([path,label])=><Link key={path} to={`/sistema/compras/${path}`} className="rounded-lg border border-emerald-300 px-4 py-2 text-sm text-emerald-800">{label}</Link>)}</div></Section>
      <Section title="Órdenes en curso"><Table headers={['Código','Proveedor','Líneas','Entrega','Total','Estado']}>{ordenes.filter(o=>['Borrador','Enviada','Parcial'].includes(o.estado)).map(o=><tr key={o.id}><Cell>{o.id}</Cell><Cell>{o.proveedor}</Cell><Cell>{o.lineasDet.map(l=>`${l.producto}: ${l.recibido}/${l.cantidad}`).join(' · ')}</Cell><Cell>{o.fecha_entrega||'—'}</Cell><Cell>{money(o.total)}</Cell><Cell><Badge value={o.estado}/></Cell></tr>)}</Table></Section></>}
    {mode==='solicitudes' && <>{editable&&<Section title="Nueva solicitud"><form onSubmit={crearSolicitud} className="grid gap-4 md:grid-cols-3">
      <Field label="Material"><select required className={input} value={sol.materialId} onChange={e=>setSol({...sol,materialId:e.target.value})}><option value="">Selecciona un material</option>{materiales.map(m=><option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></Field>
      <Field label="Cantidad"><input required type="number" min="0.001" step="0.001" className={input} value={sol.cantidad} onChange={e=>setSol({...sol,cantidad:e.target.value})}/></Field>
      <Field label="Solicitante"><input required className={input} value={sol.solicitante} onChange={e=>setSol({...sol,solicitante:e.target.value})}/></Field>
      <Field label="Área"><input className={input} value={sol.area} onChange={e=>setSol({...sol,area:e.target.value})}/></Field>
      <Field label="Prioridad"><select className={input} value={sol.prioridad} onChange={e=>setSol({...sol,prioridad:e.target.value})}><option>Alta</option><option>Media</option><option>Baja</option></select></Field>
      <Field label="Justificación"><input className={input} value={sol.justificacion} onChange={e=>setSol({...sol,justificacion:e.target.value})}/></Field>
      <div><button disabled={busy} className={button}>Registrar solicitud</button></div></form></Section>}
      <Section title="Solicitudes registradas"><Table headers={['Código','Material','Cantidad','Solicitante','Estado','Acciones']}>{data.solicitudes.map(s=><tr key={s.id}><Cell>{s.id}</Cell><Cell>{s.producto}</Cell><Cell>{s.cantidad} {s.unidad}</Cell><Cell>{s.solicitante}</Cell><Cell><Badge value={s.estado}/></Cell><Cell>{editable&&s.estado==='Pendiente' && <div className="flex gap-2"><button disabled={busy} className="text-emerald-700 underline" onClick={()=>run(`/compras/solicitudes/${s.id}/estado`,'PATCH',{estado:'Aprobada'},'Solicitud aprobada.')}>Aprobar</button><button disabled={busy} className="text-red-700 underline" onClick={()=>run(`/compras/solicitudes/${s.id}/estado`,'PATCH',{estado:'Rechazada'},'Solicitud rechazada.')}>Rechazar</button></div>}</Cell></tr>)}</Table></Section></>}
    {mode==='ordenes' && <>{editable&&<Section title="Nueva orden de compra"><form onSubmit={crearOrden} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Solicitud aprobada (opcional)"><select className={input} value={order.solicitudId} onChange={e=>selectRequest(e.target.value)}><option value="">Sin solicitud</option>{data.solicitudes.filter(s=>s.estado==='Aprobada').map(s=><option key={s.id} value={s.id}>{s.id} · {s.producto}</option>)}</select></Field>
        <Field label="Proveedor"><select required className={input} value={order.proveedorId} onChange={e=>setOrder({...order,proveedorId:e.target.value})}><option value="">Selecciona proveedor</option>{proveedores.filter(p=>p.status==='Activo').map(p=><option key={p.id} value={p.id}>{p.name}{p.paymentTerms?` · ${p.paymentTerms}`:''}</option>)}</select></Field>
        <Field label="Fecha comprometida de entrega"><input type="date" className={input} value={order.fechaEntrega} onChange={e=>setOrder({...order,fechaEntrega:e.target.value})}/></Field>
        <Field label="Observaciones"><input className={input} value={order.observaciones} onChange={e=>setOrder({...order,observaciones:e.target.value})}/></Field>
      </div>
      <div className="space-y-2"><p className="text-sm font-semibold text-gray-700">Materiales de la orden</p>
        {order.lineas.map((l,i)=><div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2">
          <select required className={input} value={l.materialId} onChange={e=>setLine(i,'materialId',e.target.value)}><option value="">Material...</option>{materiales.map(m=><option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select>
          <input required type="number" step="0.001" min="0.001" placeholder="Cantidad" className={input} value={l.cantidad} onChange={e=>setLine(i,'cantidad',e.target.value)}/>
          <input required type="number" min="0" step="0.01" placeholder="Precio unitario C$" className={input} value={l.precio} onChange={e=>setLine(i,'precio',e.target.value)}/>
          <button type="button" disabled={order.lineas.length===1} className="px-2 text-red-700 disabled:opacity-30" onClick={()=>setOrder(o=>({...o,lineas:o.lineas.filter((_,j)=>j!==i)}))}>Quitar</button></div>)}
        <button type="button" className="text-sm font-semibold text-emerald-700" onClick={()=>setOrder(o=>({...o,lineas:[...o.lineas,{...emptyLine}]}))}>+ Agregar material</button>
      </div>
      <div className="flex items-center gap-4"><button disabled={busy} className={button}>Crear orden</button><span className="text-sm text-gray-600">Total estimado: <b>{money(totalOrden)}</b></span></div></form></Section>}
      <Section title="Órdenes registradas"><Table headers={['Código','Proveedor','Detalle (recibido / pedido)','Entrega','Total','Estado','Acciones']}>{ordenes.map(o=><tr key={o.id}><Cell>{o.id}<span className="block text-xs text-gray-500">{o.fecha}</span></Cell><Cell>{o.proveedor}</Cell><Cell>{o.lineasDet.map(l=><span key={l.detalle_id} className="block">{l.producto}: {l.recibido}/{l.cantidad} {l.unidad} × {money(l.precio)}</span>)}</Cell><Cell>{o.fecha_entrega||'—'}</Cell><Cell>{money(o.total)}</Cell><Cell><Badge value={o.estado}/></Cell><Cell>{editable&&<div className="flex gap-2">{o.estado==='Borrador' && <button disabled={busy} className="text-emerald-700 underline" onClick={()=>run(`/compras/ordenes/${o.id}/estado`,'PATCH',{estado:'Enviada'},'Orden enviada.')}>Enviar</button>}{['Borrador','Enviada'].includes(o.estado) && <button disabled={busy} className="text-red-700 underline" onClick={()=>run(`/compras/ordenes/${o.id}/estado`,'PATCH',{estado:'Cancelada'},'Orden cancelada.')}>Cancelar</button>}</div>}</Cell></tr>)}</Table></Section></>}
    {mode==='recepcion' && <>{recibe&&<Section title="Registrar recepción"><form onSubmit={recibir} className="grid gap-4 md:grid-cols-3">
      <Field label="Línea pendiente de recibir"><select required className={input} value={receipt.detalleId} onChange={e=>setReceipt({...receipt,detalleId:e.target.value,cantidad:String(pending.find(o=>o.detalle_id===Number(e.target.value))?.pendiente??'')})}><option value="">Selecciona orden y material</option>{pending.map(o=><option key={o.detalle_id} value={o.detalle_id}>{o.id} · {o.producto} · pendiente: {o.pendiente} {o.unidad}</option>)}</select></Field>
      <Field label="Cantidad recibida"><input required type="number" step="0.001" min="0.001" max={lineaSel?.pendiente} className={input} value={receipt.cantidad} onChange={e=>setReceipt({...receipt,cantidad:e.target.value})}/></Field>
      <Field label="Almacén de destino"><select className={input} value={receipt.almacenId} onChange={e=>setReceipt({...receipt,almacenId:e.target.value})}><option value="">Taller de producción (predeterminado)</option>{almacenes.filter(a=>a.activo).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
      <Field label="Código de lote (opcional, se genera si se deja vacío)"><input className={input} value={receipt.lote} onChange={e=>setReceipt({...receipt,lote:e.target.value})}/></Field>
      <Field label="Vencimiento del lote (opcional)"><input type="date" className={input} value={receipt.vencimiento} onChange={e=>setReceipt({...receipt,vencimiento:e.target.value})}/></Field>
      <Field label="Documento de referencia"><input className={input} value={receipt.documento} onChange={e=>setReceipt({...receipt,documento:e.target.value})}/></Field>
      <Field label="Observaciones"><input className={input} value={receipt.observaciones} onChange={e=>setReceipt({...receipt,observaciones:e.target.value})}/></Field>
      <div className="flex items-end"><button disabled={busy} className={button}>Registrar recepción</button></div></form></Section>}
      <Section title="Recepciones registradas"><Table headers={['Fecha','Orden','Proveedor','Material','Cantidad','Lote','Almacén','Documento','Devuelto']}>{data.recepciones.map(r=><tr key={r.id}><Cell>{String(r.fecha).slice(0,10)}</Cell><Cell>{r.orden_id}</Cell><Cell>{r.proveedor}</Cell><Cell>{r.producto}</Cell><Cell>{r.cantidad} {r.unidad}</Cell><Cell>{r.lote ? <Link className="text-emerald-700 underline" to={`/sistema/inventario/trazabilidad?lote=${encodeURIComponent(r.lote)}`}>{r.lote}</Link> : '—'}</Cell><Cell>{r.almacen||'—'}</Cell><Cell>{r.documento || '—'}</Cell><Cell>{r.devuelto||0}</Cell></tr>)}</Table></Section></>}
  </div>;
}
