'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/modules/shared';
import { notesApi, Note } from '../services/notes-api';

interface Props {
  relatedType: string;
  relatedId: string;
}

export function NotesList({ relatedType, relatedId }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await notesApi.list({ type: relatedType, id: relatedId });
      setNotes(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [relatedType, relatedId]);

  useEffect(() => { load() }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await notesApi.create({ content, relatedType, relatedId });
      setContent('');
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notesApi.remove(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Notas</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nueva Nota'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] rounded-lg border border-gray-200 p-4 space-y-3">
          <textarea
            required
            placeholder="Escribe una nota..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={4}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm">Guardar Nota</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm">Cargando...</div>
      ) : notes.length === 0 ? (
        <div className="text-gray-400 text-sm py-4 text-center">Sin notas registradas</div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-[var(--card-bg)] rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      {note.author?.name || 'Usuario'} &middot; {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  title="Eliminar nota"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

