import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {api,getToken} from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(Boolean(getToken()));
  useEffect(()=>{
    let active=true;
    const clear=()=>{sessionStorage.removeItem('sunshine-token');if(active){setUser(null);setLoading(false);}};
    window.addEventListener('sunshine-session-expired',clear);
    if(getToken()) api('/auth/me').then(result=>{if(active)setUser(result.user);}).catch(clear).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;window.removeEventListener('sunshine-session-expired',clear);};
  },[]);
  const value=useMemo(()=>({user,loading,login:async(username,password)=>{
    const result=await api('/auth/login',{method:'POST',body:{username,password}});
    sessionStorage.setItem('sunshine-token',result.token);setUser(result.user);
  },logout:()=>{sessionStorage.removeItem('sunshine-token');setUser(null);}}),[user,loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
