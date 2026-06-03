'use client'
import menuItems from '@/app/manage/menuItems'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { PanelLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppContext } from '@/components/app-provider'
import { Role } from '@/constants/type'

export default function MobileNavLinks() {
  const pathname = usePathname()
  const { role } = useAppContext()
  const isEmployeeOrWaiter = role === Role.Employee || role === Role.Waiter
  const allowedPaths = ['/manage/orders', '/manage/tables', '/manage/dishes']
  const menuItemsByRole = isEmployeeOrWaiter
    ? menuItems.filter((item) => allowedPaths.includes(item.href))
    : menuItems

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size='icon' variant='outline' className='sm:hidden'>
          <PanelLeft className='h-5 w-5' />
          <span className='sr-only'>Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='sm:max-w-xs'>
        <nav className='grid gap-6 text-lg font-medium w-full'>
          <Link
            href='/manage/dashboard'
            className='group flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-white text-primary-foreground shadow-sm'
          >
            <Image src='/large.png' alt='Smart Beach logo' width={44} height={44} className='h-10 w-10 rounded-full object-cover' />
            <span className='sr-only'>Smart Beach</span>
          </Link>
          {menuItemsByRole.map((Item, index) => {
            const isActive = pathname === Item.href
            return (
              <Link
                key={index}
                href={Item.href}
                className={cn('flex items-center gap-4 px-2.5  hover:text-foreground', {
                  'text-foreground': isActive,
                  'text-muted-foreground': !isActive
                })}
              >
                <Item.Icon className='h-5 w-5' />
                {Item.title}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
