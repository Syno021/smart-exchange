export type UserRole = 'admin' | 'manager' | 'cashier' | 'customer' | 'supplier'

export interface AuthUser {
  user_id: number
  full_name: string
  username: string
  email: string
  role: UserRole
  avatar_url?: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface RegisterPayload {
  full_name: string
  username: string
  email?: string
  password: string
}
