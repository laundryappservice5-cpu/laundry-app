import type { ReactNode } from 'react';
import { Box, Grid, Paper, Skeleton, Stack, TablePagination, Typography } from '@mui/material';

interface CardGridProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  renderCard: (row: T) => ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
}

export function CardGrid<T>({
  rows,
  rowKey,
  renderCard,
  loading,
  emptyMessage = 'No records found',
  columns = { xs: 12, sm: 6, md: 4, lg: 3 },
  pagination,
}: CardGridProps<T>) {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={`skeleton-${i}`} size={columns}>
            <Skeleton variant="rounded" height={140} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (rows.length === 0) {
    return (
      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <Box py={6} textAlign="center">
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {rows.map((row) => (
          <Grid key={rowKey(row)} size={columns}>
            {renderCard(row)}
          </Grid>
        ))}
      </Grid>
      {pagination && (
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page - 1}
            onPageChange={(_, newPage) => pagination.onPageChange(newPage + 1)}
            rowsPerPage={pagination.limit}
            onRowsPerPageChange={(e) => pagination.onLimitChange(Number(e.target.value))}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Paper>
      )}
    </Stack>
  );
}
