import {useCallback, useEffect, useRef, useState} from 'react';
import {api,reportApiError} from '../services/api';

// Adapts existing list-based screens to per-record REST operations.
// Writes are serialized; an error reloads server data and is shown to the user.
export function useApiCollection(resource) {
  const [rows,setRows]=useState([]);
  const current=useRef([]), ready=useRef(false), busy=useRef(false), alive=useRef(true);
  const reload=useCallback(async()=>{
    const result=await api(`/recursos/${resource}`);
    if(alive.current){current.current=result.data;setRows(result.data);ready.current=true;}
    return result.data;
  },[resource]);
  useEffect(()=>{
    alive.current=true;ready.current=false;current.current=[];setRows([]);
    reload().catch(reportApiError);
    return ()=>{alive.current=false;};
  },[reload]);
  const update=useCallback((change)=>{
    if(!ready.current || busy.current){reportApiError(new Error('Espera a que termine la carga o el guardado anterior.'));return;}
    const before=current.current;
    const after=typeof change==='function' ? change(before) : change;
    if(!Array.isArray(after)) {reportApiError(new Error('Cambio no válido.')); return;}
    busy.current=true;current.current=after;setRows(after);
    (async()=>{
      const old=new Map(before.map(item=>[String(item.id),item]));
      const now=new Map(after.map(item=>[String(item.id),item]));
      for(const row of after){
        const previous=old.get(String(row.id));
        if(!previous) await api(`/recursos/${resource}`,{method:'POST',body:row});
        else if(JSON.stringify(previous)!==JSON.stringify(row)) await api(`/recursos/${resource}/${encodeURIComponent(row.id)}`,{method:'PUT',body:row});
      }
      for(const row of before) if(!now.has(String(row.id))) await api(`/recursos/${resource}/${encodeURIComponent(row.id)}`,{method:'DELETE'});
      await reload();
    })().catch(async error=>{
      reportApiError(error);
      try{await reload();}catch(e){reportApiError(e);}
    }).finally(()=>{busy.current=false;});
  },[resource,reload]);
  return [rows,update,reload];
}
