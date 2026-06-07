import axios from 'axios'
import { coerceApiDecimals } from './coerceApiDecimals'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    if (
      res.data &&
      typeof res.data === 'object' &&
      !(res.data instanceof Blob) &&
      !(res.data instanceof ArrayBuffer)
    ) {
      res.data = coerceApiDecimals(res.data)
    }
    return res
  },
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
