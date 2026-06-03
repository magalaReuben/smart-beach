'use client'

import { useMemo, useState } from 'react'
import { useServingPlacesQuery, useCreateServingPlaceMutation, useUpdateServingPlaceMutation, useDeleteServingPlaceMutation } from '@/queries/useServingPlaces'
import { Button } from '@/components/ui/button'
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

type ServingPlace = {
  id: number
  name: string
  description: string
  sales: SaleRecord[]
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function ServingPlacesPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePlace, setDeletePlace] = useState<ServingPlace | null>(null)
  const [fromDate, setFromDate] = useState(getToday())
  const [toDate, setToDate] = useState(getToday())

  const { data: places = [] } = useServingPlacesQuery()
  const createMutation = useCreateServingPlaceMutation()
  const updateMutation = useUpdateServingPlaceMutation()
  const deleteMutation = useDeleteServingPlaceMutation()

  const selectedPlace = places.find((place) => place.id === selectedId) ?? null

  const filteredPlaces = useMemo(() => {
    if (!searchTerm.trim()) return places
    const query = searchTerm.trim().toLowerCase()
    return places.filter((place) => place.name.toLowerCase().includes(query))
  }, [places, searchTerm])

  const handlePlaceSelect = (value: string) => {
    const id = Number(value)
    setSelectedId(Number.isFinite(id) ? id : null)
  }

  const periodTotal = useMemo(() => {
    if (!selectedPlace) return 0
    const from = new Date(fromDate)
    const to = new Date(toDate)
    return selectedPlace.sales
      .filter((sale) => {
        const date = new Date(sale.date)
        return date >= from && date <= to
      })
      .reduce((total, sale) => total + sale.amount, 0)
  }, [fromDate, selectedPlace, toDate])

  const todaySales = useMemo(() => {
    if (!selectedPlace) return 0
    return selectedPlace.sales
      .filter((sale) => sale.date === getToday())
      .reduce((total, sale) => total + sale.amount, 0)
  }, [selectedPlace])

  const resetForm = () => {
    setSelectedId(null)
    setName('')
    setDescription('')
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
      description: description.trim(),
    }

    if (selectedId !== null) {
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

  const handleEdit = (place: ServingPlace) => {
    setSelectedId(place.id)
    setName(place.name)
    setDescription(place.description)
    setModalOpen(true)
  }

  const handleSelect = (place: ServingPlace) => {
    setSelectedId(place.id)
  }

  const openDeleteDialog = (place: ServingPlace) => {
    setDeletePlace(place)
    setDeleteDialogOpen(true)
  }

  const handleDelete = (placeId: number) => {
    deleteMutation.mutate(placeId, {
      onSuccess: () => {
        if (selectedId === placeId) {
          resetForm()
          setModalOpen(false)
        }
        setDeleteDialogOpen(false)
        setDeletePlace(null)
      },
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-semibold'>Serving places</h1>
            <Badge variant='secondary'>Light mode</Badge>
          </div>
          <Button onClick={() => {
            resetForm()
            setModalOpen(true)
          }}>
            <Plus className='mr-2 h-4 w-4' />
            Add place
          </Button>
        </div>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          Add, edit or delete serving points, and review their sales for a selected period.
        </p>
      </div>

      <div className='rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='grid gap-2'>
            <p className='text-sm font-medium'>Selected place stats</p>
            <p className='text-xs text-muted-foreground'>Choose a place from the list to review sales totals.</p>
            <div className='grid gap-2 sm:w-[320px]'>
              <Label htmlFor='serving-place-select'>Select place</Label>
              <Select value={selectedId?.toString() ?? ''} onValueChange={handlePlaceSelect}>
                <SelectTrigger id='serving-place-select'>
                  <SelectValue placeholder='Choose a place' />
                </SelectTrigger>
                <SelectContent>
                  <div className='p-2'>
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder='Search places...'
                      className='w-full'
                    />
                  </div>
                  {filteredPlaces.length === 0 ? (
                    <div className='px-3 py-2 text-sm text-muted-foreground'>No matching places found.</div>
                  ) : (
                    filteredPlaces.map((place) => (
                      <SelectItem key={place.id} value={place.id.toString()}>
                        {place.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
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
        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
          <div className='rounded-xl border p-4'>
            <p className='text-sm text-muted-foreground'>Selected place</p>
            <p className='mt-2 font-semibold'>{selectedPlace?.name ?? 'None selected'}</p>
          </div>
          <div className='rounded-xl border p-4'>
            <p className='text-sm text-muted-foreground'>Total sales</p>
            <p className='mt-2 font-semibold'>{formatCurrency(periodTotal)}</p>
          </div>
          <div className='rounded-xl border p-4'>
            <p className='text-sm text-muted-foreground'>Today sales</p>
            <p className='mt-2 font-semibold'>{formatCurrency(todaySales)}</p>
          </div>
        </div>
      </div>

      <div className='rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900'>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold'>Serving place list</h2>
            <p className='text-sm text-muted-foreground'>Click a place to load its sales summary.</p>
          </div>
          <Badge variant='secondary'>{places.length} locations</Badge>
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
              {places.map((place) => {
                const total = place.sales.reduce((sum, sale) => sum + sale.amount, 0)
                const today = place.sales
                  .filter((sale) => sale.date === getToday())
                  .reduce((sum, sale) => sum + sale.amount, 0)
                return (
                  <tr key={place.id} className='rounded-xl border bg-slate-50 dark:bg-slate-950'>
                    <td className='pl-4 py-3'>
                      <button type='button' className='text-left text-sm font-medium' onClick={() => handleSelect(place)}>
                        {place.name}
                      </button>
                    </td>
                    <td className='py-3 text-sm'>{formatCurrency(today)}</td>
                    <td className='py-3 text-sm'>{formatCurrency(total)}</td>
                    <td className='pr-4 py-3'>
                      <div className='flex gap-2'>
                        <Button size='sm' variant='outline' onClick={() => handleEdit(place)}>
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button size='sm' variant='destructive' onClick={() => openDeleteDialog(place)}>
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
        if (!open) setDeletePlace(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete serving place?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{deletePlace?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePlace && handleDelete(deletePlace.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={modalOpen} onOpenChange={(open) => (open ? setModalOpen(true) : closeModal())}>
        <DialogContent className='sm:max-w-[600px] max-h-screen overflow-auto'>
          <DialogHeader>
            <DialogTitle>{selectedId !== null ? 'Edit serving place' : 'Add serving place'}</DialogTitle>
            <DialogDescription>
              {selectedId !== null ? 'Update the selected place details.' : 'Add a new serving place to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4 space-y-4'>
            <div className='grid gap-2'>
              <Label htmlFor='place-name'>Name</Label>
              <Input id='place-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Beach bar, pool side, etc.' />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='place-description'>Description</Label>
              <Textarea id='place-description' value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Short notes about this serving point.' />
            </div>
          </div>
          <DialogFooter className='mt-6 justify-end'>
            <Button variant='outline' onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedId !== null ? 'Save place' : 'Add place'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
