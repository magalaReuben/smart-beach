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

export async function POST(request: Request) {
  try {
    // Log incoming headers and cookies for debugging
    try {
      const h = await headers()
      console.log('POST /api/orders headers:', Object.fromEntries(h.entries?.() || []))
    } catch (err) {
      console.warn('Could not read headers for /api/orders', err)
    }
    try {
      const c = await cookies()
      console.log('POST /api/orders cookies:', c.getAll ? c.getAll() : c)
    } catch (err) {
      console.warn('Could not read cookies for /api/orders', err)
    }
    const raw = await request.text()
    console.log('POST /api/orders raw body:', raw)
    let body: any = null
    try {
      body = raw ? JSON.parse(raw) : null
    } catch (parseErr) {
      console.warn('Failed to parse JSON body for /api/orders', parseErr)
    }

    const user = await authenticate()

    await sqlite.initDatabase()

    if (!body || !Array.isArray(body.orders) || !body.orders.length) {
      return Response.json({ message: 'orders are required' }, { status: 400 })
    }

    // Ensure guest exists; if not provided or invalid, create a guest record
    let guestId = body.guestId ? Number(body.guestId) : null
    let guest = guestId ? sqlite.getGuestById(guestId) : null
    if (!guest) {
      console.log('Guest not found, creating temporary guest')
      const createdGuest = sqlite.createGuest({ name: body.customerName || 'Guest', tableNumber: body.tableNumber != null ? Number(body.tableNumber) : null })
      if (!createdGuest) {
        return Response.json({ message: 'Unable to create guest' }, { status: 500 })
      }
      guestId = createdGuest.id
      guest = createdGuest
    }
    let created: any = null
    try {
      const orderHandlerId = body.orderHandlerId
        ? Number(body.orderHandlerId)
        : user && (user as any).id
        ? Number((user as any).id)
        : null

      const servingPlaceId = Number(body.servingPlaceId)
      created = sqlite.createOrder({
        guestId: Number(guestId),
        orders: body.orders.map((o: any) => ({ dishId: Number(o.dishId), quantity: Number(o.quantity) })),
        orderHandlerId,
        servingPlaceId: Number.isFinite(servingPlaceId) ? servingPlaceId : null,
      })
    } catch (err) {
      console.error('Error while creating order in sqlite:', err)
      return Response.json({ message: 'Unable to create order' }, { status: 500 })
    }
    if (!created) {
      console.warn('sqlite.createOrder returned null/false')
      return Response.json({ message: 'Unable to create order' }, { status: 500 })
    }
    return Response.json({ data: created, message: 'Created' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/orders error', err)
    const status = (err as any)?.status || 500
    const message = (err as any)?.message || (typeof err === 'string' ? err : 'Internal error')
    return Response.json({ message }, { status })
  }
}

export async function GET(request: Request) {
  try {
    await authenticate()
    await sqlite.initDatabase()

    const url = new URL(request.url)
    const fromDate = url.searchParams.get('fromDate')
    const toDate = url.searchParams.get('toDate')

    const orders = sqlite.getOrders({
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    })

    return Response.json({ data: orders, message: 'OK' })
  } catch (err) {
    console.error('GET /api/orders error', err)
    const status = (err as any)?.status || 500
    const message = (err as any)?.message || (typeof err === 'string' ? err : 'Internal error')
    return Response.json({ message }, { status })
  }
}
