import type { UserRole } from './auth.types'

export interface User {
  user_id: number
  full_name: string
  username: string
  email?: string
  phone?: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface UserFormData {
  full_name: string
  username: string
  email?: string
  phone?: string
  password?: string
  role: UserRole
  is_active: boolean
}
