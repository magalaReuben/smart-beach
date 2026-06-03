import servingPlaceApi from '@/apis/servingPlaces'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useServingPlacesQuery = () => {
  return useQuery({
    queryKey: ['servingPlaces'],
    queryFn: servingPlaceApi.getServingPlaces,
  })
}

export const useCreateServingPlaceMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: servingPlaceApi.createServingPlace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servingPlaces'] })
    },
  })
}

export const useUpdateServingPlaceMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; name: string; description: string }) =>
      servingPlaceApi.updateServingPlace(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servingPlaces'] })
    },
  })
}

export const useDeleteServingPlaceMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => servingPlaceApi.deleteServingPlace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servingPlaces'] })
    },
  })
}
