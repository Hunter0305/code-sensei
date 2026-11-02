import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password2?: string;
  password_confirm?: string;
  first_name: string;
  last_name: string;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    set({ isAuthenticated: true });
    // Fetch user profile
    try {
      const { data: userData } = await api.get('/auth/profile/');
      set({ user: userData });
    } catch {
      set({ user: { id: 0, email, username: email.split('@')[0], first_name: '', last_name: '' } });
    }
  },

  register: async (regData: RegisterData) => {
    const password_confirm = regData.password_confirm || regData.password2 || regData.password;
    const { password2: _p2, ...payload } = regData;
    await api.post('/auth/register/', {
      ...payload,
      password_confirm,
    });
  },

  logout: async () => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      if (refresh) await api.post('/auth/logout/', { refresh });
    } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/profile/');
      set({ user: data, isAuthenticated: true });
    } catch {
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
