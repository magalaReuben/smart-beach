'use client'
import Image from 'next/image'
import menuItems from '@/app/manage/menuItems'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Settings, Menu } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppContext } from '@/components/app-provider'
import { Role } from '@/constants/type'

interface NavLinksProps {
  expanded: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
}

export default function NavLinks({ expanded, setExpanded }: NavLinksProps) {
  const pathname = usePathname()
  const { role } = useAppContext()
  const isEmployeeOrWaiter = role === Role.Employee || role === Role.Waiter
  const allowedPaths = ['/manage/orders', '/manage/tables', '/manage/dishes']
  const menuItemsByRole = isEmployeeOrWaiter
    ? menuItems.filter((item) => allowedPaths.includes(item.href))
    : menuItems

  useEffect(() => {
    window.localStorage.setItem('smart-beach-sidebar-expanded', String(expanded))
  }, [expanded])

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-10 hidden min-h-screen flex-col border-r bg-background sm:flex transition-all duration-200 overflow-y-auto',
          expanded ? 'w-48' : 'w-16'
        )}
      >
        <nav className='flex flex-col items-center gap-4 px-2 py-4'>
          <div className='w-full flex items-center justify-between gap-2'>
            <Link href='/manage/dashboard' className='group flex h-12 w-12 items-center justify-center rounded-full border border-primary/10 bg-white shadow-sm transition hover:shadow-md overflow-hidden'>
              <Image src='/large.png' alt='Smart Beach logo' width={40} height={40} className='h-8 w-8 rounded-full object-cover' />
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' onClick={() => setExpanded((v) => !v)} aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
                  <Menu className='h-5 w-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right'>
                {expanded ? 'Collapse sidebar' : 'Expand sidebar'}
              </TooltipContent>
            </Tooltip>
          </div>

          {menuItemsByRole.map((Item, index) => {
            const isActive = pathname === Item.href
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    href={Item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:text-foreground w-full',
                      {
                        'bg-accent text-accent-foreground': isActive,
                        'text-muted-foreground justify-center': !expanded && !isActive,
                        'justify-start': expanded
                      }
                    )}
                  >
                    <Item.Icon className='h-5 w-5' />
                    {expanded ? <span className='text-sm font-semibold'>{Item.title}</span> : <span className='sr-only'>{Item.title}</span>}
                  </Link>
                </TooltipTrigger>
                {!expanded && <TooltipContent side='right'>{Item.title}</TooltipContent>}
              </Tooltip>
            )
          })}
        </nav>
        <nav className='mt-auto flex flex-col items-center gap-4 px-2 py-4 w-full'>
          <div className='w-full flex items-center justify-center'>
            <Link
              href='/manage/setting'
              className={cn(
                'flex items-center gap-3 rounded-lg px-2 py-2 w-full transition-colors hover:text-foreground',
                {
                  'bg-accent text-accent-foreground justify-center': !expanded && pathname === '/manage/setting',
                  'bg-accent text-accent-foreground justify-start': expanded && pathname === '/manage/setting',
                  'text-muted-foreground justify-center': !expanded && pathname !== '/manage/setting',
                  'justify-start': expanded && pathname !== '/manage/setting'
                }
              )}
            >
              <Settings className='h-5 w-5' />
              {expanded ? <span className='text-sm'>Settings</span> : <span className='sr-only'>Settings</span>}
            </Link>
          </div>

          <div className='w-full flex items-center justify-center' />
        </nav>
      </aside>
    </TooltipProvider>
  )
}
