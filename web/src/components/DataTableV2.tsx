import { useMemo, type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  sortAccessor?: (row: T) => string | number;
  width?: number;
}

interface DataTableV2Props<T> {
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

function NoRowsOverlay({ message }: { message: string }) {
  return (
    <Box height="100%" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={1}>
      <InboxOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </Box>
  );
}

export function DataTableV2<T extends object>({
  columns,
  rows,
  rowKey,
  loading,
  emptyMessage = 'No records found',
  onRowClick,
  pagination,
}: DataTableV2Props<T>) {
  const gridColumns: GridColDef<T>[] = useMemo(
    () =>
      columns.map((col) => ({
        field: col.key,
        headerName: col.header,
        flex: col.width ? undefined : 1,
        width: col.width,
        minWidth: col.width ?? 130,
        sortable: Boolean(col.sortAccessor),
        align: col.align,
        headerAlign: col.align,
        disableColumnMenu: true,
        valueGetter: col.sortAccessor ? (_value, row) => col.sortAccessor!(row) : undefined,
        renderCell: (params) => col.render(params.row),
      })),
    [columns],
  );

  return (
    <Box
      sx={{
        height: Math.max(280, Math.min(640, 112 + Math.max(rows.length, 1) * 52)),
        width: '100%',
        '& .MuiDataGrid-root': { border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' },
        '& .MuiDataGrid-columnHeaders': {
          bgcolor: (theme) => `color-mix(in srgb, ${theme.palette.primary.main} 5%, transparent)`,
        },
        '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.6, color: 'text.secondary' },
        '& .MuiDataGrid-cell': { fontSize: '0.875rem' },
        '& .MuiDataGrid-row': {
          cursor: onRowClick ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease',
        },
        '& .MuiDataGrid-row:hover': {
          bgcolor: (theme) => `color-mix(in srgb, ${theme.palette.primary.main} 4%, transparent)`,
        },
        '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
      }}
    >
      <DataGrid
        rows={rows}
        columns={gridColumns}
        getRowId={(row) => rowKey(row as T)}
        loading={loading}
        onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
        disableColumnMenu
        disableColumnSelector
        disableDensitySelector
        hideFooterSelectedRowCount
        rowHeight={56}
        columnHeaderHeight={48}
        slots={{ noRowsOverlay: () => <NoRowsOverlay message={emptyMessage} /> }}
        paginationMode={pagination ? 'server' : 'client'}
        rowCount={pagination?.total}
        paginationModel={pagination ? { page: pagination.page - 1, pageSize: pagination.limit } : undefined}
        onPaginationModelChange={
          pagination
            ? (model) => {
                if (model.pageSize !== pagination.limit) pagination.onLimitChange(model.pageSize);
                if (model.page !== pagination.page - 1) pagination.onPageChange(model.page + 1);
              }
            : undefined
        }
        pageSizeOptions={pagination ? [10, 20, 50] : undefined}
        hideFooter={!pagination}
      />
    </Box>
  );
}
