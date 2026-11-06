import {Link} from 'react-router-dom';
import {Factory,ClipboardCheck,PackageCheck,AlertTriangle} from 'lucide-react';
import {useApiList} from '../../../hooks/useApiList';
import {Header,Section,Table,Cell,Badge,Stat,fecha} from '../../../components/erp/Erp';
// Panel de producción con datos reales: órdenes por estado, cumplimiento del plan, calidad y requisiciones pendientes.
export default function PanelProduccion(){
  const [ordenes]=useApiList('/produccion/ordenes'); const [planes]=useApiList('/produccion/planes'); const [calidad]=useApiList('/produccion/calidad');
  const activas=ordenes.filter(o=>['Autorizada','En proceso','En calidad'].includes(o.estado));
  const porAutorizar=ordenes.filter(o=>['Borrador','Revisada'].includes(o.estado));
  const reqPend=ordenes.flatMap(o=>o.requisiciones.filter(q=>['Pendiente','Aprobada'].includes(q.estado)).map(q=>({...q,ordenId:o.id})));
  const insp=calidad.reduce((s,c)=>s+c.revisada,0), rech=calidad.reduce((s,c)=>s+c.rechazada,0);
  const plan=planes.find(p=>p.estado==='Autorizado');
  return <div className="space-y-6">
    <Header modulo="Producción" title="Panel de producción" subtitle="Estado real de planes, órdenes, requisiciones y control de calidad."/>
    <div className="grid gap-4 sm:grid-cols-4">
      <Stat label="Órdenes activas" value={activas.length} hint="Autorizadas, en proceso o en calidad"/>
      <Stat label="Por revisar / autorizar" value={porAutorizar.length}/>
      <Stat label="Unidades aprobadas" value={ordenes.reduce((s,o)=>s+o.totalAprobado,0)} hint={`${ordenes.reduce((s,o)=>s+o.totalProducido,0)} producidas`}/>
      <Stat label="Tasa de rechazo" value={`${insp?Math.round(rech*1000/insp)/10:0}%`} hint={`${rech} de ${insp} inspeccionadas`}/>
    </div>
    {plan&&<Section title={`Plan vigente ${plan.id} (${fecha(plan.inicio)} – ${fecha(plan.fin)})`} actions={<Link className="text-sm text-emerald-700 underline" to="/sistema/produccion/planificacion">Ver planificación</Link>}>
      <Table headers={['Producto','Planificado','En órdenes','Aprobado','Cumplimiento']}>{plan.detalles.map(d=><tr key={d.id}><Cell>{d.producto}</Cell><Cell>{d.cantidad}</Cell><Cell>{d.ordenado}</Cell><Cell>{d.aprobado}</Cell><Cell><div className="h-2 w-32 rounded bg-gray-100"><div className="h-2 rounded bg-emerald-600" style={{width:`${Math.min(100,d.cumplimientoPct)}%`}}/></div><span className="text-xs">{d.cumplimientoPct}%</span></Cell></tr>)}</Table></Section>}
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title={<span className="flex items-center gap-2"><Factory size={18}/>Órdenes en curso</span>}><Table headers={['Orden','Productos','Avance','Estado']} min={480} empty={activas.length?null:'Sin órdenes en curso.'}>
        {activas.map(o=><tr key={o.id}><Cell>{o.id}<span className="block text-xs text-gray-500">{o.linea||'—'}</span></Cell><Cell>{o.detalles.map(d=>`${d.producto} ${d.producida}/${d.planificada}`).join(', ')}</Cell><Cell>{o.progreso}%</Cell><Cell><Badge value={o.estado}/></Cell></tr>)}</Table></Section>
      <Section title={<span className="flex items-center gap-2"><AlertTriangle size={18}/>Requisiciones por atender</span>}><Table headers={['Requisición','Orden','Tipo','Estado']} min={420} empty={reqPend.length?null:'Sin requisiciones pendientes.'}>
        {reqPend.map(q=><tr key={q.id}><Cell>{q.codigo}</Cell><Cell>{q.ordenId}</Cell><Cell>{q.tipo}</Cell><Cell><Badge value={q.estado}/></Cell></tr>)}</Table></Section>
      <Section title={<span className="flex items-center gap-2"><ClipboardCheck size={18}/>Pendientes de autorización</span>}><Table headers={['Orden','Fecha','Elaboró','Estado']} min={420} empty={porAutorizar.length?null:'Nada pendiente.'}>
        {porAutorizar.map(o=><tr key={o.id}><Cell>{o.id}</Cell><Cell>{fecha(o.fecha)}</Cell><Cell>{o.elaboradoPor}</Cell><Cell><Badge value={o.estado}/></Cell></tr>)}</Table></Section>
      <Section title={<span className="flex items-center gap-2"><PackageCheck size={18}/>Últimas inspecciones</span>}><Table headers={['Fecha','Orden','Producto','Aprob./Rech.']} min={420} empty={calidad.length?null:'Sin inspecciones.'}>
        {calidad.slice(0,8).map(c=><tr key={c.id}><Cell>{fecha(c.fecha)}</Cell><Cell>{c.ordenId}</Cell><Cell>{c.producto}</Cell><Cell>{c.aprobada}/{c.rechazada}</Cell></tr>)}</Table></Section>
    </div>
  </div>;
}
