const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
import { toast } from 'sonner';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    };

    const response = await fetch(url, { ...options, headers, credentials: 'include' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      const errorMessage = error.message || `HTTP ${response.status}`;
      const method = options?.method?.toUpperCase() || 'GET';
      console.error(`API error [${method} ${path}]:`, errorMessage);
      if (!path.includes('/auth')) {
        toast.error(errorMessage);
      }
      throw new Error(errorMessage);
    }

    if (options?.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase()) && !path.includes('/auth')) {
      let action = 'Guardado';
      if (options.method === 'DELETE') action = 'Eliminado';
      else if (options.method === 'POST') action = 'Creado';
      else if (options.method === 'PUT' || options.method === 'PATCH') action = 'Actualizado';
      
      toast.success(`${action} exitosamente`);
    }

    return response.json();
  }

  get<T>(path: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<T>(`${path}${query}`);
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
