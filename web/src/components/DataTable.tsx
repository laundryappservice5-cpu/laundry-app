import { useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  sortAccessor?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyMessage = 'No records found',
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortColumn = columns.find((c) => c.key === sortKey);

  const sortedRows = useMemo(() => {
    if (!sortColumn?.sortAccessor) return rows;
    const accessor = sortColumn.sortAccessor;
    const sorted = [...rows].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
    if (sortDirection === 'desc') sorted.reverse();
    return sorted;
  }, [rows, sortColumn, sortDirection]);

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortAccessor) return;
    if (sortKey === column.key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column.key);
      setSortDirection('asc');
    }
  }

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3 }}>
      <TableContainer>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align ?? 'left'}
                  sx={{ fontWeight: 700, fontSize: '0.8rem', py: 1.5, textTransform: 'uppercase', letterSpacing: 0.4, color: 'text.secondary' }}
                >
                  {col.sortAccessor ? (
                    <TableSortLabel
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDirection : 'asc'}
                      onClick={() => handleSort(col)}
                    >
                      {col.header}
                    </TableSortLabel>
                  ) : (
                    col.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={{ py: 1.75 }}>
                      <Skeleton variant="text" height={28} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && sortedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box py={6} textAlign="center">
                    <Typography color="text.secondary">{emptyMessage}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              sortedRows.map((row, idx) => (
                <TableRow
                  key={rowKey(row)}
                  hover
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    bgcolor: idx % 2 === 1 ? 'action.hover' : 'transparent',
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align ?? 'left'} sx={{ py: 1.75, fontSize: '0.9rem' }}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={(_, newPage) => pagination.onPageChange(newPage + 1)}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={(e) => pagination.onLimitChange(Number(e.target.value))}
          rowsPerPageOptions={[10, 20, 50]}
        />
      )}
    </Paper>
  );
}
