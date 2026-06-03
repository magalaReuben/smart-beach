import { cookies, headers } from 'next/headers'
import jwt from 'jsonwebtoken'
import sqlite from '@/lib/sqlite'

export async function GET() {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      const authHeader = (await headers()).get('authorization')
      accessToken = authHeader?.split(' ')[1]
    }

    if (!accessToken) return Response.json({ message: 'Not authenticated' }, { status: 401 })

    const secret = process.env.JWT_SECRET || 'dev-secret'
    let decoded: any
    try {
      decoded = jwt.verify(accessToken, secret) as any
    } catch (err) {
      return Response.json({ message: 'Invalid token' }, { status: 401 })
    }

    if (process.env.USE_SQLITE === 'true') {
      await sqlite.initDatabase()
      const account = sqlite.findAccountByEmail(decoded.email)
      if (!account) return Response.json({ message: 'Account not found' }, { status: 404 })
      return Response.json({ data: account, message: 'OK' })
    }

    return Response.json({ message: 'Not implemented' }, { status: 501 })
  } catch (err) {
    console.error('GET /api/accounts/me error', err)
    return Response.json({ message: 'Internal error' }, { status: 500 })
  }
}
