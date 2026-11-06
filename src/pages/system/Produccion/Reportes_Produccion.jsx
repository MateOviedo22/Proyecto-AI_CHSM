import {useState} from 'react';
import {useApiRead} from '../../../hooks/useApiRead';
import {Header,Section,Table,Cell,Badge,Stat,buttonLight,money,num,fecha,imprimir} from '../../../components/erp/Erp';
import {Barras,BarrasComparadas,Estadistica,Periodo,qs,exportarCSV} from '../../../components/erp/Graficos';
// Reportes de producción: planificado vs. real, cumplimiento, calidad, consumo de materiales y desperdicio.
export default function Reportes_Produccion(){
  const [periodo,setPeriodo]=useState({desde:'',hasta:''});
  const p=useApiRead(`/reportes/produccion${qs(periodo)}`), c=useApiRead(`/reportes/consumo-materiales${qs(periodo)}`);
  const r=p.resumen||{}, rc=c.resumen||{};
  return <div className="space-y-6">
    <Header modulo="Producción" title="Reportes de producción" subtitle="Comparación entre lo planificado y lo realmente elaborado, con resultados estadísticos."><button className={buttonLight} onClick={imprimir}>Imprimir</button><button className={buttonLight} onClick={()=>exportarCSV('produccion_ordenes',p.ordenes||[])}>Exportar CSV</button></Header>
    <Periodo valor={periodo} onChange={setPeriodo}/>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Planificado / aprobado" value={`${num(r.planificado)} / ${num(r.aprobado)}`} hint={`${r.ordenes||0} órdenes · ${r.fueraDePlan||0} fuera de plan`}/>
      <Stat label="Cumplimiento" value={`${num(r.cumplimientoPct)}%`} hint="Aprobado en calidad / planificado"/>
      <Stat label="Tasa de rechazo" value={`${num(r.rechazoPct)}%`} hint={`${num(r.rechazado)} unidades rechazadas`}/>
      <Stat label="Costo de desperdicio" value={money(rc.costoDesperdicio)} hint={`de ${money(rc.costoReal)} en materiales consumidos`}/>
    </div>
    <Section title="Planificado vs. aprobado por producto"><BarrasComparadas data={p.productos} x="nombre" plan="planificado" real="aprobado" nombreReal="Aprobado en calidad"/>
      <Table headers={['Producto','Planificado','Producido','Aprobado','Rechazado','Cumplimiento','Rechazo']} min={700}>{(p.productos||[]).map(x=><tr key={x.codigo}><Cell>{x.codigo} · {x.nombre}</Cell><Cell>{x.planificado}</Cell><Cell>{x.producido}</Cell><Cell>{x.aprobado}</Cell><Cell>{x.rechazado}</Cell><Cell>{x.cumplimientoPct}%</Cell><Cell>{x.rechazoPct}%</Cell></tr>)}</Table></Section>
    <Section title="Resultados estadísticos"><div className="grid gap-3 md:grid-cols-3">
      <Estadistica titulo="Cumplimiento por orden" e={p.estadisticas?.cumplimientoPorOrden} unidad="%"/><Estadistica titulo="Rechazo por orden" e={p.estadisticas?.rechazoPorOrden} unidad="%"/><Estadistica titulo="Tiempo de ciclo (horas, inicio → cierre)" e={p.estadisticas?.horasDeCiclo}/>
      <Estadistica titulo="Desperdicio por orden (% del costo)" e={c.estadisticas?.desperdicioPctPorOrden} unidad="%"/><Estadistica titulo="Desviación real vs. ficha por material" e={c.estadisticas?.desviacionPctPorMaterial} unidad="%"/></div></Section>
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Cumplimiento de planes"><Table headers={['Plan','Periodo','Planificado','Aprobado','Cumplimiento']} min={480} empty={p.planes?.length?null:'Sin planes autorizados en el periodo.'}>{(p.planes||[]).map(x=><tr key={x.id}><Cell>{x.id}</Cell><Cell>{fecha(x.inicio)} – {fecha(x.fin)}</Cell><Cell>{x.planificado}</Cell><Cell>{x.aprobado}</Cell><Cell>{x.cumplimientoPct}%</Cell></tr>)}</Table></Section>
      <Section title="Unidades producidas por semana y línea"><Barras data={(p.lineas||[]).map(x=>({...x,etiqueta:`${fecha(x.semana)} · ${x.linea}`}))} x="etiqueta" y="unidades" nombre="Unidades"/></Section>
    </div>
    <Section title="Consumo de materiales: teórico vs. real"><Table headers={['Material','Teórico (ficha)','Entregado','Devuelto','Consumo real','Desviación','Desperdicio','Costo desperdicio']} min={900} empty={c.materiales?.length?null:'Sin órdenes cerradas en el periodo.'}>
      {(c.materiales||[]).map(m=><tr key={m.codigo}><Cell>{m.nombre}</Cell><Cell>{num(m.teorico,3)} {m.unidad}</Cell><Cell>{num(m.entregado,3)}</Cell><Cell>{num(m.devuelto,3)}</Cell><Cell>{num(m.real,3)}</Cell><Cell>{m.desviacionPct}%</Cell><Cell>{num(m.desperdicio,3)}</Cell><Cell>{money(m.costo_desperdicio)}</Cell></tr>)}</Table></Section>
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Defectos de calidad (unidades rechazadas)"><Barras data={c.defectos} x="defecto" y="unidades" nombre="Unidades rechazadas"/></Section>
      <Section title="Órdenes del periodo"><Table headers={['Orden','Línea','Plan.','Aprob.','Cumpl.','Estado']} min={480}>{(p.ordenes||[]).map(o=><tr key={o.id}><Cell>{o.id}</Cell><Cell>{o.linea||'—'}</Cell><Cell>{o.planificado}</Cell><Cell>{o.aprobado}</Cell><Cell>{o.cumplimientoPct}%</Cell><Cell><Badge value={o.estado}/></Cell></tr>)}</Table></Section>
    </div>
  </div>;
}
