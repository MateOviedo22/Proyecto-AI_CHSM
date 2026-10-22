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
import PanelCRM from './pages/system/CRM/PanelCRM';
import Clientes from './pages/system/CRM/Clientes';
import HistorialCRM from './pages/system/CRM/HistorialCRM';
import Segmentacion from './pages/system/CRM/SegmentacionClientes';
import ReportesCRM from './pages/system/CRM/ReportesCRM';

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
            <Route path="crm/segmentacion" element={< Segmentacion/>} />            
            <Route path="crm/reportes" element={< ReportesCRM/>} />
            

            {/* Produccion SubMODULES */}
            <Route path="produccion/" element={<PanelCRM />} />
            <Route path="produccion/clientes" element={<Clientes />} />
            <Route path="produccion/historial" element={<HistorialCRM />} />
            <Route path="produccion/segmentacion" element={< Segmentacion/>} />            
            <Route path="produccion/reportes" element={< ReportesCRM/>} />
            {/* FIN */}

            
          </Route>
        
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
