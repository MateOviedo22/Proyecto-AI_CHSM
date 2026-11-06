import {useState} from 'react';
import {RotateCcw,Search} from 'lucide-react';
import {api} from '../../../services/api';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Header,Section,Field,Table,Cell,Badge,Notice,Stat,input,button,money,fecha,fechaHora,useAction} from '../../../components/erp/Erp';
// Cambios y devoluciones sobre ventas reales: no superan lo vendido, reingresan stock y registran el egreso.
export default function Cambios_Devoluciones(){
  const {user}=useAuth(); const editable=puede(user,'ventas','escribir');
  const [devoluciones,reload]=useApiList('/ventas/devoluciones');
  const [productos]=useApiList('/recursos/productos');
  const [venta,setVenta]=useState(null),[buscar,setBuscar]=useState(''),[error,setError]=useState('');
  const [form,setForm]=useState({ventaDetalleId:'',cantidad:1,tipo:'Devolución',motivo:'',reingresa:true,productoCambioId:''});
  const refrescar=async()=>{await reload(); if(venta) setVenta((await api(`/ventas/${venta.id}`)).data);};
  const {busy,notice,run}=useAction(refrescar);
  // Se busca por número de venta (V-12 o 12) o por número de factura.
  const cargar=async e=>{e.preventDefault();setError('');setVenta(null);
    try{let id=buscar.trim().toUpperCase();
      if(id.startsWith('FAC-')){const f=(await api('/facturas')).data.find(x=>x.numero===id);if(!f)throw new Error('No existe esa factura.');id=f.ventaId;}
      else id=id.replace(/^V-/,'');
      setVenta((await api(`/ventas/${Number(id)}`)).data);}catch(err){setError(err.message);}};
  const linea=venta?.lineas.find(l=>l.id===Number(form.ventaDetalleId));
  const registrar=async e=>{e.preventDefault();if(await run('/ventas/devoluciones',{body:{ventaId:venta.id,ventaDetalleId:Number(form.ventaDetalleId),cantidad:Number(form.cantidad),tipo:form.tipo,motivo:form.motivo,reingresa:form.reingresa,productoCambioId:form.tipo==='Cambio'?Number(form.productoCambioId):undefined}},`${form.tipo} registrada.`))setForm({...form,ventaDetalleId:'',cantidad:1,motivo:''});};
  return <div className="space-y-6">
    <Header modulo="Ventas" title="Cambios y devoluciones" subtitle="Registra devoluciones o cambios de productos vendidos; el inventario y finanzas se actualizan en la misma operación."/>
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Devoluciones" value={devoluciones.filter(d=>d.tipo==='Devolución').length}/><Stat label="Cambios" value={devoluciones.filter(d=>d.tipo==='Cambio').length}/><Stat label="Monto devuelto" value={money(devoluciones.reduce((s,d)=>s+d.monto,0))}/></div>
    <Notice notice={notice}/>
    <Section title="Buscar la venta"><form className="flex flex-wrap gap-2" onSubmit={cargar}><input required className={`${input} max-w-xs`} placeholder="Número de venta (V-12) o factura (FAC-000012)" value={buscar} onChange={e=>setBuscar(e.target.value)}/><button className={button}><Search size={14} className="inline"/> Buscar</button></form>
      {error&&<p className="mt-2 text-sm text-red-700">{error}</p>}
      {venta&&<div className="mt-4 space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-4"><p><span className="block text-xs text-gray-500">Venta</span>V-{venta.id} · {venta.factura}</p><p><span className="block text-xs text-gray-500">Cliente</span>{venta.cliente}</p><p><span className="block text-xs text-gray-500">Fecha</span>{fechaHora(venta.fecha)}</p><p><span className="block text-xs text-gray-500">Estado</span><Badge value={venta.estado}/></p></div>
        <Table headers={['Producto','Vendido','Devuelto','Precio']} min={480}>{venta.lineas.map(l=><tr key={l.id}><Cell>{l.codigo} · {l.nombre}</Cell><Cell>{l.cantidad}</Cell><Cell>{l.devuelto}</Cell><Cell>{money(l.precio)}</Cell></tr>)}</Table>
        {editable&&venta.estado!=='Anulada'&&<form className="grid gap-3 md:grid-cols-3" onSubmit={registrar}>
          <Field label="Producto"><select required className={input} value={form.ventaDetalleId} onChange={e=>setForm({...form,ventaDetalleId:e.target.value})}><option value="">Selecciona...</option>{venta.lineas.filter(l=>l.cantidad>l.devuelto).map(l=><option key={l.id} value={l.id}>{l.nombre} (puede devolver {l.cantidad-l.devuelto})</option>)}</select></Field>
          <Field label="Cantidad"><input required type="number" min="1" step="1" max={linea?linea.cantidad-linea.devuelto:undefined} className={input} value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})}/></Field>
          <Field label="Tipo"><select className={input} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option>Devolución</option><option>Cambio</option></select></Field>
          {form.tipo==='Cambio'&&<Field label="Producto que se entrega a cambio"><select required className={input} value={form.productoCambioId} onChange={e=>setForm({...form,productoCambioId:e.target.value})}><option value="">Selecciona...</option>{productos.filter(p=>p.activo).map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Field>}
          <Field label="Motivo" className="md:col-span-2"><input required className={input} value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})}/></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.reingresa} onChange={e=>setForm({...form,reingresa:e.target.checked})}/>Reingresa al inventario (desmarcar si está defectuoso)</label>
          <div><button className={button} disabled={busy}><RotateCcw size={14} className="inline"/> Registrar</button></div></form>}
      </div>}
    </Section>
    <Section title="Historial de cambios y devoluciones"><Table headers={['Fecha','Venta / factura','Cliente','Producto','Cantidad','Tipo','Monto','Reingreso','Motivo','Usuario']} min={1000} empty={devoluciones.length?null:'Sin cambios ni devoluciones registrados.'}>
      {devoluciones.map(d=><tr key={d.id}><Cell>{fecha(d.fecha)}</Cell><Cell>V-{d.ventaId}<span className="block text-xs text-gray-500">{d.factura}</span></Cell><Cell>{d.cliente}</Cell><Cell>{d.producto}</Cell><Cell>{d.cantidad}</Cell><Cell>{d.tipo}</Cell><Cell>{money(d.monto)}</Cell><Cell>{d.reingresa?d.almacen:'No (defectuoso)'}</Cell><Cell>{d.motivo}</Cell><Cell>{d.usuario}</Cell></tr>)}
    </Table></Section>
  </div>;
}
