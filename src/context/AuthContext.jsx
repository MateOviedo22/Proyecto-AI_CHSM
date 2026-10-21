import { createContext, useContext, useMemo, useState } from 'react';
import { user as mockUser } from '../data/mockData';

const AuthContext = createContext(null);

/** Sesión simulada: cualquier credencial válida según el formulario entra. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (sessionStorage.getItem('sunshine-auth') ? mockUser : null));
  const value = useMemo(() => ({
    user,
    login: () => { sessionStorage.setItem('sunshine-auth', '1'); setUser(mockUser); },
    logout: () => { sessionStorage.removeItem('sunshine-auth'); setUser(null); },
  }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
