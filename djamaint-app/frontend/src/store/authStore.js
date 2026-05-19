import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      lastActivity: null,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken, lastActivity: Date.now() });
      },

      setUser: (user) => set({ user }),

      updateActivity: () => set({ lastActivity: Date.now() }),

      isSessionExpired: () => {
        const { lastActivity } = get();
        if (!lastActivity) return true;
        return Date.now() - lastActivity > INACTIVITY_LIMIT;
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, lastActivity: null });
      },

      isAuthenticated: () => {
        const { user, accessToken } = get();
        return Boolean(user && accessToken);
      },
    }),
    { name: 'djamaint-auth', partialize: (s) => ({ user: s.user, lastActivity: s.lastActivity }) }
  )
);
