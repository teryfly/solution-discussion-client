import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '../utils/storage';
import type { User, Project } from '../types';

interface GlobalState {
  user: User | null;
  currentProject: Project | null;
  autoUpdateCode: boolean;
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  
  setUser: (user: User | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setAutoUpdateCode: (enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  logout: () => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  user: storage.get<User>(STORAGE_KEYS.CURRENT_USER),
  currentProject: storage.get<Project>(STORAGE_KEYS.CURRENT_PROJECT),
  autoUpdateCode: storage.get<boolean>(STORAGE_KEYS.AUTO_UPDATE_CODE, false),
  theme: storage.get<'light' | 'dark'>(STORAGE_KEYS.THEME, 'light'),
  fontSize: storage.get<'small' | 'medium' | 'large'>(STORAGE_KEYS.FONT_SIZE, 'medium'),

  setUser: (user) => {
    storage.set(STORAGE_KEYS.CURRENT_USER, user);
    // 不再在这里设置 AUTH_TOKEN，由调用方负责
    set({ user });
  },

  setCurrentProject: (project) => {
    storage.set(STORAGE_KEYS.CURRENT_PROJECT, project);
    set({ currentProject: project });
  },

  setAutoUpdateCode: (enabled) => {
    storage.set(STORAGE_KEYS.AUTO_UPDATE_CODE, enabled);
    set({ autoUpdateCode: enabled });
  },

  setTheme: (theme) => {
    storage.set(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  setFontSize: (fontSize) => {
    storage.set(STORAGE_KEYS.FONT_SIZE, fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
    set({ fontSize });
  },

  logout: () => {
    storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    storage.remove(STORAGE_KEYS.CURRENT_USER);
    set({ user: null });
  },
}));