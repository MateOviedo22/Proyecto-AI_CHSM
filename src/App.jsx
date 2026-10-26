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
            <Route path="produccion/productos-terminados" element={< Producto_terminados/>} />
            <Route path="produccion/reportes" element={< Reportes_Produccion/>} />
            {/* FIN */}

            {/* Inventario SubMODULES */}
            <Route path="inventario" element={< PanelInventario />} />
            <Route path="inventario/catalogo" element={< Catalogo_Inventario/>} />
            <Route path="inventario/materiales" element={< Catalogo_Materiales/>} />
            <Route path="inventario/informes" element={< InformesInventario/>} />
            <Route path="inventario/almacenes" element={<Almacenes_Ubicaciones/>} />
            <Route path="inventario/reposiciones" element={< Reposicion_Alertas/>} />
            <Route path="inventario/traslados" element={<Traslados/>} />
            <Route path="inventario/trazabilidad" element={< Trazabilidad/>} />



            {/* FIN */}


          </Route>

        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
