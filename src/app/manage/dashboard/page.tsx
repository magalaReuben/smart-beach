import accountApi from '@/apis/account'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cookies } from 'next/headers'
import React from 'react'
import sqlite from '@/lib/sqlite'
import { formatCurrency } from '@/lib/utils'

export default async function Dashboard() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  let name = 'Manager'

  try {
    if (accessToken) {
      const result = await accountApi.sGetPersonalAccount(accessToken)
      name = result.payload.data.name || name
    }
  } catch (error: any) {
    if (error?.digest?.includes('NEXT_REDIRECT')) throw error
  }

  await sqlite.initDatabase()
  const accounts = sqlite.getAccounts()
  const dishes = sqlite.getDishes()
  const orders = sqlite.getOrders()
  const servingPlaces = sqlite.getServingPlaces()
  const waiters = sqlite.getWaiters()
  const guests = sqlite.getGuests()

  const today = new Date().toISOString().slice(0, 10)
  const todayOrders = orders.filter(
    (order) => order.createdAt.slice(0, 10) === today
  )
  const todayGuests = guests.filter(
    (guest) => guest.createdAt.slice(0, 10) === today
  )
  const todayRevenue = todayOrders.reduce(
    (sum, order) => sum + order.dishSnapshot.price * order.quantity,
    0
  )
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.dishSnapshot.price * order.quantity,
    0
  )

  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='grid gap-4 xl:grid-cols-[2fr_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {name}</CardTitle>
            <CardDescription>
              Today’s snapshot for {new Date().toLocaleDateString('en-GB')}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='rounded-3xl border border-indigo-200 bg-indigo-50/80 p-6 shadow-sm'>
                <p className='text-sm text-indigo-700'>Today's revenue</p>
                <p className='mt-3 text-4xl font-semibold text-indigo-950'>
                  {formatCurrency(todayRevenue)}
                </p>
                <p className='mt-2 text-sm text-indigo-600'>Orders processed today</p>
                <p className='text-2xl font-bold'>{todayOrders.length}</p>
              </div>
              <div className='rounded-3xl border border-sky-200 bg-sky-50/80 p-6 shadow-sm'>
                <p className='text-sm text-sky-700'>New guests today</p>
                <p className='mt-3 text-4xl font-semibold text-sky-950'>
                  {todayGuests.length}
                </p>
                <p className='mt-2 text-sm text-sky-600'>Active serving places</p>
                <p className='text-2xl font-bold'>{servingPlaces.length}</p>
              </div>
              <div className='rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm'>
                <p className='text-sm text-emerald-700'>Total waiters</p>
                <p className='mt-3 text-4xl font-semibold text-emerald-950'>
                  {waiters.length}
                </p>
                <p className='mt-2 text-sm text-emerald-600'>Staff accounts</p>
                <p className='text-2xl font-bold'>{accounts.length}</p>
              </div>
              <div className='rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm'>
                <p className='text-sm text-amber-700'>Total dishes</p>
                <p className='mt-3 text-4xl font-semibold text-amber-950'>
                  {dishes.length}
                </p>
                <p className='mt-2 text-sm text-amber-600'>Total orders recorded</p>
                <p className='text-2xl font-bold'>{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System totals</CardTitle>
            <CardDescription>Full system counts and historical metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='rounded-xl border p-4'>
                <p className='text-sm text-muted-foreground'>All-time revenue</p>
                <p className='mt-2 text-3xl font-semibold'>
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-xl border p-4'>
                  <p className='text-sm text-muted-foreground'>Total guests</p>
                  <p className='mt-2 text-2xl font-semibold'>{guests.length}</p>
                </div>
                <div className='rounded-xl border p-4'>
                  <p className='text-sm text-muted-foreground'>Serving places</p>
                  <p className='mt-2 text-2xl font-semibold'>
                    {servingPlaces.length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>Quick insights</CardTitle>
            <CardDescription>
              Things you should know for today’s operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='rounded-2xl bg-violet-950/5 p-4'>
                <p className='text-sm text-violet-700'>Best performing day</p>
                <p className='mt-2 text-lg font-semibold'>
                  Keep the momentum going — today has the highest order count so far.
                </p>
              </div>
              <div className='rounded-2xl bg-sky-950/5 p-4'>
                <p className='text-sm text-sky-700'>Guest growth</p>
                <p className='mt-2 text-lg font-semibold'>
                  {todayGuests.length} new guests added today.
                </p>
              </div>
              <div className='rounded-2xl bg-emerald-950/5 p-4'>
                <p className='text-sm text-emerald-700'>Revenue focus</p>
                <p className='mt-2 text-lg font-semibold'>
                  Today’s revenue is {formatCurrency(todayRevenue)}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational summary</CardTitle>
            <CardDescription>Hands-on insight for your service team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='rounded-2xl border border-slate-200 p-4'>
                <p className='text-sm text-muted-foreground'>Waiter coverage</p>
                <p className='mt-2 text-2xl font-semibold'>{waiters.length}</p>
              </div>
              <div className='rounded-2xl border border-slate-200 p-4'>
                <p className='text-sm text-muted-foreground'>Active serving points</p>
                <p className='mt-2 text-2xl font-semibold'>
                  {servingPlaces.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff overview</CardTitle>
            <CardDescription>Review your team readiness.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='rounded-2xl border border-slate-200 p-4'>
                <p className='text-sm text-muted-foreground'>Total staff</p>
                <p className='mt-2 text-2xl font-semibold'>{accounts.length}</p>
              </div>
              <div className='rounded-2xl border border-slate-200 p-4'>
                <p className='text-sm text-muted-foreground'>Menu items</p>
                <p className='mt-2 text-2xl font-semibold'>{dishes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
