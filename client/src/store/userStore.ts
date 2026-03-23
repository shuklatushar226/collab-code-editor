import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: { id: string; name: string; email?: string; isGuest?: boolean } | null;
  token: string | null;
  setUser: (user: UserState['user'], token: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => set({ user, token }),
      clearUser: () => set({ user: null, token: null }),
    }),
    { name: 'collab-editor-user' }
  )
);
