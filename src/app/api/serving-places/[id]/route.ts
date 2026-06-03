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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticate()
    const { id } = await params
    const placeId = Number(id)
    if (!Number.isFinite(placeId)) {
      return Response.json({ message: 'Invalid place id' }, { status: 400 })
    }
    const body = (await request.json()) as { name?: string; description?: string }
    if (!body.name) {
      return Response.json({ message: 'Name is required' }, { status: 400 })
    }
    await sqlite.initDatabase()
    const update = sqlite.updateServingPlace(placeId, {
      name: body.name.trim(),
      description: body.description?.trim() || '',
    })
    if (!update) {
      return Response.json({ message: 'Unable to update serving place' }, { status: 500 })
    }
    return Response.json({ data: update, message: 'Updated' })
  } catch (err) {
    console.error('PUT /api/serving-places/[id] error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authenticate()
    const { id } = await params
    const placeId = Number(id)
    if (!Number.isFinite(placeId)) {
      return Response.json({ message: 'Invalid place id' }, { status: 400 })
    }
    await sqlite.initDatabase()
    const deleted = sqlite.deleteServingPlace(placeId)
    if (!deleted) {
      return Response.json({ message: 'Unable to delete serving place' }, { status: 500 })
    }
    return Response.json({ message: 'Deleted' })
  } catch (err) {
    console.error('DELETE /api/serving-places/[id] error', err)
    const status = (err as any)?.status || 500
    return Response.json({ message: (err as any)?.message || 'Internal error' }, { status })
  }
}
