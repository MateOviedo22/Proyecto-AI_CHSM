import { Link } from 'react-router-dom';
import { Bell, CircleUserRound, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-300 bg-gray-100 px-4 sm:px-6">
      <button onClick={onMenu} className="rounded p-2 hover:bg-black/5 lg:hidden" aria-label="Abrir menú"><Menu size={20} /></button>
      <div className="ml-auto flex items-center gap-4">
        <Link to="/" className="hidden text-sm text-gray-700 underline transition hover:text-sun sm:block">Ver sitio web</Link>
        <button className="rounded-full p-2 transition hover:bg-black/5" aria-label="Notificaciones"><Bell size={18} /></button>
        <div className="flex items-center gap-3 border-l border-gray-400 pl-4">
          <CircleUserRound size={36} strokeWidth={1.2} aria-hidden="true" />
          <div className="hidden text-xs sm:block">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-gray-600">{user?.role}</p>
          </div>
          <button onClick={logout} className="rounded p-2 transition hover:bg-black/5" aria-label="Cerrar sesión"><LogOut size={16} /></button>
        </div>
      </div>
    </header>
  );
}
