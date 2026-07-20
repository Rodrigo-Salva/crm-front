'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/modules/shared/services/api';

interface PublicNps {
  ticketNumber: number;
  subject: string;
  alreadyResponded: boolean;
  expired: boolean;
}

export default function PublicNpsPage() {
  const params = useParams();
  const token = params.token as string;

  const [survey, setSurvey] = useState<PublicNps | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PublicNps>(`/public/nps/${token}`);
      setSurvey(res);
    } catch {
      setError('Esta encuesta no existe o ya no está disponible.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === null) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/public/nps/${token}/submit`, { score, comment: comment || undefined });
      setDone(true);
    } catch {
      setError('No se pudo enviar tu respuesta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando...</div>;
  }

  if (!survey || survey.expired) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">{error || 'Esta encuesta expiró.'}</div>;
  }

  if (done || survey.alreadyResponded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">¡Gracias por tu respuesta!</h1>
          <p className="text-sm text-gray-500 mt-2">Tu opinión nos ayuda a mejorar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">¿Cómo fue tu experiencia?</h1>
        <p className="text-sm text-gray-500 mb-6">Ticket #{survey.ticketNumber} · {survey.subject}</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Del 0 al 10, ¿qué tan probable es que nos recomiendes?
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScore(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                    score === n
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 text-gray-700 hover:border-indigo-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting || score === null}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Enviando...' : 'Enviar respuesta'}
          </button>
        </form>
      </div>
    </div>
  );
}
