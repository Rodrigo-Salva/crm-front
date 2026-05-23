'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  name: string;
  tenantSlug?: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any>('/auth/login', dto);
      
      if (res.requires2FA) {
        return res; // Let the component handle redirection to 2FA page
      }

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      return res;
    } catch (err: any) {
      const message = err?.message || 'Error al iniciar sesión';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (userId: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any>('/auth/2fa/verify', { userId, code });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      return res;
    } catch (err: any) {
      const message = err?.message || 'Código 2FA incorrecto';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (dto: RegisterDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any>('/auth/register', dto);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      return res;
    } catch (err: any) {
      const message = err?.message || 'Error al registrarse';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return { user, loading, error, login, register, logout, verify2FA, isAuthenticated: !!user };
}
