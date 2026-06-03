import { cookies, headers } from 'next/headers'
import jwt from 'jsonwebtoken'
import sqlite from '@/lib/sqlite'

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

export async function GET() {
  try {
    const actor = await authenticate()
    const allowed = ['owner', 'manager', 'admin', 'employee']
    if (!actor.role || !allowed.includes(String(actor.role).toLowerCase())) {
      return Response.json({ message: 'Forbidden' }, { status: 403 })
    }

    await sqlite.initDatabase()
    const accounts = sqlite.getAccounts()
    return Response.json({ data: accounts, message: 'OK' })
  } catch (err) {
    console.error('GET /api/accounts error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authenticate()
    // only manager/owner/admin can create accounts (case-insensitive)
    const allowed = ['owner', 'manager', 'admin', 'employee']
    if (!actor.role || !allowed.includes(String(actor.role).toLowerCase())) {
      return Response.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as any
    const { name, email, password, role, avatar } = body
    if (!name || !email || !password || !role) {
      return Response.json({ message: 'Missing required fields' }, { status: 400 })
    }

    await sqlite.initDatabase()
    const account = sqlite.createAccount({ name: name.trim(), email: email.trim(), password: String(password), role: String(role), avatar: avatar || null })
    if (!account) return Response.json({ message: 'Unable to create account' }, { status: 500 })

    // if role is waiter, also create waiter record
    if (String(role).toLowerCase() === 'waiter') {
      sqlite.createWaiter({ name: name.trim(), notes: 'Auto-created by account creation' })
    }

    return Response.json({ data: { id: account.id, name: account.name, email: account.email, role: account.role, avatar: account.avatar }, message: 'Created' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/accounts error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}
