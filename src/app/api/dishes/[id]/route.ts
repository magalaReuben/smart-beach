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

export async function GET(request: Request) {
  try {
    await authenticate()
    const idMatch = request.url.match(/\/api\/dishes\/(\d+)/)
    const id = idMatch ? Number(idMatch[1]) : null
    if (!id) return Response.json({ message: 'Invalid id' }, { status: 400 })
    await sqlite.initDatabase()
    const dish = sqlite.getDishById(id)
    if (!dish) return Response.json({ message: 'Not found' }, { status: 404 })
    return Response.json({ data: dish, message: 'OK' })
  } catch (err) {
    console.error('GET /api/dishes/[id] error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}

export async function PUT(request: Request) {
  try {
    await authenticate()
    const idMatch = request.url.match(/\/api\/dishes\/(\d+)/)
    const id = idMatch ? Number(idMatch[1]) : null
    if (!id) return Response.json({ message: 'Invalid id' }, { status: 400 })
    const body = (await request.json()) as any
    await sqlite.initDatabase()
    const updated = sqlite.updateDish(id, {
      name: String(body.name || ''),
      category: String(body.category || ''),
      price: Number(body.price || 0),
      description: String(body.description || ''),
      image: String(body.image || ''),
      status: String(body.status || 'Available')
    })
    if (!updated) return Response.json({ message: 'Unable to update' }, { status: 500 })
    return Response.json({ data: updated, message: 'Updated' })
  } catch (err) {
    console.error('PUT /api/dishes/[id] error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    await authenticate()
    const idMatch = request.url.match(/\/api\/dishes\/(\d+)/)
    const id = idMatch ? Number(idMatch[1]) : null
    if (!id) return Response.json({ message: 'Invalid id' }, { status: 400 })
    await sqlite.initDatabase()
    const ok = sqlite.deleteDish(id)
    if (!ok) return Response.json({ message: 'Unable to delete' }, { status: 500 })
    return Response.json({ message: 'Deleted' })
  } catch (err) {
    console.error('DELETE /api/dishes/[id] error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}
