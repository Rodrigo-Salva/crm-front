import { api } from '@/modules/shared/services/api';

export interface Note {
  id: string;
  content: string;
  authorId: string;
  author?: { id: string; name: string; email: string };
  relatedType: string;
  relatedId: string;
  createdAt: string;
  updatedAt: string;
}

export const notesApi = {
  list: (params: { type: string; id: string }) =>
    api.get<Note[]>(`/notes?relatedType=${params.type}&relatedId=${params.id}`),
  create: (data: { content: string; relatedType: string; relatedId: string }) =>
    api.post<Note>('/notes', data),
  update: (id: string, data: { content: string }) =>
    api.patch<Note>(`/notes/${id}`, data),
  remove: (id: string) => api.delete(`/notes/${id}`),
};
