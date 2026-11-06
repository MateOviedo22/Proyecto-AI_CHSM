import {useState} from 'react';
import {Warehouse,MapPin,Package,Boxes} from 'lucide-react';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Header,Section,Field,Table,Cell,Badge,Notice,input,button,buttonLight,money,num,useAction} from '../../../components/erp/Erp';
const empty={codigo:'',nombre:'',ubicacion:'',tipo:'Bodega',responsable:'',descripcion:'',activo:true};
// FRQ-0001/0002, RF-21: almacenes (Taller, Tienda y otros) con existencias reales por almacén y lote.
export default function Almacenes_Ubicaciones(){
  const {user}=useAuth(); const editable=puede(user,'inventario','escribir');
  const [almacenes,reload]=useApiList('/almacenes');
  const {busy,notice,run}=useAction(reload);
  const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[ver,setVer]=useState(null);
  const [existencias]=useApiList(ver?`/existencias?almacenId=${ver.id}`:null);
  const save=async e=>{e.preventDefault();const ok=editing?await run(`/almacenes/${editing.id}`,{method:'PUT',body:{...form,_version:editing._version}},'Almacén actualizado.'):await run('/almacenes',{body:form},'Almacén creado.');if(ok){setForm(empty);setEditing(null);}};
  return <div className="space-y-6">
    <Header modulo="Inventario" title="Almacenes y ubicaciones" subtitle="Inventario del taller, la tienda y cualquier otro almacén que se agregue."/>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{almacenes.map(a=><button key={a.id} onClick={()=>setVer(a)} className={`rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${ver?.id===a.id?'border-emerald-500':'border-gray-200'}`}>
      <div className="flex items-start justify-between"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Warehouse size={20}/></div><Badge value={a.activo?'Activo':'Inactivo'}/></div>
      <p className="mt-3 text-xs font-semibold text-gray-400">{a.codigo} · {a.tipo}</p><p className="font-bold text-gray-900">{a.nombre}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin size={12}/>{a.ubicacion||'—'}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs"><span><Package size={12} className="inline"/> {a.articulos} art.</span><span><Boxes size={12} className="inline"/> {num(a.unidades)}</span><span>{money(a.valor)}</span></div></button>)}</div>
    <Notice notice={notice}/>
    {ver&&<Section title={`Existencias en ${ver.nombre}`} actions={<button className={buttonLight} onClick={()=>setVer(null)}>Cerrar</button>}>
      <Table headers={['Artículo','Tipo','Lote','Cantidad','Mínimo en almacén','Valor']} empty={existencias.length?null:'Sin existencias en este almacén.'}>
        {existencias.map(e=><tr key={e.id}><Cell>{e.codigo} · {e.articulo}</Cell><Cell>{e.tipo}</Cell><Cell>{e.lote||'Sin lote'}</Cell><Cell>{num(e.cantidad,3)} {e.unidad}</Cell><Cell>{e.minimo_almacen||'—'}</Cell><Cell>{money(e.valor)}</Cell></tr>)}
      </Table></Section>}
    {editable&&<Section title={editing?`Editar ${editing.codigo}`:'Nuevo almacén'}><form onSubmit={save} className="grid gap-4 md:grid-cols-3">
      <Field label="Código"><input required className={input} value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})}/></Field>
      <Field label="Nombre"><input required className={input} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></Field>
      <Field label="Tipo"><select className={input} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>{['Taller','Tienda','Bodega','Otro'].map(x=><option key={x}>{x}</option>)}</select></Field>
      <Field label="Ubicación"><input className={input} value={form.ubicacion} onChange={e=>setForm({...form,ubicacion:e.target.value})}/></Field>
      <Field label="Responsable"><input className={input} value={form.responsable} onChange={e=>setForm({...form,responsable:e.target.value})}/></Field>
      <Field label="Estado"><select className={input} value={form.activo?'1':'0'} onChange={e=>setForm({...form,activo:e.target.value==='1'})}><option value="1">Activo</option><option value="0">Inactivo</option></select></Field>
      <Field label="Descripción" className="md:col-span-2"><input className={input} value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}/></Field>
      <div className="flex items-end gap-2"><button className={button} disabled={busy}>{editing?'Guardar cambios':'Crear almacén'}</button>{editing&&<button type="button" className={buttonLight} onClick={()=>{setEditing(null);setForm(empty)}}>Cancelar</button>}</div>
    </form></Section>}
    <Section title="Almacenes registrados"><Table headers={['Código','Nombre','Tipo','Ubicación','Responsable','Artículos','Valor','Estado','']}>
      {almacenes.map(a=><tr key={a.id}><Cell>{a.codigo}</Cell><Cell>{a.nombre}</Cell><Cell>{a.tipo}</Cell><Cell>{a.ubicacion}</Cell><Cell>{a.responsable||'—'}</Cell><Cell>{a.articulos}</Cell><Cell>{money(a.valor)}</Cell><Cell><Badge value={a.activo?'Activo':'Inactivo'}/></Cell>
        <Cell>{editable&&<button className={buttonLight} onClick={()=>{setEditing(a);setForm({codigo:a.codigo,nombre:a.nombre,ubicacion:a.ubicacion,tipo:a.tipo,responsable:a.responsable,descripcion:a.descripcion,activo:a.activo})}}>Editar</button>}</Cell></tr>)}
    </Table></Section>
  </div>;
}
