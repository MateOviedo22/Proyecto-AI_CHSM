import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Recibe el objeto devuelto por usePagination. */
export default function Pagination({ p }) {
  const start = Math.max(1, Math.min(p.page - 2, p.totalPages - 4));
  const pages = Array.from({ length: Math.min(5, p.totalPages) }, (_, i) => start + i);
  const nav = 'rounded p-1.5 transition hover:bg-black/5 disabled:opacity-30';

  return (
    <nav aria-label="Paginación" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
      <div className="flex items-center gap-3">
        <span>Mostrando <b>{p.from}</b> a <b>{p.to}</b> de <b>{p.total}</b> entradas</span>
        <select aria-label="Filas por página" value={p.pageSize} onChange={(e) => p.setPageSize(Number(e.target.value))} className="rounded-field border border-gray-300 bg-white px-2 py-1">
          {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/Página</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button className={nav} disabled={p.page === 1} onClick={() => p.setPage(p.page - 1)} aria-label="Página anterior"><ChevronLeft size={14} /></button>
        {pages.map((n) => (
          <button key={n} onClick={() => p.setPage(n)} aria-current={n === p.page ? 'page' : undefined}
            className={`h-6 min-w-6 rounded px-1.5 transition ${n === p.page ? 'bg-gray-300 font-semibold text-ink' : 'hover:bg-black/5'}`}>{n}</button>
        ))}
        <button className={nav} disabled={p.page === p.totalPages} onClick={() => p.setPage(p.page + 1)} aria-label="Página siguiente"><ChevronRight size={14} /></button>
        <label className="ml-2 flex items-center gap-1">Ir a
          <input type="number" min="1" max={p.totalPages} defaultValue={p.page} key={p.page}
            onKeyDown={(e) => e.key === 'Enter' && p.setPage(Number(e.target.value))}
            className="w-10 rounded-field border border-gray-300 bg-white px-1 py-0.5 text-center" />
        </label>
      </div>
    </nav>
  );
}
