import {useEffect,useState} from 'react';
import {Outlet,useLocation} from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import {Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {puedeRuta} from '../../utils/permisos';
const connected=new Set([
  '/sistema/crm','/sistema/crm/Dash','/sistema/crm/clientes','/sistema/crm/historial','/sistema/crm/segmentacion','/sistema/compras/proveedores','/sistema/compras','/sistema/compras/solicitudes','/sistema/compras/ordenes','/sistema/compras/recepcion',
  '/sistema/inventario','/sistema/inventario/materiales','/sistema/inventario/catalogo','/sistema/inventario/trazabilidad','/sistema/ventas/punto-venta','/sistema/ventas/catalogo','/sistema/ventas/promociones','/sistema/ventas/cotizaciones','/sistema/ventas/ordenes-venta',
  '/sistema/produccion/panel','/sistema/produccion/ordenes-produccion', '/sistema/ventas','/sistema/ventas/reportes','/sistema/finanzas','/sistema/finanzas/informes','/sistema/rrhh','/sistema/rrhh/reportes',
  '/sistema/finanzas/ingresos','/sistema/finanzas/gastos','/sistema/finanzas/cobros','/sistema/finanzas/pagos',
  '/sistema/rrhh/empleados','/sistema/rrhh/areas-puestos','/sistema/rrhh/asistencias-horario','/sistema/rrhh/permisos-ausencias',
  '/sistema/admin/usuarios','/sistema/crm/reportes','/sistema/dashboard','/sistema/produccion/reportes','/sistema/inventario/informes','/sistema/compras/reportes','/sistema/ventas/devoluciones','/sistema/inventario/traslados','/sistema/produccion/planificacion','/sistema/produccion/materiales','/sistema/produccion/productos-terminados','/sistema/compras/devoluciones','/sistema/inventario/almacenes','/sistema/inventario/reposiciones','/sistema/produccion/fichas-tecnicas','/sistema/produccion/etapas','/sistema/admin/roles','/sistema/admin/seguridad'
]);
export default function AppShell(){
  const [menuOpen,setMenuOpen]=useState(false),[error,setError]=useState('');
  const {pathname}=useLocation();
  const {user}=useAuth(); const permitido=puedeRuta(user,pathname);
  useEffect(()=>{const handler=e=>setError(e.detail);window.addEventListener('sunshine-error',handler);return ()=>window.removeEventListener('sunshine-error',handler)},[]);
  useEffect(()=>setError(''),[pathname]);
  return <div className="flex min-h-screen bg-canvas">
    <Sidebar open={menuOpen} onClose={()=>setMenuOpen(false)}/>
    <div className="flex min-w-0 flex-1 flex-col"><Topbar onMenu={()=>setMenuOpen(true)}/>
      {error && <div role="alert" className="print:hidden flex justify-between bg-red-100 px-5 py-3 text-sm text-red-900"><span>{error}</span><button onClick={()=>setError('')}>Cerrar</button></div>}
      {permitido && !connected.has(pathname) && <div role="status" className="print:hidden bg-amber-100 px-5 py-3 text-sm text-amber-900"><strong>Pantalla de demostración:</strong> sus datos y acciones aún no están conectados a la base de datos. Consulta el README para conocer el alcance.</div>}
      <main className="flex-1 p-4 sm:p-8 print:p-0">{permitido?<Outlet/>:<div role="alert" className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-gray-900">Sin acceso a esta sección</h1><p className="mt-2 text-sm text-gray-600">Tu rol no tiene permiso para este módulo. Si lo necesitas, solicita a administración que ajuste tu rol.</p><Link to="/sistema/dashboard" className="mt-4 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Ir al dashboard</Link></div>}</main>
    </div>
  </div>;
}
