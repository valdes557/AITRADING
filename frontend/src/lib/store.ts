import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authAPI } from './api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    Cookies.set('token', data.token, { expires: 30 });
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (name: string, email: string, password: string) => {
    const { data } = await authAPI.register({ name, email, password });
    Cookies.set('token', data.token, { expires: 30 });
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    Cookies.remove('token');
    set({ user: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  fetchProfile: async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await authAPI.getProfile();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      Cookies.remove('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (data: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));
