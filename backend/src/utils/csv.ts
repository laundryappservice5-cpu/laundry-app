interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvCell(c.accessor(row))).join(','));
  return [header, ...lines].join('\n');
}
