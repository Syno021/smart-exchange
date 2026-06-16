import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Refetch active server data whenever the user navigates to a new page. */
export function QueryRefetchOnNavigate() {
  const { pathname } = useLocation()
  const queryClient = useQueryClient()

  useEffect(() => {
    void queryClient.refetchQueries({ type: 'active' })
  }, [pathname, queryClient])

  return null
}
