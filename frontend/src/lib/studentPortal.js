import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export function usePortal() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['student-portal', user?.id],
    queryFn: () => api.studentPortal.overview().then(r => r.data),
    enabled: ['student', 'boarding'].includes(user?.role),
    refetchInterval: 60000,
  })
}

export function useInbox() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['student-inbox', user?.id],
    queryFn: () => api.studentPortal.notifications().then(r => r.data),
    enabled: ['student', 'boarding'].includes(user?.role),
    refetchInterval: 30000,
  })
}
