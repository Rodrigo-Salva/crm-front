export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: string; label: string }[],
  filename: string
) {
  const headers = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = String(row[c.key] ?? '');
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON<T>(data: T[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
