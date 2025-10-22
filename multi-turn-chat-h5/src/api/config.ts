export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_VERSION = '/v1';
export const API_URL = `${API_BASE_URL}${API_VERSION}`;

export const getAuthToken = (): string => {
  return localStorage.getItem('auth_token') || '';
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

export const getHeaders = (needsAuth: boolean = false): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (needsAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

export const handleApiError = (error: any): never => {
  if (error.response) {
    const detail = error.response.data?.detail || error.response.statusText;
    throw new Error(detail);
  } else if (error.request) {
    throw new Error('网络连接失败，请检查网络');
  } else {
    throw new Error(error.message || '未知错误');
  }
};