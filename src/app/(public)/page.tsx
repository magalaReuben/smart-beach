import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decodeToken } from '@/lib/utils'
import { Role } from '@/constants/type'

export default async function Home() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  if (refreshToken) {
    const role = decodeToken(refreshToken)?.role
    if (role === Role.Guest) {
      redirect('/guest')
    }
    redirect('/manage')
  }

  redirect('/login')
}
