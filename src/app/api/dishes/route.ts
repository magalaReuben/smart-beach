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
    const dishes = sqlite.getDishes()
    return Response.json({ data: dishes, message: 'OK' })
  } catch (err) {
    console.error('GET /api/dishes error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}

export async function POST(request: Request) {
  try {
    await authenticate()
    const body = (await request.json()) as any
    if (!body.name || !body.price) {
      return Response.json({ message: 'Name and price are required' }, { status: 400 })
    }
    await sqlite.initDatabase()
    const dish = sqlite.createDish({
      name: String(body.name).trim(),
      category: String(body.category || ''),
      price: Number(body.price),
      description: String(body.description || ''),
      image: String(body.image || ''),
      status: String(body.status || 'Available')
    })
    if (!dish) return Response.json({ message: 'Unable to create dish' }, { status: 500 })
    return Response.json({ data: dish, message: 'Created' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/dishes error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}
