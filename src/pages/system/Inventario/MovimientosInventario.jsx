import {useMemo,useState} from 'react';
import {useApiRead} from '../../../hooks/useApiRead';
export default function MovimientosInventario(){
  const movimientos=useApiRead('/movimientos');
  const [search,setSearch]=useState('');
  const rows=useMemo(()=>movimientos.filter(m=>`${m.articulo} ${m.tipo} ${m.referencia}`.toLowerCase().includes(search.toLowerCase())),[movimientos,search]);
  return <div className="space-y-6"><header><p className="text-sm font-medium text-emerald-700">Sunshine / Inventario</p><h1 className="text-2xl font-bold text-gray-900">Trazabilidad de inventario</h1><p className="mt-1 text-sm text-gray-500">Movimientos generados por ventas y entradas de materiales.</p></header>
    <section className="rounded-xl bg-white p-5 shadow-sm"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar artículo, movimiento o referencia" className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:max-w-md"/>
    <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr>{['Fecha','Artículo','Tipo','Cantidad','Saldo','Referencia','Usuario'].map(x=><th className="p-3" key={x}>{x}</th>)}</tr></thead>
      <tbody className="divide-y divide-gray-100">{rows.map(m=><tr key={m.id}><td className="p-3">{new Date(m.fecha).toLocaleString('es-NI')}</td><td className="p-3">{m.articulo}</td><td className="p-3">{m.tipo}</td><td className="p-3">{m.cantidad}</td><td className="p-3">{m.saldo}</td><td className="p-3">{m.referencia || '—'}</td><td className="p-3">{m.usuario}</td></tr>)}</tbody></table></div>
    {rows.length===0 && <p className="p-5 text-center text-sm text-gray-500">No hay movimientos registrados.</p>}</section></div>;
}
