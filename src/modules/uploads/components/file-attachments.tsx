'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Loading } from '@/modules/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

interface FileAttachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  entity: string;
  entityId: string;
  uploadedBy?: { id: string; name: string };
  createdAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.includes('pdf')) return '📄';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return '📊';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return '📦';
  return '📎';
}

export function FileAttachments({ entity, entityId }: { entity: string; entityId: string }) {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/uploads?entity=${entity}&entityId=${entityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false) }
  }, [entity, entityId]);

  useEffect(() => { load() }, [load]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      await fetch(`${API_BASE}/uploads?entity=${entity}&entityId=${entityId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      load();
    } catch {}
    finally { setUploading(false) }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getToken();
      await fetch(`${API_BASE}/uploads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch {}
  };

  const getDownloadUrl = (id: string) => `${API_BASE}/uploads/${id}/file?token=${getToken()}`;

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-[var(--primary)] bg-blue-50' : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-gray-50'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <svg className="w-8 h-8 mx-auto text-[var(--text-secondary)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-[var(--text-secondary)]">
            {uploading ? 'Subiendo...' : 'Arrastra un archivo aquí o haz clic para seleccionar'}
          </p>
        </label>
      </div>

      {files.length === 0 && !loading && (
        <p className="text-sm text-[var(--text-secondary)] text-center py-6">Sin archivos adjuntos</p>
      )}

      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg">{getFileIcon(f.mimeType)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{f.originalName}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {formatSize(f.size)} · {new Date(f.createdAt).toLocaleDateString()}
                  {f.uploadedBy && ` · por ${f.uploadedBy.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-3">
              <a
                href={getDownloadUrl(f.id)}
                download={f.originalName}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--primary)] hover:bg-gray-100 transition-colors"
                title="Descargar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </a>
              <button
                onClick={() => handleDelete(f.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
