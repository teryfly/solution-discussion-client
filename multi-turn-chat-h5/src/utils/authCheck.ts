import { storage, STORAGE_KEYS } from './storage';

export const validateStoredUser = (): boolean => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!userStr) return false;

    const user = JSON.parse(userStr);
    const valid =
      user &&
      typeof user === 'object' &&
      typeof user.id === 'string' &&
      user.id.trim().length > 0 &&
      typeof user.username === 'string' &&
      user.username.trim().length > 0 &&
      typeof user.name === 'string' &&
      user.name.trim().length > 0;

    if (!valid) {
      storage.remove(STORAGE_KEYS.CURRENT_USER);
      return false;
    }
    return true;
  } catch {
    storage.remove(STORAGE_KEYS.CURRENT_USER);
    return false;
  }
};

export const initAuthCheck = (): void => {
  const isValid = validateStoredUser();
  const currentPath = window.location.pathname;
  if (!isValid && currentPath !== '/login') {
    storage.remove(STORAGE_KEYS.CURRENT_USER);
    storage.remove(STORAGE_KEYS.CURRENT_PROJECT);
    window.location.href = '/login';
  }
};