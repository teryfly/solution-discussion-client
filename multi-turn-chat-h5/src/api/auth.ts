import { apiClient } from './client';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  name: string;
  user: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', data, false);
  },
};