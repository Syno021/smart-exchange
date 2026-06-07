import api from '../lib/axios'
import type { ApiResponse } from '../types/api.types'
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
} from '../types/auth.types'

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<{ user_id: number }>>('/auth/register', payload),

  me: () => api.get<ApiResponse<AuthUser>>('/auth/me'),
}
