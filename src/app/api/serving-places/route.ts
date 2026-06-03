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
    await authenticate()
    await sqlite.initDatabase()
    const places = sqlite.getServingPlaces()
    return Response.json({ data: places, message: 'OK' })
  } catch (err) {
    console.error('GET /api/serving-places error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}

export async function POST(request: Request) {
  try {
    await authenticate()
    const body = (await request.json()) as { name?: string; description?: string }
    if (!body.name) {
      return Response.json({ message: 'Name is required' }, { status: 400 })
    }
    await sqlite.initDatabase()
    const place = sqlite.createServingPlace({
      name: body.name.trim(),
      description: body.description?.trim() || '',
    })
    if (!place) {
      return Response.json({ message: 'Unable to create serving place' }, { status: 500 })
    }
    return Response.json({ data: place, message: 'Created' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/serving-places error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}
