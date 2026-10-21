import { useMemo, useState } from 'react';

/** Búsqueda por texto + filtros por igualdad. El valor 'Todos' desactiva un filtro. */
export function useFilteredList(items, searchKeys, initialFilters = {}) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const setFilter = (key, value) => setFilters((p) => ({ ...p, [key]: value }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (it) =>
        (!q || searchKeys.some((k) => String(it[k]).toLowerCase().includes(q))) &&
        Object.entries(filters).every(([k, v]) => v === 'Todos' || it[k] === v)
    );
  }, [items, query, filters, searchKeys]);

  return { filtered, query, setQuery, filters, setFilter };
}
