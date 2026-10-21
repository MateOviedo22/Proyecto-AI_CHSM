import { useMemo, useState } from 'react';

export function usePagination(items, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  return {
    page: safePage, pageSize, totalPages, pageItems, total: items.length,
    from: items.length ? (safePage - 1) * pageSize + 1 : 0,
    to: Math.min(safePage * pageSize, items.length),
    setPage: (p) => setPage(Math.min(Math.max(1, p), totalPages)),
    setPageSize: (n) => { setPageSize(n); setPage(1); },
  };
}
