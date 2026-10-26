import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/system/DashboardPage';
import CrmPage from './pages/system/CrmPage';
import ProductionPage from './pages/system/ProductionPage';
import InventoryPage from './pages/system/InventoryPage';
import SalesPage from './pages/system/SalesPage';
import FinancePage from './pages/system/FinancePage';
import HrPage from './pages/system/HrPage';

// MODULOS DE PRUEBA NUEVOS
//Modulos de CRM
import PanelCRM from './pages/system/CRM/PanelCRM';
import Clientes from './pages/system/CRM/Clientes';
import HistorialCRM from './pages/system/CRM/HistorialCRM';
import Segmentacion from './pages/system/CRM/SegmentacionClientes';
import ReportesCRM from './pages/system/CRM/ReportesCRM';

//Modulos de Produccion
import Etapas_Procesos from './pages/system/Produccion/Etapas_Procesos';
import Fichas_Tecnicas from './pages/system/Produccion/Fichas_Tecnicas';
import Materiales from './pages/system/Produccion/Materiales';
import Ordenes_Produccion from './pages/system/Produccion/Ordenes_Produccion';
import PanelProduccion from './pages/system/Produccion/PanelProduccion';
import Planificacion from './pages/system/Produccion/Planificación';
import Producto_terminados from './pages/system/Produccion/Productos_Terminados';
import Reportes_Produccion from './pages/system/Produccion/Reportes_Produccion';

//Modulos de Invenario
import PanelInventario from './pages/system/Inventario/PanelInventario';
import Catalogo_Inventario from './pages/system/Inventario/Catalogo_Inventario';
import Catalogo_Materiales from './pages/system/Inventario/Catalogo_Materiales';
import Almacenes_Ubicaciones from './pages/system/Inventario/Almacenes_Ubicaciones';
import InformesInventario from './pages/system/Inventario/InformesInventario';
import Reposicion_Alertas from './pages/system/Inventario/Reposicion_Alertas';
import Traslados from './pages/system/Inventario/Traslados';
import Trazabilidad from './pages/system/Inventario/Trazabilidad';


//Modulos de Ventas
import PanelVentas from './pages/system/Ventas/PanelVentas';
import Cotizaciones from './pages/system/Ventas/Cotizaciones';
import OrdenesVentas from './pages/system/Ventas/OrdenesVenta';
import Precios_Promociones from './pages/system/Ventas/Precios_Promociones';
import PuntodeVenta from './pages/system/Ventas/PuntodeVenta';
import Reportes_Ventas from './pages/system/Ventas/Reportes_Ventas';
import Cambios_Devoluciones from './pages/system/Ventas/Cambios_Devoluciones';
import CatalogoVentas from './pages/system/Ventas/CatalogoVentas';


//Modulos de Finanzas
import CuentasxCobrar from './pages/system/Finanzas/CuentasxCobrar';
import CuentasxPagar from './pages/system/Finanzas/CuentasxPagar';
import Gastos from './pages/system/Finanzas/Gastos';
import Informes_Finanzas from './pages/system/Finanzas/Informes_Finanzas';
import Ingresos from './pages/system/Finanzas/Ingresos';
import Panel_Finanzas from './pages/system/Finanzas/Panel_Finanzas';

//Modulos RRHH
import Panel_RRHH from './pages/system/RRHH/Panel_RRHH';
import Empleados from './pages/system/RRHH/Empleados';
import Areas_Puestos from './pages/system/RRHH/Areas_Puestos';
import Asistencias_Horiario from './pages/system/RRHH/Asistencias_Horiario';
import Permisos_Ausencias from './pages/system/RRHH/Permisos_Ausencias';
import Reportes_Empleados from './pages/system/RRHH/Reportes_Empleados';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/sistema" element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="crm" element={<CrmPage />} />
            <Route path="produccion" element={<ProductionPage />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="ventas" element={<SalesPage />} />
            <Route path="finanzas" element={<FinancePage />} />
            <Route path="rrhh" element={<HrPage />} />

            {/* MODULOS NUEVOS DE PRUEBA, LUEGO INTEGRAR DE FORMA ADECUADA */}
            {/* CRM SubMODULES */}
            <Route path="crm/Dash" element={<PanelCRM />} />
            <Route path="crm/clientes" element={<Clientes />} />
            <Route path="crm/historial" element={<HistorialCRM />} />
            <Route path="crm/segmentacion" element={< Segmentacion />} />
            <Route path="crm/reportes" element={< ReportesCRM />} />


            {/* Produccion SubMODULES */}
            <Route path="produccion/etapas" element={<Etapas_Procesos />} />
            <Route path="produccion/fichas-tecnicas" element={<Fichas_Tecnicas />} />
            <Route path="produccion/materiales" element={<Materiales />} />
            <Route path="produccion/ordenes-produccion" element={<Ordenes_Produccion />} />
            <Route path="produccion/panel" element={< PanelProduccion />} />
            <Route path="produccion/planificacion" element={< Planificacion />} />
            <Route path="produccion/productos-terminados" element={< Producto_terminados />} />
            <Route path="produccion/reportes" element={< Reportes_Produccion />} />
            {/* FIN */}

            {/* Inventario SubMODULES */}
            <Route path="inventario" element={< PanelInventario />} />
            <Route path="inventario/catalogo" element={< Catalogo_Inventario />} />
            <Route path="inventario/materiales" element={< Catalogo_Materiales />} />
            <Route path="inventario/informes" element={< InformesInventario />} />
            <Route path="inventario/almacenes" element={<Almacenes_Ubicaciones />} />
            <Route path="inventario/reposiciones" element={< Reposicion_Alertas />} />
            <Route path="inventario/traslados" element={<Traslados />} />
            <Route path="inventario/trazabilidad" element={< Trazabilidad />} />
            {/* FIN */}


            {/* Ventas SubMODULES */}
            <Route path="ventas" element={< PanelVentas />} />
            <Route path="ventas/cotizaciones" element={< Cotizaciones />} />
            <Route path="ventas/ordenes-venta" element={<OrdenesVentas />} />
            <Route path="ventas/promociones" element={< Precios_Promociones />} />
            <Route path="ventas/punto-venta" element={< PuntodeVenta />} />
            <Route path="ventas/reportes" element={<Reportes_Ventas />} />
            <Route path="ventas/devoluciones" element={< Cambios_Devoluciones />} />
            <Route path="ventas/catalogo" element={< CatalogoVentas />} />
            {/* FIN */}

            {/* Finanzas SubMODULES */}
            <Route path="finanzas" element={< Panel_Finanzas />} />
            <Route path="finanzas/cobros" element={< CuentasxCobrar />} />
            <Route path="finanzas/pagos" element={<CuentasxPagar />} />
            <Route path="finanzas/gastos" element={< Gastos />} />
            <Route path="finanzas/informes" element={< Informes_Finanzas />} />
            <Route path="finanzas/ingresos" element={<Ingresos />} />
            {/* FIN */}

            {/* RRHH SubMODULES */}

            <Route path="rrhh" element={<Panel_RRHH />} />
            <Route path="rrhh/empleados" element={<Empleados />} />
            <Route path="rrhh/areas-puestos" element={<Areas_Puestos />} />
            <Route path="rrhh/asistencias-horario" element={<Asistencias_Horiario />} />
            <Route path="rrhh/permisos-ausencias" element={<Permisos_Ausencias />} />
            <Route path="rrhh/reportes" element={<Reportes_Empleados />} />
            {/* FIN */}

          </Route>

        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
