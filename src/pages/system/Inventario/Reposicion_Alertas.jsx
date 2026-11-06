import {useState} from 'react';
import {AlertTriangle} from 'lucide-react';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {puede} from '../../../utils/permisos';
import {Header,Section,Field,Table,Cell,Badge,Notice,Stat,input,button,buttonLight,num,useAction} from '../../../components/erp/Erp';
// FRQ-0010: alertas de stock mínimo (global y por almacén) con acción de reposición mediante solicitud de compra.
export default function Reposicion_Alertas(){
  const {user}=useAuth();
  const [alertas,reload]=useApiList('/alertas/stock');
  const [almacenes]=useApiList('/almacenes');
  const [materiales]=useApiList('/recursos/materiales');
  const [productos]=useApiList('/recursos/productos');
  const {busy,notice,run}=useAction(reload);
  const [filtro,setFiltro]=useState('Todas'),[search,setSearch]=useState(''),[min,setMin]=useState({almacenId:'',tipo:'material',id:'',minimo:''});
  const lista=alertas.filter(a=>(filtro==='Todas'||a.tipo===filtro)&&`${a.nombre} ${a.codigo}`.toLowerCase().includes(search.toLowerCase()));
  const solicitar=a=>run('/compras/solicitudes',{body:{materialId:a.id,cantidad:Math.max(a.faltante,a.minimo)||1,solicitante:user?.name||'Inventario',area:'Inventario',prioridad:a.nivel==='Crítico'?'Alta':'Media',justificacion:`Reposición por stock mínimo${a.almacen?` en ${a.almacen}`:''}`}},`Solicitud de compra creada para ${a.nombre}.`);
  return <div className="space-y-6">
    <Header modulo="Inventario" title="Reposición y alertas" subtitle="Artículos por debajo de su punto de reorden, en total o en un almacén."/>
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Alertas activas" value={alertas.length}/><Stat label="Críticas (sin existencia)" value={alertas.filter(a=>a.nivel==='Crítico').length}/><Stat label="Materiales a reponer" value={alertas.filter(a=>a.tipo==='Material').length}/></div>
    <Notice notice={notice}/>
    <Section title="Alertas" actions={<div className="flex gap-2"><input className={`${input} w-56`} placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/><select className={`${input} w-40`} value={filtro} onChange={e=>setFiltro(e.target.value)}>{['Todas','Material','Producto'].map(x=><option key={x}>{x}</option>)}</select></div>}>
      <Table headers={['Nivel','Artículo','Tipo','Alcance','Existencia','Mínimo','Faltante','Acción']} empty={lista.length?null:'No hay artículos por debajo del mínimo.'}>
        {lista.map((a,i)=><tr key={i}><Cell><span className={`inline-flex items-center gap-1 text-xs font-semibold ${a.nivel==='Crítico'?'text-red-700':'text-amber-700'}`}><AlertTriangle size={14}/>{a.nivel}</span></Cell><Cell>{a.codigo} · {a.nombre}</Cell><Cell>{a.tipo}</Cell><Cell>{a.almacen||'Total de la empresa'}</Cell><Cell>{num(a.existencia,3)} {a.unidad}</Cell><Cell>{num(a.minimo,3)}</Cell><Cell>{num(a.faltante,3)}</Cell>
          <Cell>{a.tipo==='Material'&&puede(user,'compras','escribir')&&<button className={buttonLight} disabled={busy} onClick={()=>solicitar(a)}>Solicitar compra</button>}{a.tipo==='Producto'&&<span className="text-xs text-gray-500">Planificar producción o traslado</span>}</Cell></tr>)}
      </Table></Section>
    {puede(user,'inventario','escribir')&&<Section title="Mínimo por almacén"><form className="grid gap-3 md:grid-cols-5" onSubmit={async e=>{e.preventDefault();if(await run('/minimos',{method:'PUT',body:{almacenId:Number(min.almacenId),[min.tipo==='material'?'materialId':'productoId']:Number(min.id),minimo:Number(min.minimo)}},'Mínimo guardado.'))setMin({...min,id:'',minimo:''})}}>
      <Field label="Almacén"><select required className={input} value={min.almacenId} onChange={e=>setMin({...min,almacenId:e.target.value})}><option value="">Selecciona...</option>{almacenes.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field>
      <Field label="Tipo"><select className={input} value={min.tipo} onChange={e=>setMin({...min,tipo:e.target.value,id:''})}><option value="material">Material</option><option value="producto">Producto</option></select></Field>
      <Field label="Artículo"><select required className={input} value={min.id} onChange={e=>setMin({...min,id:e.target.value})}><option value="">Selecciona...</option>{(min.tipo==='material'?materiales.map(m=>[m.id,m.name]):productos.map(p=>[p.id,p.nombre])).map(([id,n])=><option key={id} value={id}>{n}</option>)}</select></Field>
      <Field label="Mínimo"><input required type="number" min="0" step="0.001" className={input} value={min.minimo} onChange={e=>setMin({...min,minimo:e.target.value})}/></Field>
      <div className="flex items-end"><button className={button} disabled={busy}>Guardar</button></div></form>
      <p className="mt-2 text-xs text-gray-500">El mínimo global de cada artículo se configura en su ficha del catálogo.</p></Section>}
  </div>;
}
