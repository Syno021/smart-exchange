import api from '../lib/axios'
import type { ApiResponse, Category, PaginatedResponse } from '../types/api.types'
import type { Product, ProductFilters, ProductFormData } from '../types/product.types'

export const productService = {
  getAll: (params?: ProductFilters) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),

  getById: (id: number) => api.get<ApiResponse<Product>>(`/products/${id}`),

  getLowStock: () => api.get<ApiResponse<Product[]>>('/products/low-stock'),

  create: (payload: ProductFormData) =>
    api.post<ApiResponse<{ product_id: number }>>('/products', payload),

  update: (id: number, payload: Partial<ProductFormData>) =>
    api.put<ApiResponse<null>>(`/products/${id}`, payload),

  delete: (id: number) => api.delete<ApiResponse<null>>(`/products/${id}`),

  getCategories: () => api.get<ApiResponse<Category[]>>('/categories'),
}
