// src/stores/useAuthStore.js
import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  user: null,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    const { accessToken} = get();

    // 서버에 로그아웃 요청 (실패해도 로컬은 정리)
    try {
      if (accessToken) {
        await axios.post('/api/auths/logout', null, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch (e) {
      console.warn('서버 로그아웃 실패 (무시)', e);
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));

export default useAuthStore;