import {useEffect,useState} from 'react';
import {api,reportApiError} from '../services/api';
export function useApiRead(path){
  const [data,setData]=useState([]);
  useEffect(()=>{let active=true;api(path).then(r=>{if(active)setData(r.data)}).catch(reportApiError);return ()=>{active=false}},[path]);
  return data;
}
