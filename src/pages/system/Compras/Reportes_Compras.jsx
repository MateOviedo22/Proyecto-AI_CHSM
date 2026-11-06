import {useState} from 'react';
import {useApiRead} from '../../../hooks/useApiRead';
import {Header,Section,Table,Cell,Stat,buttonLight,money,num,imprimir} from '../../../components/erp/Erp';
import {Barras,Estadistica,Periodo,qs,exportarCSV} from '../../../components/erp/Graficos';
// Compras y desempeño de proveedores (FRQ-0009): montos, puntualidad (SLA), tiempos de entrega, devoluciones y reclamos.
export default function Reportes_Compras(){
  const [periodo,setPeriodo]=useState({desde:'',hasta:''});
  const d=useApiRead(`/reportes/compras-proveedores${qs(periodo)}`); const r=d.resumen||{};
  const proveedores=(d.proveedores||[]).slice().sort((a,b)=>(b.puntaje??-1)-(a.puntaje??-1));
  return <div className="space-y-6">
    <Header modulo="Compras" title="Reportes de compras y proveedores" subtitle="Evaluación de proveedores con datos de órdenes, recepciones, devoluciones y reclamos."><button className={buttonLight} onClick={imprimir}>Imprimir</button><button className={buttonLight} onClick={()=>exportarCSV('desempeno_proveedores',proveedores.map(({tiempoEntrega,...p})=>({...p,tiempoEntregaPromedio:tiempoEntrega.promedio})))}>Exportar CSV</button></Header>
    <Periodo valor={periodo} onChange={setPeriodo}/>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Monto comprado" value={money(r.montoTotal)}/><Stat label="Órdenes" value={r.ordenes||0}/><Stat label="Recepciones" value={r.recepciones||0}/><Stat label="Reclamos abiertos" value={r.reclamosAbiertos||0}/></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Compras por mes"><Barras data={d.mensual} x="mes" y="monto" nombre="Monto" formato={v=>money(v)}/></Section>
      <Section title="Resultados estadísticos"><div className="grid gap-3"><Estadistica titulo="Tiempo de entrega (días desde la orden)" e={d.estadisticas?.tiempoEntregaDias} unidad=" d"/><Estadistica titulo="Puntualidad por proveedor" e={d.estadisticas?.puntualidadPct} unidad="%"/><Estadistica titulo="Puntaje de proveedores (0–100)" e={d.estadisticas?.puntaje}/></div></Section>
    </div>
    <Section title="Desempeño de proveedores"><Table headers={['Proveedor','Condiciones','Órdenes','Monto','Recepciones','A tiempo','Entrega prom.','Devuelto','Reclamos','Puntaje']} min={1100}>
      {proveedores.map(p=><tr key={p.id}><Cell>{p.nombre}<span className="block text-xs text-gray-500">{p.razonSocial}</span></Cell><Cell>{p.condicionesPago}</Cell><Cell>{p.ordenes}</Cell><Cell>{money(p.monto)}</Cell><Cell>{p.recepciones}</Cell><Cell>{p.puntualidadPct===null?'—':`${p.puntualidadPct}%`}</Cell><Cell>{p.tiempoEntrega.n?`${num(p.tiempoEntrega.promedio,1)} d`:'—'}</Cell><Cell>{money(p.devuelto)} ({p.devolucionPct}%)</Cell><Cell>{p.reclamos}{p.reclamosAbiertos?` (${p.reclamosAbiertos} abiertos)`:''}</Cell>
        <Cell>{p.puntaje===null?'—':<span className={`font-semibold ${p.puntaje>=80?'text-emerald-700':p.puntaje>=60?'text-amber-700':'text-red-700'}`}>{p.puntaje}</span>}</Cell></tr>)}</Table>
      <p className="mt-2 text-xs text-gray-500">Puntaje = 60% puntualidad + 25% calidad (sin devoluciones) + 15% sin reclamos. Solo se calcula para proveedores con recepciones en el periodo.</p></Section>
  </div>;
}
