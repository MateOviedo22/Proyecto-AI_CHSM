import {Link} from 'react-router-dom';
import {AlertTriangle} from 'lucide-react';
import {useApiRead} from '../../hooks/useApiRead';
import {useAuth} from '../../context/AuthContext';
import {ROL_LABEL} from '../../utils/permisos';
import {Header,Section,Table,Cell,Badge,Stat,money,num,fecha} from '../../components/erp/Erp';
import {Barras} from '../../components/erp/Graficos';
// FRQ-0011: dashboard operativo con datos reales; cada bloque se muestra según los permisos del rol.
export default function DashboardPage(){
  const {user}=useAuth(); const d=useApiRead('/reportes/dashboard');
  const tiles=[
    d.ventas&&['Ventas de hoy',money(d.ventas.hoy),`${d.ventas.n_hoy} venta(s)`],
    d.ventas&&['Ventas del mes',money(d.ventas.mes),`${d.ventas.n_mes} venta(s)`],
    d.ordenesActivas&&['Órdenes de producción activas',d.ordenesActivas.length,`${d.produccionPorAutorizar} por revisar o autorizar`],
    d.alertasStock&&['Alertas de stock mínimo',d.alertasStock.length,`Inventario valorado en ${money(d.valorInventario)}`],
    d.trasladosPendientes!==undefined&&['Traslados abiertos',d.trasladosPendientes,'Sin recibir'],
    d.comprasAbiertas!==undefined&&['Órdenes de compra abiertas',d.comprasAbiertas,'Borrador, enviadas o parciales'],
    d.ordenesVentaPendientes!==undefined&&['Órdenes de venta por facturar',d.ordenesVentaPendientes,''],
    d.finanzas&&['Resultado del mes',money(d.finanzas.ingresos-d.finanzas.gastos),`Ingresos ${money(d.finanzas.ingresos)} · gastos ${money(d.finanzas.gastos)}`],
  ].filter(Boolean);
  return <div className="space-y-6">
    <Header modulo="Dashboard" title={`Hola, ${user?.name||''}`} subtitle={`Resumen operativo en tiempo real · ${ROL_LABEL[user?.role]||''}`}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tiles.map(([l,v,h])=><Stat key={l} label={l} value={v} hint={h}/>)}</div>
    {d.alertasStock?.length>0&&<section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><p className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle size={18}/>Insumos y productos por debajo del punto de reorden</p>
      <ul className="grid gap-1 sm:grid-cols-2">{d.alertasStock.slice(0,8).map(a=><li key={`${a.tipo}-${a.codigo}`}>{a.existencia===0?'Agotado':'Bajo'}: <b>{a.nombre}</b> ({num(a.existencia)} de mínimo {num(a.minimo)}) · {a.tipo}</li>)}</ul>
      <Link to="/sistema/inventario/reposiciones" className="mt-2 inline-block underline">Ver alertas y solicitar reposición</Link></section>}
    <div className="grid gap-6 lg:grid-cols-2">
      {d.ventasSemanales&&<Section title="Ventas por semana (últimas 8)"><Barras data={d.ventasSemanales.map(x=>({...x,semana:fecha(x.semana)}))} x="semana" y="total" nombre="Ventas" formato={v=>money(v)}/></Section>}
      {d.produccionSemanal&&<Section title="Producción de esta semana por línea"><Barras data={d.produccionSemanal} x="linea" y="unidades" nombre="Unidades producidas"/></Section>}
    </div>
    {d.ordenesActivas&&<Section title="Órdenes de trabajo activas" actions={<Link to="/sistema/produccion/ordenes-produccion" className="text-sm text-emerald-700 underline">Ver órdenes</Link>}>
      <Table headers={['Orden','Productos','Entrega','Avance','Estado']} min={600} empty={d.ordenesActivas.length?null:'No hay órdenes activas.'}>
        {d.ordenesActivas.map(o=><tr key={o.id}><Cell>{o.id}</Cell><Cell>{o.producto}</Cell><Cell>{fecha(o.fecha_entrega)}</Cell><Cell><div className="h-2 w-32 rounded bg-gray-100"><div className="h-2 rounded bg-emerald-600" style={{width:`${o.progreso}%`}}/></div><span className="text-xs">{o.progreso}%</span></Cell><Cell><Badge value={o.estado}/></Cell></tr>)}</Table></Section>}
  </div>;
}
