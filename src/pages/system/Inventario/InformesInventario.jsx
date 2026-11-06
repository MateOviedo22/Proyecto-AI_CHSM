import {useMemo,useState} from 'react';
import {useApiRead} from '../../../hooks/useApiRead';
import {Header,Section,Table,Cell,Stat,input,buttonLight,money,num,imprimir} from '../../../components/erp/Erp';
import {Barras,Estadistica,Periodo,qs,exportarCSV} from '../../../components/erp/Graficos';
// Informe final de inventario: valor por almacén, existencias por artículo y almacén, rotación, cobertura y traslados.
export default function InformesInventario(){
  const [periodo,setPeriodo]=useState({desde:'',hasta:''}),[tipo,setTipo]=useState('Todos'),[estado,setEstado]=useState('Todos');
  const inv=useApiRead(`/reportes/inventario${qs(periodo)}`), tr=useApiRead(`/reportes/traslados${qs(periodo)}`);
  const almacenes=(inv.almacenes||[]).map(a=>a.nombre);
  const arts=useMemo(()=>(inv.articulos||[]).filter(a=>(tipo==='Todos'||a.tipo===tipo)&&(estado==='Todos'||a.estado===estado)),[inv,tipo,estado]);
  const r=inv.resumen||{}, t=tr.resumen||{};
  return <div className="space-y-6">
    <Header modulo="Inventario" title="Informe final de inventario" subtitle="Existencias valoradas por almacén y artículo, con rotación y días de cobertura del periodo."><button className={buttonLight} onClick={imprimir}>Imprimir</button><button className={buttonLight} onClick={()=>exportarCSV('informe_inventario',arts.map(({por_almacen,porAlmacen,...a})=>({...a,...porAlmacen})))}>Exportar CSV</button></Header>
    <Periodo valor={periodo} onChange={setPeriodo}/>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Valor del inventario" value={money(r.valorTotal)} hint="Materiales al costo promedio, productos a precio de venta"/><Stat label="Artículos" value={r.articulos||0}/><Stat label="Bajo mínimo o agotados" value={r.bajoMinimo||0}/><Stat label="Traslados con diferencias" value={`${t.conDiferencias||0} de ${t.recibidos||0}`} hint={`Diferencia ${num(t.diferenciaPct)}% de lo enviado`}/></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Valor por almacén"><Barras data={inv.almacenes} x="nombre" y="valor" nombre="Valor" formato={v=>money(v)}/>
        <Table headers={['Almacén','Tipo','Unidades','Lotes','Valor']} min={420}>{(inv.almacenes||[]).map(a=><tr key={a.id}><Cell>{a.nombre}</Cell><Cell>{a.tipo}</Cell><Cell>{num(a.unidades)}</Cell><Cell>{a.lotes}</Cell><Cell>{money(a.valor)}</Cell></tr>)}</Table></Section>
      <Section title="Resultados estadísticos"><div className="grid gap-3"><Estadistica titulo="Rotación (salidas / existencia)" e={inv.estadisticas?.rotacion}/><Estadistica titulo="Días de cobertura" e={inv.estadisticas?.coberturaDias} unidad=" d"/><Estadistica titulo="Horas en tránsito de los traslados" e={tr.estadisticas?.horasEnTransito} unidad=" h"/></div></Section>
    </div>
    <Section title="Existencias por artículo y almacén" actions={<div className="flex gap-2"><select className={`${input} w-36`} value={tipo} onChange={e=>setTipo(e.target.value)}>{['Todos','Material','Producto'].map(x=><option key={x}>{x}</option>)}</select><select className={`${input} w-40`} value={estado} onChange={e=>setEstado(e.target.value)}>{['Todos','Normal','Bajo mínimo','Agotado'].map(x=><option key={x}>{x}</option>)}</select></div>}>
      <Table headers={['Artículo','Tipo',...almacenes,'Total','Mínimo','Entradas','Salidas','Rotación','Cobertura','Valor','Estado']} min={1200}>
        {arts.map(a=><tr key={`${a.tipo}-${a.id}`}><Cell>{a.codigo} · {a.nombre}</Cell><Cell>{a.tipo}</Cell>{almacenes.map(n=><Cell key={n}>{a.porAlmacen[n]?num(a.porAlmacen[n],3):'—'}</Cell>)}<Cell className="font-semibold">{num(a.existencia,3)} {a.unidad}</Cell><Cell>{num(a.minimo)}</Cell><Cell>{num(a.entradas,3)}</Cell><Cell>{num(a.salidas,3)}</Cell><Cell>{a.rotacion??'—'}</Cell><Cell>{a.coberturaDias===null?'—':`${a.coberturaDias} d`}</Cell><Cell>{money(a.valor)}</Cell><Cell className={a.estado==='Normal'?'':'font-semibold text-red-700'}>{a.estado}</Cell></tr>)}</Table></Section>
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Movimientos del periodo por tipo"><Table headers={['Tipo','Movimientos','Unidades']} min={360}>{(inv.movimientos||[]).map(m=><tr key={m.tipo}><Cell>{m.tipo}</Cell><Cell>{m.n}</Cell><Cell>{num(m.unidades,3)}</Cell></tr>)}</Table></Section>
      <Section title="Traslados del periodo"><div className="grid gap-4 sm:grid-cols-2">
        <Table headers={['Motivo','Traslados']} min={240}>{(tr.porMotivo||[]).map(x=><tr key={x.nombre}><Cell>{x.nombre}</Cell><Cell>{x.n}</Cell></tr>)}</Table>
        <Table headers={['Ruta','Traslados']} min={240}>{(tr.porRuta||[]).map(x=><tr key={x.nombre}><Cell>{x.nombre}</Cell><Cell>{x.n}</Cell></tr>)}</Table></div>
        <p className="mt-2 text-xs text-gray-500">Enviado {num(t.unidadesEnviadas)} · recibido {num(t.unidadesRecibidas)} · {(tr.porEstado||[]).map(x=>`${x.nombre}: ${x.n}`).join(' · ')}</p></Section>
    </div>
  </div>;
}
