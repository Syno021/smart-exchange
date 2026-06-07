export interface Supplier {
  supplier_id: number
  user_id?: number
  company_name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  tax_number?: string
  payment_terms?: string
  rating: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierFormData {
  company_name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  tax_number?: string
  payment_terms?: string
  is_active?: boolean
}
