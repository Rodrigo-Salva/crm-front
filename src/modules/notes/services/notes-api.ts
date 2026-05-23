import { api } from '@/modules/shared/services/api';

export interface Note {
  id: string;
  content: string;
  authorId: string;
  author?: { id: string; name: string; email: string };
  relatedTo: { type: string; id: string };
  createdAt: string;
  updatedAt: string;
}

export const notesApi = {
  list: (params: { type: string; id: string }) => {
    const query = new URLSearchParams({ [params.type === 'contact' ? 'contactId' : 'dealId']: params.id });
    return api.get<Note[]>(`/notes?${query}`);
  },
  create: (data: { content: string; relatedTo: { type: string; id: string } }) =>
    api.post<Note>('/notes', data),
  update: (id: string, data: { content: string }) =>
    api.patch<Note>(`/notes/${id}`, data),
  remove: (id: string) => api.delete(`/notes/${id}`),
};
