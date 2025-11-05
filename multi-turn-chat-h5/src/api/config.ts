export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_VERSION = '/v1';
export const API_URL = `${API_BASE_URL}${API_VERSION}`;

export const getHeaders = (_needsAuth: boolean = false): HeadersInit => {
  return { 'Content-Type': 'application/json' };
};

export const handleApiError = (error: any): never => {
  if (error.response) {
    const detail = error.response.data?.detail || error.response.statusText || '请求失败';
    throw new Error(detail);
  } else if (error.request) {
    throw new Error('网络连接失败，请检查网络');
  } else {
    throw new Error(error.message || '未知错误');
  }
};