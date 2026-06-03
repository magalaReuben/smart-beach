import http from '@/lib/http'

type ServingPlaceCreateBody = {
  name: string
  description: string
}

type ServingPlace = {
  id: number
  name: string
  description: string
  sales: Array<{ date: string; amount: number }>
}

const servingPlaceApi = {
  getServingPlaces: async (): Promise<ServingPlace[]> => {
    const result = await http.get<{ data: ServingPlace[] }>('/api/serving-places', {
      baseUrl: '',
    })
    return result.payload.data
  },

  createServingPlace: async (body: ServingPlaceCreateBody): Promise<ServingPlace> => {
    const result = await http.post<{ data: ServingPlace }>('/api/serving-places', body, {
      baseUrl: '',
    })
    return result.payload.data
  },

  updateServingPlace: async (id: number, body: ServingPlaceCreateBody): Promise<ServingPlace> => {
    const result = await http.put<{ data: ServingPlace }>(`/api/serving-places/${id}`, body, {
      baseUrl: '',
    })
    return result.payload.data
  },

  deleteServingPlace: async (id: number) => {
    await http.delete(`/api/serving-places/${id}`, {
      baseUrl: '',
    })
    return id
  },
}

export default servingPlaceApi
