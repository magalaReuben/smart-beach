'use client'

import { useMemo, useState } from 'react'
import { useWaitersQuery, useCreateWaiterMutation, useUpdateWaiterMutation, useDeleteWaiterMutation } from '@/queries/useWaiters'
import { useGetOrderListQuery } from '@/queries/useOrder'
import { useServingPlacesQuery } from '@/queries/useServingPlaces'
import { Button } from '@/components/ui/button'
import { OrderStatus } from '@/constants/type'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { Pencil, Trash2, Plus } from 'lucide-react'

type SaleRecord = {
  date: string
  amount: number
}

type Waiter = {
  id: number
  name: string
  notes: string
  sales: SaleRecord[]
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function WaitersPage() {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteWaiter, setDeleteWaiter] = useState<Waiter | null>(null)
  const [fromDate, setFromDate] = useState(getToday())
  const [toDate, setToDate] = useState(getToday())
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)

  const { data: waiters = [] } = useWaitersQuery()
  const orderListQuery = useGetOrderListQuery({})
  const { data: servingPlaces = [] } = useServingPlacesQuery()
  const createMutation = useCreateWaiterMutation()
  const updateMutation = useUpdateWaiterMutation()
  const deleteMutation = useDeleteWaiterMutation()

  const orders = orderListQuery.data?.payload.data ?? []
  const selectedWaiter = waiters.find((waiter) => waiter.id === selectedId) ?? null

  const waiterNameToId = useMemo(() => {
    const map = new Map<string, number>()
    waiters.forEach((waiter) => {
      const normalized = waiter.name.trim().toLowerCase()
      if (normalized) {
        map.set(normalized, waiter.id)
      }
    })
    return map
  }, [waiters])

  const orderTotalsByWaiter = useMemo(() => {
    const totals = new Map<number, { total: number; today: number }>()
    const today = getToday()
    orders.forEach((order: any) => {
      if (order.status !== OrderStatus.Paid) return
      const waiterName = order.orderHandler?.name?.trim().toLowerCase()
      const waiterId = waiterName ? waiterNameToId.get(waiterName) : undefined
      if (waiterId === undefined || !Number.isFinite(waiterId)) return
      const amount = order.dishSnapshot.price * order.quantity
      const entry = totals.get(waiterId) ?? { total: 0, today: 0 }
      entry.total += amount
      if (order.createdAt?.slice(0, 10) === today) {
        entry.today += amount
      }
      totals.set(waiterId, entry)
    })
    return totals
  }, [orders, waiterNameToId])

  const selectedWaiterOrders = useMemo(() => {
    if (!selectedWaiter) return []
    const from = new Date(fromDate)
    const to = new Date(toDate)
    const selectedName = selectedWaiter.name.trim().toLowerCase()
    return orders.filter((order: any) => {
      if (order.status !== OrderStatus.Paid) return false
      if (order.orderHandler?.name?.trim().toLowerCase() !== selectedName) return false
      const orderDate = new Date(order.createdAt)
      return orderDate >= from && orderDate <= to
    })
  }, [orders, selectedWaiter, fromDate, toDate])

  const selectedWaiterLocationTotals = useMemo(() => {
    if (!selectedWaiter) return []
    const totals = new Map<number, number>()
    selectedWaiterOrders.forEach((order: any) => {
      const placeId = order.servingPlaceId
      if (!placeId) return
      const amount = order.dishSnapshot.price * order.quantity
      totals.set(placeId, (totals.get(placeId) ?? 0) + amount)
    })

    return Array.from(totals.entries())
      .map(([placeId, amount]) => ({
        placeId,
        name: servingPlaces.find((place: any) => place.id === placeId)?.name || `Location ${placeId}`,
        amount,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [selectedWaiterOrders, servingPlaces])

  const selectedLocationName = selectedLocationId
    ? servingPlaces.find((place: any) => place.id === selectedLocationId)?.name || 'Selected location'
    : 'All locations'

  const selectedLocationSales = useMemo(() => {
    if (!selectedWaiter || !selectedLocationId) return 0
    return selectedWaiterOrders
      .filter((order: any) => order.servingPlaceId === selectedLocationId)
      .reduce((total: number, order: any) => total + order.dishSnapshot.price * order.quantity, 0)
  }, [selectedWaiterOrders, selectedLocationId])

  const filteredWaiters = useMemo(() => {
    if (!searchTerm.trim()) return waiters
    const query = searchTerm.trim().toLowerCase()
    return waiters.filter((waiter) => waiter.name.toLowerCase().includes(query))
  }, [waiters, searchTerm])

  const handleWaiterSelect = (value: string) => {
    const id = Number(value)
    setSelectedId(Number.isFinite(id) ? id : null)
  }

  const handleSelect = (waiter: Waiter) => {
    setSelectedId(waiter.id)
  }

  const periodTotal = useMemo(() => {
    if (!selectedWaiter) return 0
    const from = new Date(fromDate)
    const to = new Date(toDate)
    const baseSales = selectedWaiter.sales
      .filter((sale) => {
        const date = new Date(sale.date)
        return date >= from && date <= to
      })
      .reduce((total: number, sale: SaleRecord) => total + sale.amount, 0)
    const orderSales = selectedWaiterOrders.reduce(
      (total: number, order: any) => total + order.dishSnapshot.price * order.quantity,
      0
    )
    return baseSales + orderSales
  }, [fromDate, selectedWaiter, selectedWaiterOrders, toDate])

  const todaySales = useMemo(() => {
    if (!selectedWaiter) return 0
    const baseTodaySales = selectedWaiter.sales
      .filter((sale) => sale.date === getToday())
      .reduce((total: number, sale: SaleRecord) => total + sale.amount, 0)
    const selectedName = selectedWaiter.name.trim().toLowerCase()
    const orderTodaySales = orders
      .filter(
        (order: any) =>
          order.orderHandler?.name?.trim().toLowerCase() === selectedName &&
          order.status === OrderStatus.Paid &&
          order.createdAt?.slice(0, 10) === getToday()
      )
      .reduce((total: number, order: any) => total + order.dishSnapshot.price * order.quantity, 0)
    return baseTodaySales + orderTodaySales
  }, [orders, selectedWaiter])

  const resetForm = () => {
    setSelectedId(null)
    setName('')
    setNotes('')
  }

  const openModalForNew = () => {
    resetForm()
    setModalOpen(true)
  }

  const closeModal = () => {
    resetForm()
    setModalOpen(false)
  }

  const handleSave = () => {
    if (!name.trim()) {
      return
    }

    const payload = {
      name: name.trim(),
      notes: notes.trim(),
    }

    if (selectedId) {
      updateMutation.mutate(
        { id: selectedId, ...payload },
        {
          onSuccess: closeModal,
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: closeModal,
    })
  }

  const handleEdit = (waiter: Waiter) => {
    setSelectedId(waiter.id)
    setName(waiter.name)
    setNotes(waiter.notes)
    setModalOpen(true)
  }

  const openDeleteDialog = (waiter: Waiter) => {
    setDeleteWaiter(waiter)
    setDeleteDialogOpen(true)
  }

  const handleDelete = (waiterId: number) => {
    deleteMutation.mutate(waiterId, {
      onSuccess: () => {
        if (selectedId === waiterId) {
          resetForm()
          setModalOpen(false)
        }
        setDeleteDialogOpen(false)
        setDeleteWaiter(null)
      },
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-2xl font-semibold'>Waiters</h1>
            <Badge variant='secondary'>Sales tracking</Badge>
          </div>
          <Button onClick={openModalForNew}>
            <Plus className='mr-2 h-4 w-4' />
            Add waiter
          </Button>
        </div>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          Add and manage waiters, then review each waiter’s sales performance by period.
        </p>
      </div>

      <div className='grid gap-4 lg:grid-cols-[1fr_1fr]'>
        <div className='rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900'>
          <div className='flex flex-col gap-3'>
            <div>
              <p className='text-sm font-medium'>Waiter summary</p>
              <p className='text-xs text-muted-foreground'>Select a waiter from the roster to review sales totals.</p>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='waiter-select'>Choose waiter</Label>
                <Select value={selectedId?.toString()} onValueChange={handleWaiterSelect}>
                  <SelectTrigger id='waiter-select'>
                    <SelectValue placeholder='Search waiters...' />
                  </SelectTrigger>
                  <SelectContent>
                    <div className='p-2'>
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder='Search waiters...'
                        className='w-full'
                      />
                    </div>
                    {filteredWaiters.length === 0 ? (
                      <div className='px-3 py-2 text-sm text-muted-foreground'>No matching waiters found.</div>
                    ) : (
                      filteredWaiters.map((waiter) => (
                        <SelectItem key={waiter.id} value={waiter.id.toString()}>
                          {waiter.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className='rounded-xl border p-4'>
                <p className='text-sm text-muted-foreground'>Selected waiter</p>
                <p className='mt-2 font-semibold'>{selectedWaiter?.name ?? 'None selected'}</p>
              </div>
              <div className='rounded-xl border p-4'>
                <p className='text-sm text-muted-foreground'>Notes</p>
                <p className='mt-2 text-sm'>{selectedWaiter?.notes ?? 'No notes yet'}</p>
              </div>
              <div className='rounded-xl border p-4'>
                <p className='text-sm text-muted-foreground'>Location breakdown</p>
                {selectedWaiter ? (
                  selectedWaiterLocationTotals.length > 0 ? (
                    <ul className='mt-3 space-y-2'>
                      {selectedWaiterLocationTotals.map((location) => (
                        <li key={location.placeId} className='flex items-center justify-between rounded-md border px-3 py-2'>
                          <span className='text-sm'>{location.name}</span>
                          <span className='text-sm font-semibold'>{formatCurrency(location.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='mt-2 text-sm text-muted-foreground'>No orders found for the selected date range.</p>
                  )
                ) : (
                  <p className='mt-2 text-sm text-muted-foreground'>Select a waiter to view location details.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm font-medium'>Performance summary</p>
              <p className='text-xs text-muted-foreground'>Filter sales totals for the selected waiter.</p>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
              <div className='grid gap-2'>
                <Label htmlFor='location-select'>Location</Label>
                <Select
                  value={selectedLocationId?.toString() ?? 'all'}
                  onValueChange={(value) => setSelectedLocationId(value === 'all' ? null : Number(value))}
                >
                  <SelectTrigger id='location-select'>
                    <SelectValue placeholder='All locations' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All locations</SelectItem>
                    {servingPlaces.map((place) => (
                      <SelectItem key={place.id} value={place.id.toString()}>
                        {place.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='from-date'>From</Label>
                <Input id='from-date' type='date' value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='to-date'>To</Label>
                <Input id='to-date' type='date' value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          </div>
          <div className='mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'>
            <div className='rounded-xl border p-4'>
              <p className='text-sm text-muted-foreground'>Total sales</p>
              <p className='mt-2 font-semibold'>{formatCurrency(periodTotal)}</p>
            </div>
            <div className='rounded-xl border p-4'>
              <p className='text-sm text-muted-foreground'>Today sales</p>
              <p className='mt-2 font-semibold'>{formatCurrency(todaySales)}</p>
            </div>
            <div className='rounded-xl border p-4'>
              <p className='text-sm text-muted-foreground'>Location sales</p>
              <p className='mt-2 font-semibold'>{formatCurrency(selectedLocationSales)}</p>
              <p className='text-xs text-muted-foreground mt-1'>{selectedLocationName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900'>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold'>Waiter roster</h2>
            <p className='text-sm text-muted-foreground'>Edit, delete or select a waiter to review sales.</p>
          </div>
          <Badge variant='secondary'>{waiters.length} staff</Badge>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full border-separate border-spacing-y-2'>
            <thead>
              <tr className='text-left text-sm text-muted-foreground'>
                <th className='pb-3 pl-4'>Name</th>
                <th className='pb-3'>Today</th>
                <th className='pb-3'>Total</th>
                <th className='pb-3 pr-4'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {waiters.map((waiter) => {
                const orderSummary = orderTotalsByWaiter.get(waiter.id) ?? { total: 0, today: 0 }
                const total = waiter.sales.reduce((sum, sale) => sum + sale.amount, 0) + orderSummary.total
                const today = waiter.sales
                  .filter((sale) => sale.date === getToday())
                  .reduce((sum, sale) => sum + sale.amount, 0) + orderSummary.today
                return (
                  <tr key={waiter.id} className={
                  `rounded-xl border ${waiter.id === selectedId ? 'bg-slate-200 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-950'}`
                }>
                    <td className='pl-4 py-3'>
                      <button type='button' className='text-left text-sm font-medium' onClick={() => handleSelect(waiter)}>
                        {waiter.name}
                      </button>
                    </td>
                    <td className='py-3 text-sm'>{formatCurrency(today)}</td>
                    <td className='py-3 text-sm'>{formatCurrency(total)}</td>
                    <td className='pr-4 py-3'>
                      <div className='flex gap-2'>
                        <Button size='sm' variant='outline' onClick={() => handleEdit(waiter)}>
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button size='sm' variant='destructive' onClick={() => openDeleteDialog(waiter)}>
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open)
        if (!open) setDeleteWaiter(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete waiter?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{deleteWaiter?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteWaiter && handleDelete(deleteWaiter.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={modalOpen} onOpenChange={(open) => (open ? setModalOpen(true) : closeModal())}>
        <DialogContent className='sm:max-w-[600px] max-h-screen overflow-auto'>
          <DialogHeader>
            <DialogTitle>{selectedId ? 'Edit waiter' : 'Add waiter'}</DialogTitle>
            <DialogDescription>
              {selectedId ? 'Update waiter details and save changes.' : 'Create a new waiter record for your team.'}
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4 space-y-4'>
            <div className='grid gap-2'>
              <Label htmlFor='waiter-name'>Name</Label>
              <Input id='waiter-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Staff name' />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='waiter-notes'>Notes</Label>
              <Textarea id='waiter-notes' value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='Any additional team notes.' />
            </div>
          </div>
          <DialogFooter className='mt-6 justify-end'>
            <Button variant='outline' onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedId ? 'Save waiter' : 'Add waiter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
