import { API_URL, getHeaders, handleApiError } from './config';
import type { ApiResponse } from '../types';

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          },
        };
      }

      return await response.json();
    } catch (error) {
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