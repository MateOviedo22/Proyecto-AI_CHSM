import {useCallback,useEffect,useState} from 'react';
import {api,reportApiError} from '../services/api';
// Lista desde la API; si `path` es nulo no consulta (útil para detalles que dependen de una selección).
export function useApiList(path){
  const [data,setData]=useState([]);
  const reload=useCallback(async()=>{if(!path){setData([]);return [];}const r=await api(path);setData(r.data);return r.data;},[path]);
  useEffect(()=>{reload().catch(reportApiError)},[reload]);
  return [data,reload];
}
