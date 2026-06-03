import http from '@/lib/http'

type WaiterCreateBody = {
  name: string
  notes: string
}

type Waiter = {
  id: number
  name: string
  notes: string
  sales: Array<{ date: string; amount: number }>
}

const waiterApi = {
  getWaiters: async (): Promise<Waiter[]> => {
    const result = await http.get<{ data: Waiter[] }>('/api/waiters', {
      baseUrl: '',
    })
    return result.payload.data
  },

  createWaiter: async (body: WaiterCreateBody): Promise<Waiter> => {
    const result = await http.post<{ data: Waiter }>('/api/waiters', body, {
      baseUrl: '',
    })
    return result.payload.data
  },

  updateWaiter: async (id: number, body: WaiterCreateBody): Promise<Waiter> => {
    const result = await http.put<{ data: Waiter }>(`/api/waiters/${id}`, body, {
      baseUrl: '',
    })
    return result.payload.data
  },

  deleteWaiter: async (id: number) => {
    await http.delete(`/api/waiters/${id}`, {
      baseUrl: '',
    })
    return id
  },
}

export default waiterApi
