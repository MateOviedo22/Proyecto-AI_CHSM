import Card from '../ui/Card';
import Pagination from '../ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

/**
 * columns: [{ key, header, align?, render?(row) }]
 * `toolbar` se pinta sobre la tabla (buscador y filtros).
 */
export default function DataTable({ columns, rows, caption, toolbar, selectedId, title }) {
  const p = usePagination(rows, 10);
  return (
    <Card>
      {title && <h2 className="mb-3 text-base font-semibold">{title}</h2>}
      {toolbar}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              {columns.map((c) => <th key={c.key} scope="col" className={`border border-gray-300 px-3 py-2 font-semibold ${c.align === 'right' ? 'text-right' : ''}`}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {p.pageItems.map((row) => (
              <tr key={row.id} className={`border-y border-gray-300 transition hover:bg-brand-light/40 ${selectedId === row.id ? 'bg-sand/40' : ''}`}>
                {columns.map((c) => <td key={c.key} className={`px-3 py-2.5 ${c.align === 'right' ? 'text-right' : ''}`}>{c.render ? c.render(row) : row[c.key]}</td>)}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500">No hay resultados. Prueba con otros filtros.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination p={p} />
    </Card>
  );
}
