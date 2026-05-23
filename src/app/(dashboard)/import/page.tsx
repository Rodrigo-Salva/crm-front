'use client';

import { useState, useRef, useCallback } from 'react';
import { PageHeader, Card, Button, Loading } from '@/modules/shared';
import { api } from '@/modules/shared/services/api';

const ENTITIES = [
  { value: 'contacts', label: 'Contactos', accept: 'Contactos, Empresas' },
  { value: 'companies', label: 'Empresas', accept: 'Empresas' },
  { value: 'deals', label: 'Negocios', accept: 'Negocios' },
  { value: 'products', label: 'Productos', accept: 'Productos' },
];

export default function ImportPage() {
  const [entity, setEntity] = useState('contacts');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: { row: number; message: string }[]; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/import/${entity}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
      <PageHeader title="Importar datos" description="Sube un archivo CSV para importar registros" />

      <Card>
        <div className="flex gap-2 mb-6">
          {ENTITIES.map((e) => (
            <button key={e.value} onClick={() => { setEntity(e.value); setFile(null); setResult(null); }} className={`px-4 py-2 text-sm rounded-lg transition-colors ${entity === e.value ? 'bg-[var(--primary)] text-white' : 'bg-gray-50 text-[var(--text-secondary)] hover:bg-gray-100'}`}>
              {e.label}
            </button>
          ))}
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dragging ? 'border-[var(--primary)] bg-blue-50' : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-gray-50'}`}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <svg className="w-10 h-10 mx-auto text-[var(--text-secondary)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          {file ? (
            <p className="text-sm font-medium text-[var(--text)]">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
          ) : (
            <>
              <p className="text-sm text-[var(--text-secondary)]">Arrastra un archivo CSV aquí o haz clic para seleccionar</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Encabezados sugeridos: name, email, phone, company</p>
            </>
          )}
        </div>

        {file && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} loading={loading} disabled={loading}>
              {loading ? 'Importando…' : `Importar ${ENTITIES.find((e) => e.value === entity)?.label}`}
            </Button>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
            <p className="text-sm font-medium text-green-800">
              {result.imported} de {result.total} registros importados
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-red-600 mb-1">{result.errors.length} errores:</p>
                {result.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-red-500">Fila {e.row}: {e.message}</p>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setFile(null); setResult(null); }}>Importar otro archivo</Button>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Formato CSV esperado</h3>
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <p><strong>Contactos:</strong> name, email, phone, company, position</p>
          <p><strong>Empresas:</strong> name, industry, website, phone, address</p>
          <p><strong>Negocios:</strong> title, value, stage, contactId</p>
          <p><strong>Productos:</strong> name, price, description, category, sku</p>
        </div>
      </Card>
    </div>
  );
}
