import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel<T extends object>(
  data: T[],
  columns: ExcelColumn[],
  sheetName: string = 'Report',
  filename: string = 'report',
) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Map rows based on columns
  const formattedRows = data.map((item) => {
    const row: Record<string, unknown> = {};
    const record = item as Record<string, unknown>;
    columns.forEach((col) => {
      row[col.header] = record[col.key] !== undefined && record[col.key] !== null ? record[col.key] : '';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Set column widths
  worksheet['!cols'] = columns.map((col) => ({
    wch: col.width || Math.max(col.header.length + 4, 14),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write and trigger download
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
}
