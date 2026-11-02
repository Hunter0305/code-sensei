/**
 * Auth Service — register, login, logout, profile
 */
import api, { setAuth, clearAuth } from './api';
import type { AuthTokens, User, DashboardSummary } from '../types';

export const authService = {
  /** Register a new student account */
  async register(data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
  }) {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  /** Login and store tokens */
  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/auth/login/', { email, password });
    const { access, refresh, user } = response.data;
    setAuth(access, refresh);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  /** Logout — blacklist refresh token */
  async logout() {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } finally {
      clearAuth();
    }
  },

  /** Get the current user profile */
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile/');
    return response.data;
  },

  /** Update user profile */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<User>('/auth/profile/', data);
    return response.data;
  },

  /** Get dashboard summary */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>('/auth/dashboard/');
    return response.data;
  },

  /** Get stored user from localStorage */
  getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
};
