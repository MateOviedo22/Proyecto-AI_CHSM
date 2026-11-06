import {useEffect,useState} from 'react';
import {api,reportApiError} from '../services/api';
// Lectura única desde la API; si `path` es nulo no consulta.
export function useApiRead(path){
  const [data,setData]=useState([]);
  useEffect(()=>{let active=true;if(!path){setData([]);return undefined;}api(path).then(r=>{if(active)setData(r.data)}).catch(reportApiError);return ()=>{active=false}},[path]);
  return data;
}
