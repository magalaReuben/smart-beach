'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import DarkModeToggle from '@/components/dark-mode-toggle'
import NavLinks from '@/app/manage/nav-links'

const MobileNavLinks = dynamic(
  () => import('@/app/manage/mobile-nav-links'),
  { ssr: false }
)

const DropdownAvatar = dynamic(
  () => import('@/app/manage/dropdown-avatar'),
  { ssr: false }
)

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const stored = window.localStorage.getItem('smart-beach-sidebar-expanded')
    if (stored !== null) {
      setExpanded(stored === 'true')
    }
  }, [])

  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <NavLinks expanded={expanded} setExpanded={setExpanded} />
      <div className={`flex flex-col pl-0 sm:gap-4 sm:py-4 sm:px-4 ${expanded ? 'sm:pl-52' : 'sm:pl-20'} transition-all duration-200`}>
        <header className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6'>
          <MobileNavLinks />
          <div className='relative ml-auto flex-1 md:grow-0'>
            <div className='flex justify-end'>
              <DarkModeToggle />
            </div>
          </div>
          <DropdownAvatar />
        </header>
        {children}
      </div>
    </div>
  )
}
