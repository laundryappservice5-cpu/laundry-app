import { useMemo, useState } from 'react';

interface ClientPagination<T> {
  pageItems: T[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function useClientPagination<T>(items: T[], initialLimit = 10): ClientPagination<T> {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const pageItems = useMemo(() => {
    const start = (page - 1) * limit;
    return items.slice(start, start + limit);
  }, [items, page, limit]);

  return {
    pageItems,
    page,
    limit,
    total: items.length,
    onPageChange: setPage,
    onLimitChange: (newLimit) => {
      setLimit(newLimit);
      setPage(1);
    },
  };
}
