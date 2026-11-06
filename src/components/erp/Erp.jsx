import {useCallback,useState} from 'react';
import {api,reportApiError} from '../../services/api';
// Piezas comunes de las pantallas conectadas (mismo estilo que Compras/ComprasIntegradas.jsx).
export const input='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';
export const button='rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50';
export const buttonLight='rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50';
export const money=n=>new Intl.NumberFormat('es-NI',{style:'currency',currency:'NIO'}).format(Number(n)||0);
export const num=(n,d=2)=>new Intl.NumberFormat('es-NI',{maximumFractionDigits:d}).format(Number(n)||0);
export const fecha=v=>v?new Date(String(v).length===10?`${v}T00:00:00`:v).toLocaleDateString('es-NI'):'—';
export const fechaHora=v=>v?new Date(v).toLocaleString('es-NI'):'—';
export function Header({modulo,title,subtitle,children}){return <header className="flex flex-wrap items-end justify-between gap-3 print:hidden"><div><p className="text-sm font-medium text-emerald-700">Sunshine / {modulo}</p><h1 className="text-2xl font-bold text-gray-900">{title}</h1>{subtitle&&<p className="mt-1 text-sm text-gray-500">{subtitle}</p>}</div><div className="flex flex-wrap gap-2">{children}</div></header>}
export function Section({title,children,actions}){return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-2">{title&&<h2 className="text-lg font-semibold text-gray-800">{title}</h2>}{actions}</div>{children}</section>}
export function Field({label,children,className=''}){return <label className={`block space-y-1 text-sm font-medium text-gray-700 ${className}`}><span>{label}</span>{children}</label>}
export function Table({headers,children,empty,min=760}){return <div className="overflow-x-auto"><table className="w-full text-left text-sm" style={{minWidth:min}}><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{headers.map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{children}</tbody></table>{empty&&<p className="p-5 text-center text-sm text-gray-500">{empty}</p>}</div>}
export const Cell=({children,className=''})=><td className={`p-3 align-top ${className}`}>{children}</td>;
const tones={Borrador:'bg-gray-100 text-gray-700',Pendiente:'bg-gray-100 text-gray-700',Revisado:'bg-sky-100 text-sky-700',Revisada:'bg-sky-100 text-sky-700',Autorizado:'bg-indigo-100 text-indigo-700',Autorizada:'bg-indigo-100 text-indigo-700',Aprobada:'bg-indigo-100 text-indigo-700','En proceso':'bg-blue-100 text-blue-700','En tránsito':'bg-amber-100 text-amber-800','En calidad':'bg-amber-100 text-amber-800',Cerrada:'bg-green-100 text-green-700',Recibido:'bg-green-100 text-green-700',Entregada:'bg-green-100 text-green-700',Completado:'bg-green-100 text-green-700',Emitida:'bg-green-100 text-green-700',Vigente:'bg-green-100 text-green-700',Activo:'bg-green-100 text-green-700',Resuelto:'bg-green-100 text-green-700',Acreditada:'bg-green-100 text-green-700','Recibido con diferencias':'bg-orange-100 text-orange-700',Cancelado:'bg-red-100 text-red-700',Cancelada:'bg-red-100 text-red-700',Anulada:'bg-red-100 text-red-700',Rechazada:'bg-red-100 text-red-700',Inactivo:'bg-red-100 text-red-700',Obsoleta:'bg-red-100 text-red-700'};
export const Badge=({value})=><span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tones[value]||'bg-gray-100 text-gray-700'}`}>{value}</span>;
export function Notice({notice}){if(!notice?.text)return null;return <div role="status" className={`rounded-lg px-4 py-3 text-sm print:hidden ${notice.ok?'bg-emerald-50 text-emerald-800':'bg-red-50 text-red-800'}`}>{notice.text}</div>}
export function Stat({label,value,hint}){return <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-medium uppercase text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>{hint&&<p className="mt-1 text-xs text-gray-500">{hint}</p>}</div>}
// Ejecuta una operación de la API con estado de envío, mensaje de éxito/error y recarga posterior.
export function useAction(reload){
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState(null);
  const run=useCallback(async(path,{method='POST',body}={},success='Operación realizada.')=>{
    if(busy) return null; setBusy(true); setNotice(null);
    try{const r=await api(path,{method,body}); if(reload) await reload(); setNotice({ok:true,text:success}); return r?.data ?? true;}
    catch(e){setNotice({ok:false,text:e.message}); reportApiError(e); return null;}
    finally{setBusy(false);}
  },[busy,reload]);
  return {busy,notice,setNotice,run};
}
// Abre la vista de impresión del navegador (las clases print:hidden ocultan menús y botones).
export const imprimir=()=>window.print();
