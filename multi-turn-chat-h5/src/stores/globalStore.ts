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
  isAuthenticated: () => boolean;
}

const validateUser = (user: any): user is User => {
  return !!(
    user &&
    typeof user === 'object' &&
    typeof user.id === 'string' &&
    user.id.trim().length > 0 &&
    typeof user.username === 'string' &&
    user.username.trim().length > 0 &&
    typeof user.name === 'string' &&
    user.name.trim().length > 0
  );
};

const getInitialUser = (): User | null => {
  const stored = storage.get<User>(STORAGE_KEYS.CURRENT_USER);
  if (validateUser(stored)) return stored;
  storage.remove(STORAGE_KEYS.CURRENT_USER);
  return null;
};

export const useGlobalStore = create<GlobalState>((set, get) => ({
  user: getInitialUser(),
  currentProject: storage.get<Project>(STORAGE_KEYS.CURRENT_PROJECT),
  autoUpdateCode: storage.get<boolean>(STORAGE_KEYS.AUTO_UPDATE_CODE, false),
  theme: storage.get<'light' | 'dark'>(STORAGE_KEYS.THEME, 'light'),
  fontSize: storage.get<'small' | 'medium' | 'large'>(STORAGE_KEYS.FONT_SIZE, 'medium'),

  setUser: (user) => {
    if (user && !validateUser(user)) {
      storage.remove(STORAGE_KEYS.CURRENT_USER);
      set({ user: null });
      return;
    }
    if (user) {
      storage.set(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      storage.remove(STORAGE_KEYS.CURRENT_USER);
    }
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
    storage.remove(STORAGE_KEYS.CURRENT_USER);
    storage.remove(STORAGE_KEYS.CURRENT_PROJECT);
    set({ user: null, currentProject: null });
  },

  isAuthenticated: () => validateUser(get().user),
}));