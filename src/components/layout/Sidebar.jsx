import { NavLink } from 'react-router-dom';
import { Box, Contact, Factory, LayoutDashboard, LineChart, Package, ShoppingCart, Users, X } from 'lucide-react';
import Logo from '../ui/Logo';
import { modules } from '../../data/mockData';

const icons = { LayoutDashboard, Users, Factory, Package, ShoppingCart, LineChart, IdCard: Contact, Box };

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 transform border-r border-gray-300 bg-gray-100 transition-transform duration-200 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-gray-300 px-4">
          <Logo size={36} />
          <button onClick={onClose} className="rounded p-1 hover:bg-black/5 lg:hidden" aria-label="Cerrar menú"><X size={18} /></button>
        </div>
        <nav aria-label="Módulos del sistema" className="py-4">
          <p className="px-4 pb-2 text-xs font-semibold text-yellow-900">MODULOS</p>
          <ul>
            {modules.map(({ key, label, path, icon }) => {
              const Icon = icons[icon];
              return (
                <li key={key}>
                  <NavLink
                    to={path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm transition ${
                        isActive ? 'border-brand bg-sand font-medium' : 'border-transparent hover:bg-black/5'
                      }`
                    }
                  >
                    <Icon size={18} aria-hidden="true" /> {label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
