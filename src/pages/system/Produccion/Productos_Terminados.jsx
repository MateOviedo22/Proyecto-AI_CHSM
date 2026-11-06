import {useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {useApiList} from '../../../hooks/useApiList';
import {Header,Section,Table,Cell,Stat,input,num,fecha,fechaHora} from '../../../components/erp/Erp';
// RF-16..RF-20: historial de control de calidad, lotes de producto terminado ingresados y existencias por almacén.
export default function Productos_Terminados(){
  const [calidad]=useApiList('/produccion/calidad');
  const [lotes]=useApiList('/lotes');
  const [existencias]=useApiList('/existencias?tipo=producto');
  const [search,setSearch]=useState('');
  const producidos=lotes.filter(l=>l.origen==='Producción'&&`${l.codigo} ${l.articulo}`.toLowerCase().includes(search.toLowerCase()));
  const porProducto=useMemo(()=>{const m=new Map();for(const e of existencias){const k=e.articulo;const x=m.get(k)||{articulo:k,codigo:e.codigo,total:0,almacenes:{}};x.total+=e.cantidad;x.almacenes[e.almacen]=(x.almacenes[e.almacen]||0)+e.cantidad;m.set(k,x);}return [...m.values()];},[existencias]);
  const insp=calidad.reduce((s,c)=>s+c.revisada,0), aprob=calidad.reduce((s,c)=>s+c.aprobada,0);
  return <div className="space-y-6">
    <Header modulo="Producción" title="Productos terminados y calidad" subtitle="Solo las unidades aprobadas en control de calidad ingresan al inventario, cada producción con su propio lote."/>
    <div className="grid gap-4 sm:grid-cols-4"><Stat label="Lotes producidos" value={lotes.filter(l=>l.origen==='Producción').length}/><Stat label="Unidades inspeccionadas" value={insp}/><Stat label="Aprobadas" value={aprob} hint={`${insp?Math.round(aprob*1000/insp)/10:0}% de aprobación`}/><Stat label="Rechazadas" value={insp-aprob}/></div>
    <Section title="Existencias de producto terminado por almacén"><Table headers={['Producto','Total','Por almacén']} empty={porProducto.length?null:'Sin existencias.'}>{porProducto.map(p=><tr key={p.articulo}><Cell>{p.codigo} · {p.articulo}</Cell><Cell>{p.total}</Cell><Cell>{Object.entries(p.almacenes).map(([a,c])=>`${a}: ${c}`).join(' · ')}</Cell></tr>)}</Table></Section>
    <Section title="Lotes de producción" actions={<input className={`${input} w-60`} placeholder="Buscar lote o producto" value={search} onChange={e=>setSearch(e.target.value)}/>}>
      <Table headers={['Lote','Producto','Orden','Fecha','Disponible','']} empty={producidos.length?null:'Aún no hay lotes producidos.'}>{producidos.map(l=><tr key={l.id}><Cell>{l.codigo}</Cell><Cell>{l.articulo}</Cell><Cell>{l.referencia}</Cell><Cell>{fecha(l.fecha)}</Cell><Cell>{num(l.disponible)}</Cell><Cell><Link className="text-emerald-700 underline" to={`/sistema/inventario/trazabilidad?lote=${encodeURIComponent(l.codigo)}`}>Trazabilidad</Link></Cell></tr>)}</Table></Section>
    <Section title="Historial de control de calidad"><Table headers={['Fecha','Orden','Producto','Revisadas','Aprobadas','Rechazadas','Defecto / observaciones','Inspector']} min={900} empty={calidad.length?null:'Sin inspecciones registradas.'}>
      {calidad.map(c=><tr key={c.id}><Cell>{fechaHora(c.fecha)}</Cell><Cell>{c.ordenId}</Cell><Cell>{c.producto}</Cell><Cell>{c.revisada}</Cell><Cell>{c.aprobada}</Cell><Cell>{c.rechazada}</Cell><Cell>{[c.defecto,c.observaciones].filter(Boolean).join(' · ')||'—'}</Cell><Cell>{c.inspector}</Cell></tr>)}</Table></Section>
  </div>;
}
