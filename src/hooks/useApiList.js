import {useCallback,useEffect,useState} from 'react';
import {api,reportApiError} from '../services/api';
export function useApiList(path){
  const [data,setData]=useState([]);
  const reload=useCallback(async()=>{const r=await api(path);setData(r.data);return r.data;},[path]);
  useEffect(()=>{reload().catch(reportApiError)},[reload]);
  return [data,reload];
}
