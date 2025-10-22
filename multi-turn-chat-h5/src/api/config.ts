export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_VERSION = '/v1';
export const API_URL = `${API_BASE_URL}${API_VERSION}`;

export const getAuthToken = (): string => {
  const token = localStorage.getItem('auth_token') || '';
  
  // 调试：打印 token 信息
  if (import.meta.env.DEV) {
    if (!token) {
      console.warn('⚠️ 未找到认证 Token');
    } else if (!token.startsWith('sk-test') && !token.startsWith('poe-sk')) {
      console.warn('⚠️ Token 格式不正确，应以 sk-test 或 poe-sk 开头:', token);
    } else {
      console.log('✅ Token 验证通过:', token.substring(0, 20) + '...');
    }
  }
  
  return token;
};

export const setAuthToken = (token: string): void => {
  if (!token) {
    console.error('❌ 尝试设置空 Token');
    return;
  }
  
  if (import.meta.env.DEV) {
    console.log('📝 设置 Token:', token.substring(0, 20) + '...');
  }
  
  localStorage.setItem('auth_token', token);
};

export const clearAuthToken = (): void => {
  if (import.meta.env.DEV) {
    console.log('🗑️ 清除 Token');
  }
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
    } else {
      console.error('❌ 需要认证但未找到 Token');
    }
  }
  
  return headers;
};

export const handleApiError = (error: any): never => {
  if (error.response) {
    const detail = error.response.data?.detail || error.response.statusText;
    
    // 特殊处理 401 错误
    if (error.response.status === 401) {
      console.error('❌ 认证失败，请检查 Token 是否正确');
      clearAuthToken();
      // 可以在这里触发跳转到登录页
      // window.location.href = '/login';
    }
    
    throw new Error(detail);
  } else if (error.request) {
    throw new Error('网络连接失败，请检查网络');
  } else {
    throw new Error(error.message || '未知错误');
  }
};