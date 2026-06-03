import waiterApi from '@/apis/waiters'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useWaitersQuery = () => {
  return useQuery({
    queryKey: ['waiters'],
    queryFn: waiterApi.getWaiters,
  })
}

export const useCreateWaiterMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: waiterApi.createWaiter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters'] })
    },
  })
}

export const useUpdateWaiterMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; name: string; notes: string }) =>
      waiterApi.updateWaiter(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters'] })
    },
  })
}

export const useDeleteWaiterMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => waiterApi.deleteWaiter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters'] })
    },
  })
}
