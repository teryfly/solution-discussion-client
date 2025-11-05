import { API_URL, getHeaders, handleApiError } from './config';

export class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    needsAuth: boolean = false
  ): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...getHeaders(needsAuth),
          ...options.headers,
        },
      });

      // 严格检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: response.statusText || '请求失败'
        }));
        
        throw {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          },
        };
      }

      // 确保返回有效的 JSON 数据
      const data = await response.json();
      
      // 验证返回数据不为空
      if (data === null || data === undefined) {
        throw new Error('服务器返回数据为空');
      }

      return data;
    } catch (error) {
      // 统一错误处理，确保所有错误都被正确抛出
      return handleApiError(error);
    }
  }

  async get<T>(endpoint: string, needsAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, needsAuth);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    needsAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      needsAuth
    );
  }

  async put<T>(
    endpoint: string,
    data?: any,
    needsAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      needsAuth
    );
  }

  async delete<T>(endpoint: string, needsAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, needsAuth);
  }
}

export const apiClient = new ApiClient();