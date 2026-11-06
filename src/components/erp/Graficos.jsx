import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,Legend} from 'recharts';
import {num} from './Erp';
// Paleta validada (CVD y contraste): planificado = ámbar, real/aprobado = verde. Una serie usa solo el verde.
export const COLOR={real:'#047857',plan:'#d97706'};
const eje={fontSize:12,fill:'#4b5563'}, grid={stroke:'#e5e7eb',vertical:false};
const tip={contentStyle:{borderRadius:8,border:'1px solid #e5e7eb',fontSize:12},cursor:{fill:'rgba(0,0,0,0.04)'}};
export function Barras({data,x,y,nombre,formato=v=>num(v),alto=260}){
  if(!data?.length) return <p className="p-6 text-center text-sm text-gray-500">Sin datos en el periodo.</p>;
  return <div style={{height:alto}}><ResponsiveContainer><BarChart data={data} margin={{top:8,right:8,left:0,bottom:0}}><CartesianGrid {...grid}/><XAxis dataKey={x} tick={eje} tickLine={false} axisLine={{stroke:'#d1d5db'}}/><YAxis tick={eje} tickLine={false} axisLine={false} tickFormatter={formato} width={70}/>
    <Tooltip {...tip} formatter={v=>[formato(v),nombre]}/><Bar dataKey={y} name={nombre} fill={COLOR.real} radius={[4,4,0,0]} maxBarSize={36}/></BarChart></ResponsiveContainer></div>;
}
export function BarrasComparadas({data,x,plan,real,nombrePlan='Planificado',nombreReal='Real',alto=280}){
  if(!data?.length) return <p className="p-6 text-center text-sm text-gray-500">Sin datos en el periodo.</p>;
  return <div style={{height:alto}}><ResponsiveContainer><BarChart data={data} barGap={2} margin={{top:8,right:8,left:0,bottom:0}}><CartesianGrid {...grid}/><XAxis dataKey={x} tick={eje} tickLine={false} axisLine={{stroke:'#d1d5db'}}/><YAxis tick={eje} tickLine={false} axisLine={false} width={50}/>
    <Tooltip {...tip}/><Legend wrapperStyle={{fontSize:12}}/><Bar dataKey={plan} name={nombrePlan} fill={COLOR.plan} radius={[4,4,0,0]} maxBarSize={28}/><Bar dataKey={real} name={nombreReal} fill={COLOR.real} radius={[4,4,0,0]} maxBarSize={28}/></BarChart></ResponsiveContainer></div>;
}
// Bloque de estadística descriptiva (n, promedio, mediana, desviación, mínimo, máximo).
export function Estadistica({titulo,e,unidad=''}){
  return <div className="rounded-lg border border-gray-200 p-3 text-sm"><p className="mb-2 font-semibold text-gray-700">{titulo}</p>
    {!e?.n?<p className="text-gray-500">Sin datos.</p>:<dl className="grid grid-cols-3 gap-x-3 gap-y-1">{[['n',e.n,''],['Promedio',e.promedio,unidad],['Mediana',e.mediana,unidad],['Desv. estándar',e.desviacion,unidad],['Mínimo',e.minimo,unidad],['Máximo',e.maximo,unidad]].map(([k,v,u])=><div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className="font-medium">{num(v)}{u}</dd></div>)}</dl>}</div>;
}
// Filtro de periodo común para los reportes.
export function Periodo({valor,onChange}){
  const set=(k,v)=>onChange({...valor,[k]:v});
  const preset=dias=>{const h=new Date(),d=new Date(Date.now()-dias*86400000);onChange({desde:d.toISOString().slice(0,10),hasta:h.toISOString().slice(0,10)});};
  return <div className="flex flex-wrap items-end gap-2 print:hidden"><label className="text-xs text-gray-600">Desde<input type="date" className="block rounded-lg border border-gray-300 px-3 py-2 text-sm" value={valor.desde} onChange={e=>set('desde',e.target.value)}/></label>
    <label className="text-xs text-gray-600">Hasta<input type="date" className="block rounded-lg border border-gray-300 px-3 py-2 text-sm" value={valor.hasta} onChange={e=>set('hasta',e.target.value)}/></label>
    {[['30 días',30],['90 días',90],['Año',365]].map(([l,d])=><button key={l} type="button" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs" onClick={()=>preset(d)}>{l}</button>)}
    <button type="button" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs" onClick={()=>onChange({desde:'',hasta:''})}>Todo</button></div>;
}
export const qs=p=>{const s=new URLSearchParams(Object.entries(p).filter(([,v])=>v)).toString();return s?`?${s}`:'';};
// Exporta filas a CSV (separador ; para Excel en español).
export function exportarCSV(nombre,filas){
  if(!filas.length) return; const cols=Object.keys(filas[0]);
  const esc=v=>`"${String(v??'').replaceAll('"','""')}"`;
  const blob=new Blob(['﻿'+[cols.join(';'),...filas.map(f=>cols.map(c=>esc(typeof f[c]==='object'?JSON.stringify(f[c]):f[c])).join(';'))].join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${nombre}.csv`;a.click();URL.revokeObjectURL(a.href);
}
