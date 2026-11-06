import {useCallback,useEffect,useState} from 'react';
import {api,reportApiError} from '../../../services/api';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Table,Cell,Badge,Notice,input,button,buttonLight,money,fecha,useAction} from '../../../components/erp/Erp';
// Detalle ampliado del proveedor: datos legales, materiales que suministra, historial de entregas (SLA) y reclamos.
export default function ProveedorDetalle({proveedor}){
  const {user}=useAuth(); const editable=puede(user,'compras','escribir');
  const [materiales,setMateriales]=useState([]),[reclamos,setReclamos]=useState([]),[historial,setHistorial]=useState(null);
  const [form,setForm]=useState({tipo:'Calidad',descripcion:'',ordenId:''}),[respuesta,setRespuesta]=useState({});
  const load=useCallback(async()=>{
    const [m,r,h]=await Promise.all([api(`/proveedores/${proveedor.id}/materiales`),api(`/reclamos?proveedorId=${proveedor.id}`),api(`/proveedores/${proveedor.id}/historial`).catch(()=>null)]);
    setMateriales(m.data);setReclamos(r.data);setHistorial(h?.data||null);
  },[proveedor.id]);
  useEffect(()=>{load().catch(reportApiError)},[load]);
  const {busy,notice,run}=useAction(load);
  return <div className="mb-5 space-y-5 text-sm">
    <div className="grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
      <p><span className="block text-xs text-gray-500">Nombre comercial</span>{proveedor.name}</p>
      <p><span className="block text-xs text-gray-500">Razón social</span>{proveedor.razonSocial||'—'}</p>
      <p><span className="block text-xs text-gray-500">RUC</span>{proveedor.ruc||'—'}</p>
      <p><span className="block text-xs text-gray-500">Condiciones de pago</span>{proveedor.paymentTerms} ({proveedor.paymentDays} días)</p>
      <p><span className="block text-xs text-gray-500">Sitio web</span>{proveedor.website||'—'}</p>
      <p><span className="block text-xs text-gray-500">Notas</span>{proveedor.notes||'—'}</p>
    </div>
    <div><h3 className="mb-2 font-semibold text-gray-800">Materiales que suministra</h3>
      <Table headers={['Material','Unidad','Precio ref.','Plazo entrega','Preferido']} min={520} empty={materiales.length?null:'Sin materiales asociados. Asígnalos desde Inventario › Materiales.'}>
        {materiales.map(m=><tr key={m.id}><Cell>{m.codigo} · {m.nombre}</Cell><Cell>{m.unidad}</Cell><Cell>{money(m.precioRef)}</Cell><Cell>{m.plazoEntregaDias} días</Cell><Cell>{m.preferido?'Sí':'—'}</Cell></tr>)}
      </Table></div>
    {historial&&<div><h3 className="mb-2 font-semibold text-gray-800">Historial de entregas</h3>
      <div className="mb-3 grid gap-3 sm:grid-cols-4">
        <p className="rounded-lg border p-3"><span className="block text-xs text-gray-500">Recepciones</span><b>{historial.resumen.recepciones}</b></p>
        <p className="rounded-lg border p-3"><span className="block text-xs text-gray-500">Entregas a tiempo</span><b>{historial.resumen.cumplimientoPct===null?'—':`${historial.resumen.cumplimientoPct}%`}</b></p>
        <p className="rounded-lg border p-3"><span className="block text-xs text-gray-500">Compras totales</span><b>{money(historial.resumen.montoComprado)}</b></p>
        <p className="rounded-lg border p-3"><span className="block text-xs text-gray-500">Devoluciones / reclamos</span><b>{historial.resumen.devoluciones} / {historial.resumen.reclamos}</b></p>
      </div>
      <Table headers={['Fecha','Orden','Material','Cantidad','Compromiso','Resultado']} min={620} empty={historial.entregas.length?null:'Sin entregas registradas.'}>
        {historial.entregas.map(e=><tr key={e.id}><Cell>{fecha(e.fecha)}</Cell><Cell>{e.ordenId}</Cell><Cell>{e.material}</Cell><Cell>{e.cantidad}</Cell><Cell>{fecha(e.fechaCompromiso)}</Cell><Cell><Badge value={e.resultado}/></Cell></tr>)}
      </Table></div>}
    <div><h3 className="mb-2 font-semibold text-gray-800">Reclamos</h3>
      <Notice notice={notice}/>
      {editable&&<form className="mb-3 grid gap-2 sm:grid-cols-[160px_1fr_160px_auto]" onSubmit={async e=>{e.preventDefault();if(await run('/reclamos',{body:{...form,proveedorId:proveedor.id,ordenId:form.ordenId||null}},'Reclamo registrado.'))setForm({tipo:'Calidad',descripcion:'',ordenId:''})}}>
        <select className={input} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>{['Calidad','Entrega tardía','Cantidad incorrecta','Precio','Otro'].map(x=><option key={x}>{x}</option>)}</select>
        <input className={input} required placeholder="Describe el reclamo" value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}/>
        <input className={input} placeholder="Orden de compra (opcional)" value={form.ordenId} onChange={e=>setForm({...form,ordenId:e.target.value})}/>
        <button className={button} disabled={busy}>Registrar</button></form>}
      <Table headers={['Fecha','Tipo','Descripción','Estado','Respuesta','Acción']} min={640} empty={reclamos.length?null:'Sin reclamos registrados.'}>
        {reclamos.map(r=><tr key={r.id}><Cell>{fecha(r.fecha)}</Cell><Cell>{r.tipo}</Cell><Cell>{r.descripcion}{r.ordenId&&<span className="block text-xs text-gray-500">{r.ordenId}</span>}</Cell><Cell><Badge value={r.estado}/></Cell><Cell>{r.respuesta||'—'}</Cell>
          <Cell>{editable&&['Abierto','En seguimiento'].includes(r.estado)&&<div className="flex flex-col gap-1">
            <input className={input} placeholder="Respuesta" value={respuesta[r.id]||''} onChange={e=>setRespuesta({...respuesta,[r.id]:e.target.value})}/>
            <div className="flex gap-1">{['En seguimiento','Resuelto','Rechazado'].filter(x=>x!==r.estado).map(x=><button key={x} type="button" className={buttonLight} disabled={busy} onClick={()=>run(`/reclamos/${r.id}`,{method:'PATCH',body:{estado:x,respuesta:respuesta[r.id]||''}},'Reclamo actualizado.')}>{x}</button>)}</div></div>}</Cell></tr>)}
      </Table></div>
  </div>;
}
