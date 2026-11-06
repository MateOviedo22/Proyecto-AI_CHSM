import {useEffect,useState} from 'react';
import {useSearchParams,Link} from 'react-router-dom';
import {api} from '../../../services/api';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Header,Section,Field,Table,Cell,Badge,Notice,Stat,input,button,buttonLight,num,fechaHora,fecha,useAction,imprimir} from '../../../components/erp/Erp';
// Trazabilidad: genealogía del lote (origen, insumos, destinos) e historial filtrable; registro de entradas/salidas manuales.
export default function Trazabilidad(){
  const {user}=useAuth(); const editable=puede(user,'inventario','escribir');
  const [params,setParams]=useSearchParams();
  const [codigo,setCodigo]=useState(params.get('lote')||''),[lote,setLote]=useState(null),[error,setError]=useState('');
  const [filtros,setFiltros]=useState({almacenId:'',tipo:'',q:'',desde:'',hasta:''});
  const qs=new URLSearchParams(Object.entries(filtros).filter(([,v])=>v)).toString();
  const [movimientos,reloadMov]=useApiList(`/movimientos?${qs}`);
  const [almacenes]=useApiList('/almacenes'); const [lotes]=useApiList('/lotes');
  const [productos]=useApiList('/recursos/productos'); const [materiales]=useApiList('/recursos/materiales');
  const {busy,notice,run}=useAction(reloadMov);
  const [mov,setMov]=useState({tipo:'Salida',almacenId:'',clase:'producto',id:'',cantidad:'',motivo:'Producto defectuoso',detalle:'',documento:''});
  const buscar=async c=>{setError('');setLote(null);if(!c)return;try{setLote((await api(`/trazabilidad/lotes/${encodeURIComponent(c)}`)).data);setParams({lote:c});}catch(e){setError(e.message);}};
  useEffect(()=>{if(params.get('lote'))buscar(params.get('lote'));},[]);// eslint-disable-line react-hooks/exhaustive-deps
  const motivos=mov.tipo==='Entrada'?['Ajuste por conteo','Devolución interna','Producto recuperado','Otro']:['Producto defectuoso','Limpieza de inventario','Merma','Ajuste por conteo','Muestra / exhibición','Otro'];
  return <div className="space-y-6">
    <Header modulo="Inventario" title="Trazabilidad de inventario" subtitle="Sigue un lote desde su origen (compra o producción) hasta su consumo, traslado o venta."><button className={buttonLight} onClick={imprimir}>Imprimir</button></Header>
    <Section title="Rastrear un lote"><form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();buscar(codigo.trim());}}>
      <input list="lotes" className={`${input} max-w-sm`} placeholder="Código de lote (p. ej. LC-2026-00001)" value={codigo} onChange={e=>setCodigo(e.target.value)}/><datalist id="lotes">{lotes.map(l=><option key={l.id} value={l.codigo}>{l.articulo} · {l.origen}</option>)}</datalist>
      <button className={button}>Rastrear</button></form>
      {error&&<p className="mt-3 text-sm text-red-700">{error}</p>}
      {lote&&<div className="mt-5 space-y-5">
        <div className="grid gap-3 sm:grid-cols-4"><Stat label="Lote" value={lote.lote.codigo} hint={`${lote.lote.tipo}: ${lote.lote.articulo}`}/><Stat label="Origen" value={lote.lote.origen} hint={fechaHora(lote.lote.fecha)}/><Stat label="Entradas / salidas" value={`${num(lote.resumen.entradas)} / ${num(lote.resumen.salidas)}`} hint={lote.lote.unidad}/><Stat label="Disponible" value={num(lote.resumen.disponible)} hint={lote.existencias.map(e=>`${e.almacen}: ${e.cantidad}`).join(' · ')||'Agotado'}/></div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border p-4"><h3 className="mb-2 font-semibold">1. Origen</h3>{!lote.origen?<p className="text-sm text-gray-500">{lote.lote.referencia||'Sin documento de origen.'}</p>:lote.lote.origen==='Compra'?
            <ul className="space-y-1 text-sm"><li>Orden de compra: <b>{lote.origen.orden_id}</b></li><li>Proveedor: {lote.origen.proveedor} ({lote.origen.razon_social})</li><li>Recepción: {fechaHora(lote.origen.fecha)}</li><li>Documento: {lote.origen.documento||'—'}</li></ul>:
            <ul className="space-y-1 text-sm"><li>Orden de producción: <b>{lote.origen.orden_id}</b></li><li>Plan: {lote.origen.plan_id||'Fuera de plan'}</li><li>Línea: {lote.origen.linea||'—'}</li><li>Planificado / producido: {lote.origen.cantidad_planificada} / {lote.origen.cantidad_producida}</li><li>Aprobadas / rechazadas: {lote.origen.aprobada} / {lote.origen.rechazada}</li><li>Autorizó: {lote.origen.autorizado_por||'—'}</li></ul>}</div>
          <div className="rounded-xl border p-4"><h3 className="mb-2 font-semibold">2. Insumos o uso en producción</h3>
            {lote.insumos.length>0&&<ul className="space-y-1 text-sm">{lote.insumos.map((i,k)=><li key={k}>{i.material}: {num(i.cantidad,3)} {i.unidad} {i.lote&&<button className="text-emerald-700 underline" onClick={()=>{setCodigo(i.lote);buscar(i.lote)}}>{i.lote}</button>}</li>)}</ul>}
            {lote.consumidoEn.length>0&&<ul className="space-y-1 text-sm">{lote.consumidoEn.map(c=><li key={c.orden_id}>Consumido en <b>{c.orden_id}</b>: {num(c.cantidad,3)}</li>)}</ul>}
            {!lote.insumos.length&&!lote.consumidoEn.length&&<p className="text-sm text-gray-500">Sin registros.</p>}</div>
          <div className="rounded-xl border p-4"><h3 className="mb-2 font-semibold">3. Destino</h3>
            {lote.traslados.map(t=><p key={t.id} className="text-sm">{t.tipo}: {t.cantidad} ({t.almacen}) · {t.referencia}</p>)}
            {lote.ventas.map((v,k)=><p key={k} className="text-sm">Vendido: {v.cantidad} · {v.referencia} · {fecha(v.fecha)}</p>)}
            {!lote.traslados.length&&!lote.ventas.length&&<p className="text-sm text-gray-500">Sin traslados ni ventas.</p>}</div>
        </div>
        <Table headers={['Fecha','Movimiento','Cantidad','Almacén','Referencia','Motivo','Usuario']}>{lote.movimientos.map(m=><tr key={m.id}><Cell>{fechaHora(m.fecha)}</Cell><Cell>{m.tipo}</Cell><Cell>{m.cantidad}</Cell><Cell>{m.almacen}</Cell><Cell>{m.referencia||'—'}</Cell><Cell>{m.motivo||'—'}</Cell><Cell>{m.usuario}</Cell></tr>)}</Table>
      </div>}
    </Section>
    <Notice notice={notice}/>
    {editable&&<Section title="Registrar entrada o salida manual"><form className="grid gap-3 md:grid-cols-4" onSubmit={async e=>{e.preventDefault();if(await run('/inventario/movimientos',{body:{tipo:mov.tipo,almacenId:Number(mov.almacenId),[mov.clase==='producto'?'productoId':'materialId']:Number(mov.id),cantidad:Number(mov.cantidad),motivo:mov.motivo,detalle:mov.detalle,documento:mov.documento}},'Movimiento registrado.'))setMov({...mov,id:'',cantidad:'',detalle:'',documento:''})}}>
      <Field label="Tipo"><select className={input} value={mov.tipo} onChange={e=>setMov({...mov,tipo:e.target.value,motivo:e.target.value==='Entrada'?'Ajuste por conteo':'Producto defectuoso'})}><option>Salida</option><option>Entrada</option></select></Field>
      <Field label="Almacén"><select required className={input} value={mov.almacenId} onChange={e=>setMov({...mov,almacenId:e.target.value})}><option value="">Selecciona...</option>{almacenes.filter(a=>a.activo).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
      <Field label="Clase"><select className={input} value={mov.clase} onChange={e=>setMov({...mov,clase:e.target.value,id:''})}><option value="producto">Producto terminado</option><option value="material">Materia prima / insumo</option></select></Field>
      <Field label="Artículo"><select required className={input} value={mov.id} onChange={e=>setMov({...mov,id:e.target.value})}><option value="">Selecciona...</option>{(mov.clase==='producto'?productos.map(p=>[p.id,p.nombre]):materiales.map(m=>[m.id,m.name])).map(([id,n])=><option key={id} value={id}>{n}</option>)}</select></Field>
      <Field label="Cantidad"><input required type="number" min="0.001" step="0.001" className={input} value={mov.cantidad} onChange={e=>setMov({...mov,cantidad:e.target.value})}/></Field>
      <Field label="Motivo"><select className={input} value={mov.motivo} onChange={e=>setMov({...mov,motivo:e.target.value})}>{motivos.map(m=><option key={m}>{m}</option>)}</select></Field>
      <Field label="Detalle"><input className={input} required={mov.motivo==='Otro'} value={mov.detalle} onChange={e=>setMov({...mov,detalle:e.target.value})}/></Field>
      <Field label="Documento"><input className={input} value={mov.documento} onChange={e=>setMov({...mov,documento:e.target.value})}/></Field>
      <div><button className={button} disabled={busy}>Registrar</button></div></form>
      <p className="mt-2 text-xs text-gray-500">Las salidas consumen primero los lotes más antiguos del almacén (FIFO) y nunca superan la existencia disponible.</p></Section>}
    <Section title="Historial de movimientos">
      <div className="mb-4 grid gap-2 md:grid-cols-5">
        <select className={input} value={filtros.almacenId} onChange={e=>setFiltros({...filtros,almacenId:e.target.value})}><option value="">Todos los almacenes</option>{almacenes.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select>
        <select className={input} value={filtros.tipo} onChange={e=>setFiltros({...filtros,tipo:e.target.value})}><option value="">Todos los tipos</option>{['Saldo inicial','Entrada','Recepción de compra','Venta','Salida manual','Entrada manual','Devolución a proveedor','Consumo de producción','Ingreso de producción','Traslado salida','Traslado entrada','Devolución de venta'].map(x=><option key={x}>{x}</option>)}</select>
        <input className={input} placeholder="Artículo, referencia o lote" value={filtros.q} onChange={e=>setFiltros({...filtros,q:e.target.value})}/>
        <input type="date" className={input} value={filtros.desde} onChange={e=>setFiltros({...filtros,desde:e.target.value})}/>
        <input type="date" className={input} value={filtros.hasta} onChange={e=>setFiltros({...filtros,hasta:e.target.value})}/>
      </div>
      <Table headers={['Fecha','Artículo','Movimiento','Cantidad','Saldo almacén','Saldo total','Almacén','Lote','Referencia','Usuario']} min={1100} empty={movimientos.length?null:'No hay movimientos con esos filtros.'}>
        {movimientos.map(m=><tr key={m.id}><Cell>{fechaHora(m.fecha)}</Cell><Cell>{m.articulo}<span className="block text-xs text-gray-500">{m.clase}</span></Cell><Cell>{m.tipo}{m.motivo&&<span className="block text-xs text-gray-500">{m.motivo}</span>}</Cell><Cell className={m.cantidad<0?'text-red-700':'text-emerald-700'}>{m.cantidad>0?'+':''}{num(m.cantidad,3)}</Cell><Cell>{m.saldo_almacen??'—'}</Cell><Cell>{num(m.saldo,3)}</Cell><Cell>{m.almacen||'—'}</Cell>
          <Cell>{m.lote?<button className="text-emerald-700 underline" onClick={()=>{setCodigo(m.lote);buscar(m.lote);window.scrollTo(0,0)}}>{m.lote}</button>:'—'}</Cell><Cell>{m.referencia||'—'}</Cell><Cell>{m.usuario}</Cell></tr>)}
      </Table></Section>
    <p className="text-xs text-gray-500 print:hidden">¿Buscas los productos de un almacén? Consulta <Link className="underline" to="/sistema/inventario/almacenes">Almacenes</Link>.</p>
  </div>;
}
