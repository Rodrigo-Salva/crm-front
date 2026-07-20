'use client';

import { Button } from './button';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns?: { key: string; label: string; format?: (val: any) => string }[];
  className?: string;
}

export function ExportButton({ data, filename, columns, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    setIsExporting(true);
    try {
      // Si no se proveen columnas, deducirlas de las llaves del primer elemento (sin objetos anidados profundos)
      const exportColumns = columns || Object.keys(data[0])
        .filter(k => typeof data[0][k] !== 'object' || data[0][k] === null)
        .map(k => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));

      // Construir cabeceras CSV
      const headers = exportColumns.map(c => `"${c.label}"`).join(',');

      // Construir filas CSV
      const rows = data.map(item => {
        return exportColumns.map(col => {
          let val = item[col.key];
          if ('format' in col && typeof col.format === 'function' && val !== undefined && val !== null) {
            val = col.format(val);
          }
          if (val === null || val === undefined) val = '';
          // Escapar comillas dobles y comas
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        }).join(',');
      });

      const csvContent = [headers, ...rows].join('\n');
      
      // Añadir el BOM para que Excel lea correctamente los acentos/UTF-8
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Exportación completada exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Ocurrió un error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport} 
      disabled={isExporting || data.length === 0}
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? 'Exportando...' : 'Exportar CSV'}
    </Button>
  );
}
