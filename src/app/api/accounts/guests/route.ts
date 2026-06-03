import { cookies, headers } from 'next/headers'
import jwt from 'jsonwebtoken'
import sqlite from '@/lib/sqlite'
import queryString from 'query-string'

async function authenticate() {
  const cookieStore = await cookies()
  let accessToken = cookieStore.get('accessToken')?.value
  if (!accessToken) {
    const authHeader = (await headers()).get('authorization')
    accessToken = authHeader?.split(' ')[1]
  }

  if (!accessToken) {
    const error: any = new Error('Not authenticated')
    error.status = 401
    throw error
  }

  const secret = process.env.JWT_SECRET || 'dev-secret'
  try {
    return jwt.verify(accessToken, secret) as any
  } catch (err) {
    const error: any = new Error('Invalid token')
    error.status = 401
    throw error
  }
}

export async function GET(request: Request) {
  try {
    await authenticate()
    await sqlite.initDatabase()

    const url = new URL(request.url)
    const fromDate = url.searchParams.get('fromDate')
    const toDate = url.searchParams.get('toDate')

    const guests = sqlite.getGuests()
    return Response.json({ data: guests, message: 'OK' })
  } catch (err) {
    console.error('GET /api/accounts/guests error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}

export async function POST(request: Request) {
  try {
    await authenticate()
    const body = (await request.json()) as any
    const { name, tableNumber } = body

    if (!name) {
      return Response.json({ message: 'Guest name is required' }, { status: 400 })
    }

    await sqlite.initDatabase()
    console.log('Creating guest with:', { name: String(name).trim(), tableNumber: tableNumber ? Number(tableNumber) : 0 })
    const guest = sqlite.createGuest({
      name: String(name).trim(),
      tableNumber: tableNumber != null ? Number(tableNumber) : null,
    })

    if (!guest) {
      console.warn('sqlite.createGuest returned null/false')
      return Response.json({ message: 'Unable to create guest' }, { status: 500 })
    }

    return Response.json(
      { data: guest, message: 'Created' },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/accounts/guests error', err)
    const status = (err as any)?.status || 500
    const message = (err as any)?.message || (typeof err === 'string' ? err : 'Internal error')
    return Response.json({ message }, { status })
  }
}
