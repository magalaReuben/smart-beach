import Image from 'next/image'
import LoginForm from '@/app/(public)/(auth)/login/login-form'
import { Suspense } from 'react'

export default function Login() {
  return (
    <div className='flex h-full min-h-[calc(100vh-4rem)] items-center justify-center'>
      <div className='max-w-md w-full space-y-6'>
        <div className='text-center'>
          <div className='mx-auto h-24 w-24 overflow-hidden rounded-full border border-primary/20 shadow-sm'>
            <Image src='/large.png' alt='Smart Beach logo' width={96} height={96} className='h-full w-full object-cover' />
          </div>
          <p className='text-sm text-muted-foreground mt-4'>Smart Beach management system</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
