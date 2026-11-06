import { Link } from 'react-router-dom';
import { Bell, CircleUserRound, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROL_LABEL, puede } from '../../utils/permisos';
import { useApiRead } from '../../hooks/useApiRead';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  // FRQ-0010: notificación de alertas de stock mínimo en la barra superior.
  const alertas = useApiRead(puede(user, 'inventario', 'leer') ? '/alertas/stock' : null);
  return (
    <header className="print:hidden flex h-16 items-center justify-between border-b border-gray-300 bg-gray-100 px-4 sm:px-6">
      <button onClick={onMenu} className="rounded p-2 hover:bg-black/5 lg:hidden" aria-label="Abrir menú"><Menu size={20} /></button>
      <div className="ml-auto flex items-center gap-4">
        <Link to="/" className="hidden text-sm text-gray-700 underline transition hover:text-sun sm:block">Ver sitio web</Link>
        <Link to="/sistema/inventario/reposiciones" className="relative rounded-full p-2 transition hover:bg-black/5" aria-label={`Notificaciones: ${Array.isArray(alertas) ? alertas.length : 0} alertas de stock`}><Bell size={18} />{Array.isArray(alertas) && alertas.length > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{alertas.length}</span>}</Link>
        <div className="flex items-center gap-3 border-l border-gray-400 pl-4">
          <CircleUserRound size={36} strokeWidth={1.2} aria-hidden="true" />
          <div className="hidden text-xs sm:block">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-gray-600">{ROL_LABEL[user?.role] || user?.role}</p>
          </div>
          <button onClick={logout} className="rounded p-2 transition hover:bg-black/5" aria-label="Cerrar sesión"><LogOut size={16} /></button>
        </div>
      </div>
    </header>
  );
}
