import {useEffect,useState} from 'react';
import {Outlet,useLocation} from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
const connected=new Set([
  '/sistema/crm','/sistema/crm/Dash','/sistema/crm/clientes','/sistema/crm/historial','/sistema/crm/segmentacion','/sistema/compras/proveedores','/sistema/compras','/sistema/compras/solicitudes','/sistema/compras/ordenes','/sistema/compras/recepcion',
  '/sistema/inventario','/sistema/inventario/materiales','/sistema/inventario/catalogo','/sistema/inventario/trazabilidad','/sistema/ventas/punto-venta','/sistema/ventas/catalogo','/sistema/ventas/promociones','/sistema/ventas/cotizaciones','/sistema/ventas/ordenes-venta',
  '/sistema/produccion/panel','/sistema/produccion/ordenes-produccion', '/sistema/ventas','/sistema/ventas/reportes','/sistema/finanzas','/sistema/finanzas/informes','/sistema/rrhh','/sistema/rrhh/reportes',
  '/sistema/finanzas/ingresos','/sistema/finanzas/gastos','/sistema/finanzas/cobros','/sistema/finanzas/pagos',
  '/sistema/rrhh/empleados','/sistema/rrhh/areas-puestos','/sistema/rrhh/asistencias-horario','/sistema/rrhh/permisos-ausencias',
  '/sistema/admin/usuarios','/sistema/produccion/fichas-tecnicas','/sistema/produccion/etapas','/sistema/admin/roles','/sistema/admin/seguridad'
]);
export default function AppShell(){
  const [menuOpen,setMenuOpen]=useState(false),[error,setError]=useState('');
  const {pathname}=useLocation();
  useEffect(()=>{const handler=e=>setError(e.detail);window.addEventListener('sunshine-error',handler);return ()=>window.removeEventListener('sunshine-error',handler)},[]);
  useEffect(()=>setError(''),[pathname]);
  return <div className="flex min-h-screen bg-canvas">
    <Sidebar open={menuOpen} onClose={()=>setMenuOpen(false)}/>
    <div className="flex min-w-0 flex-1 flex-col"><Topbar onMenu={()=>setMenuOpen(true)}/>
      {error && <div role="alert" className="print:hidden flex justify-between bg-red-100 px-5 py-3 text-sm text-red-900"><span>{error}</span><button onClick={()=>setError('')}>Cerrar</button></div>}
      {!connected.has(pathname) && <div role="status" className="print:hidden bg-amber-100 px-5 py-3 text-sm text-amber-900"><strong>Pantalla de demostración:</strong> sus datos y acciones aún no están conectados a la base de datos. Consulta el README para conocer el alcance.</div>}
      <main className="flex-1 p-4 sm:p-8 print:p-0"><Outlet/></main>
    </div>
  </div>;
}
