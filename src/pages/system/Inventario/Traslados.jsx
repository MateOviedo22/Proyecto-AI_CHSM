import {useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowRight,ArrowLeftRight,Plus,Trash2,Paperclip,Printer} from 'lucide-react';
import {api,BASE,getToken,reportApiError} from '../../../services/api';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Header,Section,Field,Table,Cell,Badge,Notice,Stat,input,button,buttonLight,num,fecha,fechaHora,useAction,imprimir} from '../../../components/erp/Erp';
const MOTIVOS=['Reabastecimiento de tienda','Devolución a taller','Producto defectuoso','Reubicación','Exhibición o evento','Otro'];
const ESTADOS=['Todos','Borrador','Revisado','Autorizado','En tránsito','Recibido','Recibido con diferencias','Cancelado'];
const emptyLine={clase:'producto',id:'',loteId:'',cantidad:''};
const empty={origenId:'',destinoId:'',motivo:'Reabastecimiento de tienda',fechaRequerida:'',observaciones:'',detalles:[{...emptyLine}]};
// Traslados entre almacenes: formulario formal, firmas (elaboró, revisó, autorizó, despachó, recibió), diferencias y evidencias.
export default function Traslados(){
  const {user}=useAuth(); const editable=puede(user,'traslados','escribir');
  const [traslados,reload]=useApiList('/traslados');
  const [almacenes]=useApiList('/almacenes');
  const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[showForm,setShowForm]=useState(false),[sel,setSel]=useState(null),[filtro,setFiltro]=useState('Todos'),[search,setSearch]=useState('');
  const [existencias]=useApiList(form.origenId?`/existencias?almacenId=${form.origenId}`:null);
  const refresh=useCallback(async()=>{await reload(); if(sel) setSel((await api(`/traslados/${sel.id}`)).data);},[reload,sel]);
  const {busy,notice,run}=useAction(refresh);
  // Artículos disponibles en el origen (agrupados) y sus lotes.
  const articulos=useMemo(()=>{const m=new Map();for(const e of existencias){const k=`${e.producto_id?'producto':'material'}-${e.producto_id||e.material_id}`;const a=m.get(k)||{clase:e.producto_id?'producto':'material',id:e.producto_id||e.material_id,nombre:e.articulo,unidad:e.unidad,total:0,lotes:[]};a.total+=e.cantidad;if(e.lote_id)a.lotes.push({id:e.lote_id,codigo:e.lote,cantidad:e.cantidad});m.set(k,a);}return [...m.values()];},[existencias]);
  const art=l=>articulos.find(a=>a.clase===l.clase&&a.id===Number(l.id));
  const setLine=(i,k,v)=>setForm(f=>({...f,detalles:f.detalles.map((l,j)=>j===i?{...l,[k]:v,...(k==='id'||k==='clase'?{loteId:''}:{})}:l)}));
  const body=()=>({...form,origenId:Number(form.origenId),destinoId:Number(form.destinoId),fechaRequerida:form.fechaRequerida||null,detalles:form.detalles.map(l=>({[l.clase==='producto'?'productoId':'materialId']:Number(l.id),loteId:l.loteId?Number(l.loteId):null,cantidad:Number(l.cantidad)}))});
  const save=async e=>{e.preventDefault();const r=editing?await run(`/traslados/${editing.id}`,{method:'PUT',body:{...body(),_version:editing._version}},'Traslado actualizado.'):await run('/traslados',{body:body()},'Traslado registrado en borrador.');if(r){setShowForm(false);setEditing(null);setForm(empty);setSel(r);}};
  const lista=traslados.filter(t=>(filtro==='Todos'||t.estado===filtro)&&`${t.id} ${t.origen} ${t.destino} ${t.motivo}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6">
    <Header modulo="Inventario" title="Traslados entre almacenes" subtitle="Elaborado → revisado → autorizado → despachado (sale del origen) → recibido (entra al destino, con diferencias justificadas).">{editable&&<button className={button} onClick={()=>{setShowForm(!showForm);setEditing(null);setForm(empty)}}><Plus size={16} className="inline"/> Nuevo traslado</button>}</Header>
    <div className="grid gap-4 sm:grid-cols-4"><Stat label="Por revisar o autorizar" value={traslados.filter(t=>['Borrador','Revisado'].includes(t.estado)).length}/><Stat label="Por despachar" value={traslados.filter(t=>t.estado==='Autorizado').length}/><Stat label="En tránsito" value={traslados.filter(t=>t.estado==='En tránsito').length}/><Stat label="Recibidos con diferencias" value={traslados.filter(t=>t.estado==='Recibido con diferencias').length}/></div>
    <Notice notice={notice}/>
    {showForm&&editable&&<Section title={editing?`Editar ${editing.id}`:'Formulario de traslado'}><form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Almacén de origen"><select required className={input} value={form.origenId} onChange={e=>setForm({...form,origenId:e.target.value,detalles:[{...emptyLine}]})}><option value="">Selecciona...</option>{almacenes.filter(a=>a.activo).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
        <Field label="Almacén de destino"><select required className={input} value={form.destinoId} onChange={e=>setForm({...form,destinoId:e.target.value})}><option value="">Selecciona...</option>{almacenes.filter(a=>a.activo&&String(a.id)!==form.origenId).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
        <Field label="Motivo"><select className={input} value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})}>{MOTIVOS.map(m=><option key={m}>{m}</option>)}</select></Field>
        <Field label="Fecha requerida"><input type="date" className={input} value={form.fechaRequerida} onChange={e=>setForm({...form,fechaRequerida:e.target.value})}/></Field>
        <Field label={form.motivo==='Otro'?'Observaciones (describe el motivo)':'Observaciones'} className="md:col-span-4"><input className={input} required={form.motivo==='Otro'} value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})}/></Field>
      </div>
      <p className="text-sm font-semibold text-gray-700">Artículos a trasladar {form.origenId&&<span className="font-normal text-gray-500">(existencias del origen)</span>}</p>
      {form.detalles.map((l,i)=>{const a=art(l);return <div key={i} className="grid grid-cols-[1fr_2fr_1.5fr_1fr_auto] items-center gap-2">
        <select className={input} value={l.clase} onChange={e=>setLine(i,'clase',e.target.value)}><option value="producto">Producto</option><option value="material">Material</option></select>
        <select required className={input} value={l.id} onChange={e=>setLine(i,'id',e.target.value)}><option value="">{form.origenId?'Artículo...':'Elige primero el origen'}</option>{articulos.filter(x=>x.clase===l.clase).map(x=><option key={x.id} value={x.id}>{x.nombre} (disp. {num(x.total,3)} {x.unidad})</option>)}</select>
        <select className={input} value={l.loteId} onChange={e=>setLine(i,'loteId',e.target.value)}><option value="">Lotes más antiguos primero (FIFO)</option>{a?.lotes.map(x=><option key={x.id} value={x.id}>{x.codigo} (disp. {num(x.cantidad,3)})</option>)}</select>
        <input required type="number" min={l.clase==="producto"?"1":"0.001"} step={l.clase==="producto"?"1":"0.001"} max={l.loteId?a?.lotes.find(x=>x.id===Number(l.loteId))?.cantidad:a?.total} placeholder="Cantidad" className={input} value={l.cantidad} onChange={e=>setLine(i,'cantidad',e.target.value)}/>
        <button type="button" disabled={form.detalles.length===1} className="p-2 text-red-700 disabled:opacity-30" onClick={()=>setForm(f=>({...f,detalles:f.detalles.filter((_,j)=>j!==i)}))}><Trash2 size={16}/></button></div>})}
      <div className="flex gap-2"><button type="button" className={buttonLight} onClick={()=>setForm(f=>({...f,detalles:[...f.detalles,{...emptyLine}]}))}>+ Agregar artículo</button><button className={button} disabled={busy}>{editing?'Guardar cambios':'Registrar traslado'}</button><button type="button" className={buttonLight} onClick={()=>{setShowForm(false);setEditing(null)}}>Cancelar</button></div>
    </form></Section>}
    {sel&&<Detalle t={sel} user={user} editable={editable} busy={busy} run={run} onClose={()=>setSel(null)} onEdit={()=>{setEditing(sel);setShowForm(true);setForm({origenId:String(sel.origenId),destinoId:String(sel.destinoId),motivo:sel.motivo,fechaRequerida:sel.fechaRequerida||'',observaciones:sel.observaciones,detalles:sel.detalles.map(d=>({clase:d.productoId?'producto':'material',id:String(d.productoId||d.materialId),loteId:d.loteId?String(d.loteId):'',cantidad:String(d.cantidad)}))});}}/>}
    <Section title="Traslados" actions={<div className="flex gap-2"><input className={`${input} w-56`} placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/><select className={`${input} w-52`} value={filtro} onChange={e=>setFiltro(e.target.value)}>{ESTADOS.map(x=><option key={x}>{x}</option>)}</select></div>}>
      <Table headers={['Código / fecha','Ruta','Motivo','Artículos','Enviado / recibido','Estado','']} min={960} empty={lista.length?null:'No hay traslados.'}>
        {lista.map(t=><tr key={t.id}><Cell><b>{t.id}</b><span className="block text-xs text-gray-500">{fecha(t.fecha)}</span></Cell><Cell><span className="flex items-center gap-1">{t.origen}<ArrowRight size={14}/>{t.destino}</span></Cell><Cell>{t.motivo}</Cell><Cell>{t.detalles.map(d=>`${d.articulo} ×${num(d.cantidad,3)}`).join(', ')}</Cell><Cell>{num(t.totalEnviado,3)} / {['Recibido','Recibido con diferencias'].includes(t.estado)?num(t.totalRecibido,3):'—'}</Cell><Cell><Badge value={t.estado}/></Cell>
          <Cell><button className={buttonLight} onClick={async()=>setSel((await api(`/traslados/${t.id}`)).data)}>Ver</button></Cell></tr>)}
      </Table></Section>
  </div>;
}
function Detalle({t,user,editable,busy,run,onClose,onEdit}){
  const [rec,setRec]=useState({}),[cancel,setCancel]=useState(''),[evid,setEvid]=useState([]),[archivo,setArchivo]=useState({etapa:'Despacho',descripcion:'',file:null});
  const loadEvid=useCallback(async()=>setEvid((await api(`/traslados/${t.id}/evidencias`)).data),[t.id]);
  useEffect(()=>{loadEvid().catch(reportApiError);setRec(Object.fromEntries(t.detalles.map(d=>[d.id,{recibida:String(d.cantidad),motivo:''}])));},[t.id,t.estado,t.evidencias,loadEvid]);// eslint-disable-line react-hooks/exhaustive-deps
  const accion=(a,msg,body)=>run(`/traslados/${t.id}/${a}`,{method:'PATCH',body},msg);
  const ver=async e=>{try{const r=await fetch(`${BASE}/traslados/evidencias/${e.id}`,{headers:{Authorization:`Bearer ${getToken()}`}});if(!r.ok)throw new Error('No se pudo abrir la evidencia.');window.open(URL.createObjectURL(await r.blob()),'_blank','noopener');}catch(err){reportApiError(err);}};
  const subir=async e=>{e.preventDefault();const f=archivo.file;if(!f)return;if(f.size>2*1024*1024){reportApiError(new Error('La evidencia no puede superar 2 MB.'));return;}
    const contenido=await new Promise((ok,ko)=>{const fr=new FileReader();fr.onload=()=>ok(String(fr.result).split(',')[1]);fr.onerror=ko;fr.readAsDataURL(f);});
    if(await run(`/traslados/${t.id}/evidencias`,{body:{nombre:f.name,tipo:f.type,etapa:archivo.etapa,descripcion:archivo.descripcion,contenido}},'Evidencia adjuntada.')){setArchivo({...archivo,descripcion:'',file:null});e.target.reset();loadEvid();}};
  const firma=(l,quien,cuando)=><div className="rounded-lg border p-3"><p className="text-xs text-gray-500">{l}</p><p className="font-medium">{quien||'Pendiente'}</p>{cuando&&<p className="text-xs text-gray-500">{fechaHora(cuando)}</p>}</div>;
  const puedeAutorizar=['admin','inventario'].includes(user?.role)&&t.elaboradoPorId!==user?.id, puedeRevisar=t.elaboradoPorId!==user?.id;
  return <Section title={<span className="flex items-center gap-2"><ArrowLeftRight size={18}/>Traslado {t.id}</span>} actions={<div className="flex gap-2 print:hidden"><button className={buttonLight} onClick={imprimir}><Printer size={14} className="inline"/> Imprimir</button><button className={buttonLight} onClick={onClose}>Cerrar</button></div>}>
    <div className="space-y-5 text-sm">
      <p className="hidden text-xl font-bold print:block">Formulario de traslado {t.id}</p>
      <div className="grid gap-3 sm:grid-cols-4">
        <p><span className="block text-xs text-gray-500">Fecha</span>{fecha(t.fecha)}</p><p><span className="block text-xs text-gray-500">Origen → destino</span>{t.origen} → {t.destino}</p>
        <p><span className="block text-xs text-gray-500">Motivo</span>{t.motivo}</p><p><span className="block text-xs text-gray-500">Estado</span><Badge value={t.estado}/></p>
        <p><span className="block text-xs text-gray-500">Fecha requerida</span>{fecha(t.fechaRequerida)}</p><p className="sm:col-span-3"><span className="block text-xs text-gray-500">Observaciones</span>{t.observaciones||'—'}{t.canceladoMotivo&&` · Cancelado: ${t.canceladoMotivo}`}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-5">{firma('Elaborado por',t.elaboradoPor,t.elaboradoEn)}{firma('Revisado por',t.revisadoPor,t.revisadoEn)}{firma('Autorizado por',t.autorizadoPor,t.autorizadoEn)}{firma('Despachado por',t.despachadoPor,t.despachadoEn)}{firma('Recibido por',t.recibidoPor,t.recibidoEn)}</div>
      <Table headers={['Artículo','Clase','Lote','Enviado','Recibido','Diferencia','Motivo de la diferencia']} min={820}>
        {t.detalles.map(d=><tr key={d.id}><Cell>{d.codigo} · {d.articulo}</Cell><Cell>{d.clase}</Cell><Cell>{d.lote||d.lotesDespachados||'FIFO'}</Cell><Cell>{num(d.cantidad,3)} {d.unidad}</Cell>
          <Cell>{t.estado==='En tránsito'&&editable?<input type="number" min="0" max={d.cantidad} step={d.productoId?'1':'0.001'} className={`${input} w-24`} value={rec[d.id]?.recibida??''} onChange={e=>setRec({...rec,[d.id]:{...rec[d.id],recibida:e.target.value}})}/>:d.recibida??'—'}</Cell>
          <Cell>{t.estado==='En tránsito'?num(d.cantidad-(Number(rec[d.id]?.recibida)||0),3):d.diferencia??'—'}</Cell>
          <Cell>{t.estado==='En tránsito'&&editable?<input className={input} placeholder="Requerido si hay diferencia" value={rec[d.id]?.motivo||''} onChange={e=>setRec({...rec,[d.id]:{...rec[d.id],motivo:e.target.value}})}/>:d.diferenciaMotivo||'—'}</Cell></tr>)}
      </Table>
      {editable&&<div className="flex flex-wrap gap-2 print:hidden">
        {t.estado==='Borrador'&&<><button className={buttonLight} onClick={onEdit}>Editar</button>{puedeRevisar?<button className={button} disabled={busy} onClick={()=>accion('revisar','Traslado revisado.')}>Marcar revisado</button>:<span className="self-center text-xs text-gray-500">Debe revisarlo otra persona.</span>}</>}
        {t.estado==='Revisado'&&<>{puedeAutorizar&&<button className={button} disabled={busy} onClick={()=>accion('autorizar','Traslado autorizado.')}>Autorizar</button>}<button className={buttonLight} disabled={busy} onClick={()=>accion('devolver','Traslado devuelto a borrador.')}>Devolver a borrador</button></>}
        {t.estado==='Autorizado'&&<button className={button} disabled={busy} onClick={()=>accion('despachar','Traslado despachado: existencias descontadas del origen.')}>Despachar</button>}
        {t.estado==='En tránsito'&&<button className={button} disabled={busy} onClick={()=>accion('recibir','Recepción registrada: existencias sumadas al destino.',{detalles:t.detalles.map(d=>({id:d.id,recibida:Number(rec[d.id]?.recibida),motivo:rec[d.id]?.motivo||''}))})}>Confirmar recepción</button>}
        {['Borrador','Revisado','Autorizado'].includes(t.estado)&&<span className="flex gap-2"><input className={`${input} w-56`} placeholder="Motivo de cancelación" value={cancel} onChange={e=>setCancel(e.target.value)}/><button className={buttonLight} disabled={busy||!cancel} onClick={()=>accion('cancelar','Traslado cancelado.',{motivo:cancel})}>Cancelar traslado</button></span>}
      </div>}
      <div><h3 className="mb-2 flex items-center gap-2 font-semibold"><Paperclip size={16}/>Evidencias</h3>
        <Table headers={['Fecha','Etapa','Archivo','Descripción','Subido por','']} min={640} empty={evid.length?null:'Sin evidencias adjuntas.'}>{evid.map(e=><tr key={e.id}><Cell>{fechaHora(e.fecha)}</Cell><Cell>{e.etapa}</Cell><Cell>{e.nombre} <span className="text-xs text-gray-500">({num(e.tamano/1024,1)} KB)</span></Cell><Cell>{e.descripcion||'—'}</Cell><Cell>{e.usuario}</Cell><Cell><button className={buttonLight} onClick={()=>ver(e)}>Ver</button></Cell></tr>)}</Table>
        {editable&&t.estado!=='Cancelado'&&<form className="mt-3 grid gap-2 md:grid-cols-[160px_1fr_1fr_auto] print:hidden" onSubmit={subir}>
          <select className={input} value={archivo.etapa} onChange={e=>setArchivo({...archivo,etapa:e.target.value})}>{['Preparación','Despacho','Recepción','Otro'].map(x=><option key={x}>{x}</option>)}</select>
          <input required type="file" accept="image/jpeg,image/png,application/pdf" className={input} onChange={e=>setArchivo({...archivo,file:e.target.files[0]||null})}/>
          <input className={input} placeholder="Descripción (p. ej. guía firmada, foto de la caja)" value={archivo.descripcion} onChange={e=>setArchivo({...archivo,descripcion:e.target.value})}/>
          <button className={buttonLight} disabled={busy}>Adjuntar</button></form>}
        <p className="mt-1 text-xs text-gray-500">Formatos JPG, PNG o PDF de hasta 2 MB.</p></div>
    </div></Section>;
}
