import {useState} from 'react';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Header,Section,Field,Table,Cell,Badge,Notice,Stat,input,button,buttonLight,money,fecha,useAction} from '../../../components/erp/Erp';
const MOTIVOS=['Material defectuoso','Cantidad excedente','Material incorrecto','Daño en transporte','Otro'];
const empty={recepcionId:'',cantidad:'',motivo:'Material defectuoso',detalle:'',documento:''};
// Devoluciones a proveedor: se registran sobre una recepción (lote) y el material sale del inventario al enviarse.
export default function Devoluciones_Compras(){
  const {user}=useAuth(); const editable=puede(user,'compras','escribir');
  const [devoluciones,reloadDev]=useApiList('/compras/devoluciones');
  const [compras,reloadCompras]=useApiList('/compras');
  const reload=async()=>{await Promise.all([reloadDev(),reloadCompras()]);};
  const {busy,notice,run}=useAction(reload);
  const [form,setForm]=useState(empty),[filtro,setFiltro]=useState('Todas');
  const recepciones=(compras.recepciones||[]).filter(r=>r.cantidad>r.devuelto);
  const sel=recepciones.find(r=>r.id===Number(form.recepcionId));
  const lista=devoluciones.filter(d=>filtro==='Todas'||d.estado===filtro);
  const crear=async e=>{e.preventDefault();if(await run('/compras/devoluciones',{body:{...form,recepcionId:Number(form.recepcionId),cantidad:Number(form.cantidad)}},'Devolución registrada como pendiente.'))setForm(empty);};
  const estado=(d,estado,msg)=>run(`/compras/devoluciones/${d.id}/estado`,{method:'PATCH',body:{estado}},msg);
  return <div className="space-y-6">
    <Header modulo="Compras" title="Devoluciones de compras" subtitle="Devuelve material recibido al proveedor. El inventario se descuenta del lote recibido cuando la devolución se marca como enviada."/>
    <div className="grid gap-4 sm:grid-cols-4">
      <Stat label="Pendientes" value={devoluciones.filter(d=>d.estado==='Pendiente').length}/>
      <Stat label="Enviadas" value={devoluciones.filter(d=>d.estado==='Enviada').length}/>
      <Stat label="Acreditadas" value={devoluciones.filter(d=>d.estado==='Acreditada').length}/>
      <Stat label="Monto devuelto" value={money(devoluciones.filter(d=>d.estado!=='Cancelada').reduce((s,d)=>s+d.monto,0))}/>
    </div>
    <Notice notice={notice}/>
    {editable&&<Section title="Nueva devolución"><form onSubmit={crear} className="grid gap-4 md:grid-cols-3">
      <Field label="Recepción (orden · material · lote)" className="md:col-span-2"><select required className={input} value={form.recepcionId} onChange={e=>setForm({...form,recepcionId:e.target.value})}><option value="">Selecciona la recepción</option>
        {recepciones.map(r=><option key={r.id} value={r.id}>{r.orden_id} · {r.proveedor} · {r.producto} · lote {r.lote||'—'} · disponible para devolver: {r.cantidad-r.devuelto} {r.unidad}</option>)}</select></Field>
      <Field label="Cantidad"><input required type="number" min="0.001" step="0.001" max={sel?sel.cantidad-sel.devuelto:undefined} className={input} value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})}/></Field>
      <Field label="Motivo"><select className={input} value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})}>{MOTIVOS.map(m=><option key={m}>{m}</option>)}</select></Field>
      <Field label="Detalle"><input className={input} required={form.motivo==='Otro'} value={form.detalle} onChange={e=>setForm({...form,detalle:e.target.value})}/></Field>
      <Field label="Documento (nota de crédito, guía)"><input className={input} value={form.documento} onChange={e=>setForm({...form,documento:e.target.value})}/></Field>
      <div><button className={button} disabled={busy}>Registrar devolución</button></div>
    </form></Section>}
    <Section title="Devoluciones registradas" actions={<select className={`${input} w-44`} value={filtro} onChange={e=>setFiltro(e.target.value)}>{['Todas','Pendiente','Enviada','Acreditada','Cancelada'].map(x=><option key={x}>{x}</option>)}</select>}>
      <Table headers={['Fecha','Proveedor','Orden','Material / lote','Cantidad','Monto','Motivo','Estado','Acciones']} min={1000} empty={lista.length?null:'No hay devoluciones registradas.'}>
        {lista.map(d=><tr key={d.id}><Cell>{fecha(d.fecha)}</Cell><Cell>{d.proveedor}</Cell><Cell>{d.ordenId}</Cell><Cell>{d.material}<span className="block text-xs text-gray-500">Lote {d.lote||'—'} · {d.almacen}</span></Cell><Cell>{d.cantidad} {d.unidad}</Cell><Cell>{money(d.monto)}</Cell><Cell>{d.motivo}{d.documento&&<span className="block text-xs text-gray-500">{d.documento}</span>}</Cell><Cell><Badge value={d.estado}/></Cell>
          <Cell>{editable&&<div className="flex flex-wrap gap-1">
            {d.estado==='Pendiente'&&<><button className={buttonLight} disabled={busy} onClick={()=>estado(d,'Enviada','Devolución enviada: el material salió del inventario.')}>Marcar enviada</button><button className={buttonLight} disabled={busy} onClick={()=>estado(d,'Cancelada','Devolución cancelada.')}>Cancelar</button></>}
            {d.estado==='Enviada'&&<button className={buttonLight} disabled={busy} onClick={()=>estado(d,'Acreditada','Devolución acreditada por el proveedor.')}>Acreditada</button>}
          </div>}</Cell></tr>)}
      </Table>
    </Section>
  </div>;
}
