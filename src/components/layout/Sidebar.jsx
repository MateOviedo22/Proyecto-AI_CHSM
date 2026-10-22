import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import {
  Box,
  Contact,
  Factory,
  LayoutDashboard,
  LineChart,
  Package,
  ShoppingCart,
  Users,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import Logo from '../ui/Logo';
import { modules } from '../../data/mockData';

const icons = {
  LayoutDashboard,
  Users,
  Factory,
  Package,
  ShoppingCart,
  LineChart,
  IdCard: Contact,
  Box,
};

export default function Sidebar({ open, onClose }) {
  const location = useLocation();


  const activeModules = modules.filter(
    (module) =>
      module.children?.length &&
      location.pathname.startsWith(module.path)
  );

  const [expandedModule, setExpandedModule] = useState(
    () => activeModules[0]?.key ?? null
  );
  // Abre automáticamente el submenú de la ruta actual.

  useEffect(() => {
    if (activeModules.length > 0) {
      setExpandedModule(activeModules[0].key);
    }
  }, [location.pathname]);

  // Solo permite tener un submenú abierto a la vez.
  const toggleModule = (key) => {
    setExpandedModule((previous) =>
      previous === key ? null : key
    );
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 transform
          border-r border-gray-300 bg-gray-100 transition-transform duration-200
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Encabezado */}
        <div className="flex h-16 items-center justify-between border-b border-gray-300 px-4">
          <Logo size={36} />

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-black/5 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegación */}
        <nav aria-label="Módulos del sistema" className="py-4">
          <p className="px-4 pb-2 text-xs font-semibold text-yellow-900">
            MÓDULOS
          </p>

          <ul className="space-y-1">
            {modules.map(({ key, label, path, icon, children }) => {
              const Icon = icons[icon];
              const hasChildren = Boolean(children?.length);

              if (hasChildren) {
                const expanded = expandedModule === key;
                const active = location.pathname.startsWith(path);

                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => toggleModule(key)}
                      aria-expanded={expanded}
                      className={`flex w-full items-center gap-3 border-l-4
                        px-4 py-2.5 text-left text-sm transition
                        ${active
                          ? 'border-brand bg-sand font-medium'
                          : 'border-transparent hover:bg-black/5'
                        }`}
                    >
                      {Icon && (
                        <Icon size={18} aria-hidden="true" />
                      )}

                      <span className="flex-1">{label}</span>

                      {expanded ? (
                        <ChevronDown size={16} aria-hidden="true" />
                      ) : (
                        <ChevronRight size={16} aria-hidden="true" />
                      )}
                    </button>

                    {expanded && (
                      <ul className="mt-1 space-y-1 pb-1">
                        {children.map((child) => (
                          <li key={child.key}>
                            <NavLink
                              to={child.path}
                              end
                              onClick={onClose}
                              className={({ isActive }) =>
                                `block border-l-4 py-2 pl-11 pr-3 text-sm transition
                                ${isActive
                                  ? 'border-brand bg-sand font-medium text-gray-900'
                                  : 'border-transparent text-gray-600 hover:bg-black/5 hover:text-gray-900'
                                }`
                              }
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={key}>
                  <NavLink
                    to={path}
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 border-l-4 px-4 py-2.5
                      text-sm transition
                      ${isActive
                        ? 'border-brand bg-sand font-medium'
                        : 'border-transparent hover:bg-black/5'
                      }`
                    }
                  >
                    {Icon && (
                      <Icon size={18} aria-hidden="true" />
                    )}

                    {label}
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
