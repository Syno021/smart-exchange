export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Customer {
  customer_id: number
  user_id?: number
  full_name?: string
  email?: string
  phone?: string
  address?: string
  loyalty_points: number
  loyalty_tier: LoyaltyTier
  total_spent: number
  created_at: string
  updated_at: string
}
