import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api'

export function useSessionUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch('/api/auth/me'),
    retry: false,
  })
}
