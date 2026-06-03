import OrderTable from '@/app/manage/orders/order-table'
import MakeOrder from '@/app/manage/orders/make-order'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import { Suspense } from 'react'

export default function AccountsPage() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Manage orders</CardDescription>
            </div>
            <MakeOrder />
          </CardHeader>
          <CardContent>
            <Suspense>
              <OrderTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
