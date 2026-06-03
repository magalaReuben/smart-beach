import initSqlJs from 'sql.js'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

export type ServingPlace = {
  id: number
  name: string
  description: string
  sales: Array<{ date: string; amount: number }>
}

export type Waiter = {
  id: number
  name: string
  notes: string
  sales: Array<{ date: string; amount: number }>
}

let db: any = null
let dbReady = false

const dbDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
const dbPath = path.join(dbDir, 'dev.db')

function queryAll(sql: string, params: any[] = []) {
  if (!db) return []
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows: any[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

function queryOne(sql: string, params: any[] = []) {
  if (!db) return null
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const has = stmt.step()
  if (!has) {
    stmt.free()
    return null
  }
  const row = stmt.getAsObject()
  stmt.free()
  return row
}

function saveDatabase() {
  if (!db) return
  try {
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
  } catch (err) {
    console.error('Failed to save database', err)
  }
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

async function seedDefaultData() {
  const hasAccounts = queryOne('SELECT id FROM accounts WHERE email = ?', ['admin@example.com'])
  if (!hasAccounts) {
    const hash = hashPassword('password')
    const insertStmt = db.prepare('INSERT INTO accounts (name, email, password, role) VALUES (?, ?, ?, ?)')
    insertStmt.run(['Admin', 'admin@example.com', hash, 'Owner'])
    insertStmt.free()
    saveDatabase()
  }

  const hasPlaces = queryOne('SELECT id FROM serving_places LIMIT 1')
  const defaultPlaces = [
    { name: 'Floaters', description: 'Serving point for Floaters.' },
    { name: 'Kids Park', description: 'Serving point for Kids Park.' },
    { name: 'Swings', description: 'Serving point for Swings.' },
    { name: 'Zipline', description: 'Serving point for Zipline.' },
    { name: 'Football Pitch', description: 'Serving point for Football Pitch.' },
    { name: 'Turf', description: 'Serving point for Turf.' },
    { name: 'Bar Upper Block', description: 'Serving point for Bar Upper Block.' },
    { name: 'Lower Block Bar', description: 'Serving point for Lower Block Bar.' },
    { name: 'Pool Table', description: 'Serving point for Pool Table.' },
    { name: 'Weddings', description: 'Serving point for Weddings.' },
    { name: 'Wedding Photos', description: 'Serving point for Wedding Photos.' },
  ]
  let insertedPlaces = false
  const insertPlace = db.prepare('INSERT INTO serving_places (name, description) VALUES (?, ?)')
  for (const place of defaultPlaces) {
    const placeExists = queryOne('SELECT id FROM serving_places WHERE name = ?', [place.name])
    if (!placeExists) {
      insertPlace.run([place.name, place.description])
      insertedPlaces = true
    }
  }
  insertPlace.free()

  if (insertedPlaces) {
    saveDatabase()
  }

  if (!hasPlaces) {
    saveDatabase()
  }

  const hasWaiters = queryOne('SELECT id FROM waiters LIMIT 1')
  if (!hasWaiters) {
    const insertWaiter = db.prepare('INSERT INTO waiters (name, notes) VALUES (?, ?)')
    insertWaiter.run(['Mia', 'Experienced waiter for beach guests.'])
    insertWaiter.run(['Noah', 'Fast service with high upsell rate.'])
    insertWaiter.free()
    const mia = queryOne('SELECT id FROM waiters WHERE name = ?', ['Mia'])
    const noah = queryOne('SELECT id FROM waiters WHERE name = ?', ['Noah'])
    if (mia) {
      const sales = [
        { date: getToday(), amount: 0 },
        { date: '2026-06-02', amount: 550000 },
        { date: '2026-06-03', amount: 610000 }
      ]
      const insertSale = db.prepare('INSERT INTO waiter_sales (waiter_id, date, amount) VALUES (?, ?, ?)')
      sales.forEach((sale) => insertSale.run([mia.id, sale.date, sale.amount]))
      insertSale.free()
    }
    if (noah) {
      const sales = [
        { date: getToday(), amount: 0 },
        { date: '2026-06-02', amount: 315000 },
        { date: '2026-06-03', amount: 370000 }
      ]
      const insertSale = db.prepare('INSERT INTO waiter_sales (waiter_id, date, amount) VALUES (?, ?, ?)')
      sales.forEach((sale) => insertSale.run([noah.id, sale.date, sale.amount]))
      insertSale.free()
    }
    saveDatabase()
  }
}

export function getAccounts() {
  if (!db) return []
  const rows = queryAll('SELECT id, name, email, role, avatar FROM accounts ORDER BY id DESC')
  return rows.map((row: any) => ({
    ...row,
    avatar: row.avatar || null,
  }))
}

export async function initDatabase() {
  if (dbReady) return
  try {
    const locateFile = (filename: string) => {
      return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', filename)
    }
    const SQL = await initSqlJs({ locateFile })
    let fileBuffer: Buffer | null = null
    if (fs.existsSync(dbPath)) {
      fileBuffer = fs.readFileSync(dbPath)
    }
    db = new SQL.Database(fileBuffer ? new Uint8Array(fileBuffer) : undefined)

    db.run(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        avatar TEXT
      )
    `)

    const accountInfo = queryAll("PRAGMA table_info('accounts')")
    if (!accountInfo.find((column: any) => column.name === 'avatar')) {
      db.run('ALTER TABLE accounts ADD COLUMN avatar TEXT')
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS serving_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS waiters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        notes TEXT
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS waiter_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        waiter_id INTEGER,
        date TEXT,
        amount INTEGER,
        FOREIGN KEY(waiter_id) REFERENCES waiters(id)
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS serving_place_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serving_place_id INTEGER,
        date TEXT,
        amount INTEGER,
        FOREIGN KEY(serving_place_id) REFERENCES serving_places(id)
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS dishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        category TEXT,
        price INTEGER,
        description TEXT,
        image TEXT,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        tableNumber INTEGER,
        createdAt TEXT,
        updatedAt TEXT
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guestId INTEGER,
        tableNumber INTEGER,
        dishSnapshotId INTEGER,
        quantity INTEGER,
        orderHandlerId INTEGER,
        servingPlaceId INTEGER,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(guestId) REFERENCES guests(id),
        FOREIGN KEY(orderHandlerId) REFERENCES accounts(id),
        FOREIGN KEY(servingPlaceId) REFERENCES serving_places(id)
      )
    `)

    const orderInfo = queryAll("PRAGMA table_info('orders')")
    const orderColumns = orderInfo.map((column: any) => column.name)
    if (!orderColumns.includes('servingPlaceId')) {
      db.run('ALTER TABLE orders ADD COLUMN servingPlaceId INTEGER')
    }

    const dishInfo = queryAll("PRAGMA table_info('dishes')")
    const dishColumns = dishInfo.map((column: any) => column.name)
    if (!dishColumns.includes('category')) {
      db.run('ALTER TABLE dishes ADD COLUMN category TEXT')
    }
    if (!dishColumns.includes('price')) {
      db.run('ALTER TABLE dishes ADD COLUMN price INTEGER')
    }
    if (!dishColumns.includes('description')) {
      db.run('ALTER TABLE dishes ADD COLUMN description TEXT')
    }
    if (!dishColumns.includes('image')) {
      db.run('ALTER TABLE dishes ADD COLUMN image TEXT')
    }
    if (!dishColumns.includes('status')) {
      db.run('ALTER TABLE dishes ADD COLUMN status TEXT')
    }
    if (!dishColumns.includes('createdAt')) {
      db.run('ALTER TABLE dishes ADD COLUMN createdAt TEXT')
    }
    if (!dishColumns.includes('updatedAt')) {
      db.run('ALTER TABLE dishes ADD COLUMN updatedAt TEXT')
    }

    const menuJsonPath = path.join(process.cwd(), 'src', 'data', 'menu-items.json')
    if (fs.existsSync(menuJsonPath)) {
      try {
        const raw = fs.readFileSync(menuJsonPath, 'utf-8')
        const items = JSON.parse(raw) as Array<any>
        const categoryMap = new Map<string, string>()
        for (const it of items) {
          if (it?.name && it?.category) {
            categoryMap.set(String(it.name).trim(), String(it.category))
          }
        }

        const missingCategoryRows = queryAll(
          "SELECT id, name FROM dishes WHERE category IS NULL OR category = ''"
        )
        if (missingCategoryRows.length) {
          const updateStmt = db.prepare(
            'UPDATE dishes SET category = ? WHERE id = ?'
          )
          for (const row of missingCategoryRows) {
            const name = String(row.name || '').trim()
            const category = categoryMap.get(name) || 'Uncategorized'
            updateStmt.run([category, row.id])
          }
          updateStmt.free()
          saveDatabase()
        }
      } catch (err) {
        console.error('Failed migrating dish categories', err)
      }
    }

    const hasDishes = queryOne('SELECT id FROM dishes LIMIT 1')
    if (!hasDishes) {
      try {
        const raw = fs.readFileSync(menuJsonPath, 'utf-8')
        const items = JSON.parse(raw) as Array<any>
        const insert = db.prepare('INSERT INTO dishes (name, category, price, description, image, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        for (const it of items) {
          insert.run([
            it.name,
            it.category || '',
            Number(it.price || 0),
            it.description || '',
            it.image || '',
            it.status || 'Available',
            it.createdAt || new Date().toISOString(),
            it.updatedAt || new Date().toISOString(),
          ])
        }
        insert.free()
        saveDatabase()
      } catch (err) {
        console.error('Failed seeding dishes from JSON', err)
      }
    }

    dbReady = true
  } catch (err) {
    console.error('SQLite init error', err)
  }
}

export function findAccountByEmail(email: string) {
  if (!db) return null
  try {
    const stmt = db.prepare('SELECT id, name, email, password, role, avatar FROM accounts WHERE email = ?')
    stmt.bind([email])
    const has = stmt.step()
    if (!has) {
      stmt.free()
      return null
    }
    const row = stmt.getAsObject()
    stmt.free()
    return {
      id: row.id as number,
      name: row.name as string,
      email: row.email as string,
      password: row.password as string,
      role: row.role as string,
      avatar: row.avatar as string | null,
    }
  } catch (err) {
    console.error('Query error', err)
    return null
  }
}

export function createAccount({ name, email, password, role, avatar }: { name: string; email: string; password: string; role: string; avatar?: string | null }) {
  if (!db) return null
  try {
    const hash = hashPassword(password)
    const insert = db.prepare('INSERT INTO accounts (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)')
    insert.run([name, email, hash, role, avatar || null])
    insert.free()
    saveDatabase()

    const stmt = db.prepare('SELECT id, name, email, password, role, avatar FROM accounts WHERE email = ?')
    stmt.bind([email])
    const has = stmt.step()
    if (!has) {
      stmt.free()
      return null
    }
    const row = stmt.getAsObject()
    stmt.free()
    return {
      id: row.id as number,
      name: row.name as string,
      email: row.email as string,
      password: row.password as string,
      role: row.role as string,
      avatar: row.avatar as string | null,
    }
  } catch (err) {
    console.error('Create error', err)
    return null
  }
}

function createSale(sql: string, params: any[]) {
  if (!db) return
  try {
    const stmt = db.prepare(sql)
    stmt.run(params)
    stmt.free()
    saveDatabase()
  } catch (err) {
    console.error('Create sale error', err)
  }
}

export function getServingPlaceSales(id: number, fromDate?: string, toDate?: string) {
  if (!db) return []
  const params: any[] = [id]
  let sql = `
    SELECT date(o.createdAt) AS date,
           SUM(d.price * o.quantity) AS amount
    FROM orders o
    JOIN dishes d ON o.dishSnapshotId = d.id
    WHERE o.servingPlaceId = ?`

  if (fromDate && toDate) {
    sql += ' AND date(o.createdAt) BETWEEN ? AND ?'
    params.push(fromDate, toDate)
  }

  sql += ' GROUP BY date(o.createdAt) ORDER BY date(o.createdAt) DESC'

  return queryAll(sql, params).map((row: any) => ({
    date: row.date,
    amount: Number(row.amount || 0),
  })) as Array<{ date: string; amount: number }>
}

export function getServingPlaces() {
  if (!db) return []
  const places = queryAll('SELECT id, name, description FROM serving_places ORDER BY id DESC')
  return places.map((place: any) => ({
    ...place,
    sales: getServingPlaceSales(place.id)
  })) as ServingPlace[]
}

export function getServingPlaceById(id: number) {
  if (!db) return null
  const place = queryOne('SELECT id, name, description FROM serving_places WHERE id = ?', [id])
  if (!place) return null
  return {
    ...place,
    sales: getServingPlaceSales(id)
  } as ServingPlace
}

export function createServingPlace({ name, description }: { name: string; description: string }) {
  if (!db) return null
  try {
    const insert = db.prepare('INSERT INTO serving_places (name, description) VALUES (?, ?)')
    insert.run([name, description])
    insert.free()
    const place = queryOne('SELECT id, name, description FROM serving_places WHERE name = ? AND description = ? ORDER BY id DESC LIMIT 1', [name, description])
    if (!place) return null
    createSale('INSERT INTO serving_place_sales (serving_place_id, date, amount) VALUES (?, ?, ?)', [place.id, getToday(), 0])
    return getServingPlaceById(place.id)
  } catch (err) {
    console.error('Create serving place error', err)
    return null
  }
}

export function updateServingPlace(id: number, { name, description }: { name: string; description: string }) {
  if (!db) return null
  try {
    const stmt = db.prepare('UPDATE serving_places SET name = ?, description = ? WHERE id = ?')
    stmt.run([name, description, id])
    stmt.free()
    saveDatabase()
    return getServingPlaceById(id)
  } catch (err) {
    console.error('Update serving place error', err)
    return null
  }
}

export function deleteServingPlace(id: number) {
  if (!db) return false
  try {
    const deleteSales = db.prepare('DELETE FROM serving_place_sales WHERE serving_place_id = ?')
    deleteSales.run([id])
    deleteSales.free()
    const deletePlace = db.prepare('DELETE FROM serving_places WHERE id = ?')
    deletePlace.run([id])
    deletePlace.free()
    saveDatabase()
    return true
  } catch (err) {
    console.error('Delete serving place error', err)
    return false
  }
}

export function getWaiterSales(id: number, fromDate?: string, toDate?: string) {
  if (!db) return []
  const sql = fromDate && toDate
    ? 'SELECT date, amount FROM waiter_sales WHERE waiter_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC'
    : 'SELECT date, amount FROM waiter_sales WHERE waiter_id = ? ORDER BY date DESC'
  const params = fromDate && toDate ? [id, fromDate, toDate] : [id]
  return queryAll(sql, params) as Array<{ date: string; amount: number }>
}

export function getWaiters() {
  if (!db) return []
  const waiters = queryAll('SELECT id, name, notes FROM waiters ORDER BY id DESC')
  return waiters.map((waiter: any) => ({
    ...waiter,
    sales: getWaiterSales(waiter.id)
  })) as Waiter[]
}

export function getWaiterById(id: number) {
  if (!db) return null
  const waiter = queryOne('SELECT id, name, notes FROM waiters WHERE id = ?', [id])
  if (!waiter) return null
  return {
    ...waiter,
    sales: getWaiterSales(id)
  } as Waiter
}

export function createWaiter({ name, notes }: { name: string; notes: string }) {
  if (!db) return null
  try {
    const insert = db.prepare('INSERT INTO waiters (name, notes) VALUES (?, ?)')
    insert.run([name, notes])
    insert.free()
    const waiter = queryOne('SELECT id, name, notes FROM waiters WHERE name = ? ORDER BY id DESC LIMIT 1', [name])
    if (!waiter) return null
    createSale('INSERT INTO waiter_sales (waiter_id, date, amount) VALUES (?, ?, ?)', [waiter.id, getToday(), 0])
    return getWaiterById(waiter.id)
  } catch (err) {
    console.error('Create waiter error', err)
    return null
  }
}

export function updateWaiter(id: number, { name, notes }: { name: string; notes: string }) {
  if (!db) return null
  try {
    const stmt = db.prepare('UPDATE waiters SET name = ?, notes = ? WHERE id = ?')
    stmt.run([name, notes, id])
    stmt.free()
    saveDatabase()
    return getWaiterById(id)
  } catch (err) {
    console.error('Update waiter error', err)
    return null
  }
}

// Dish functions
export function getDishes() {
  if (!db) return []
  const rows = queryAll('SELECT id, name, category, price, description, image, status, createdAt, updatedAt FROM dishes ORDER BY id DESC')
  return rows.map((r: any) => ({
    ...r,
    price: Number(r.price),
  }))
}

export function getDishById(id: number) {
  if (!db) return null
  const row = queryOne('SELECT id, name, category, price, description, image, status, createdAt, updatedAt FROM dishes WHERE id = ?', [id])
  if (!row) return null
  return {
    ...row,
    price: Number((row as any).price),
  }
}

export function getGuestById(id: number) {
  if (!db) return null
  const row = queryOne('SELECT id, name, tableNumber, createdAt, updatedAt FROM guests WHERE id = ?', [id])
  if (!row) return null
  return {
    ...row,
    tableNumber: row.tableNumber === null ? null : Number(row.tableNumber),
  }
}

export function createGuest({ name, tableNumber }: { name: string; tableNumber: number | null }) {
  if (!db) {
    console.warn('createGuest: db is not initialized')
    return null
  }
  try {
    const now = new Date().toISOString()
    console.log('createGuest: inserting', { name, tableNumber, now })
    const stmt = db.prepare('INSERT INTO guests (name, tableNumber, createdAt, updatedAt) VALUES (?, ?, ?, ?)')
    stmt.run([name, Number(tableNumber), now, now])
    stmt.free()
    saveDatabase()
    console.log('createGuest: saved database, querying for inserted row by name and createdAt')
    const row = queryOne('SELECT id, name, tableNumber, createdAt, updatedAt FROM guests WHERE name = ? AND createdAt = ? LIMIT 1', [name, now])
    console.log('createGuest: queryOne result:', row)
    if (!row) {
      console.warn('createGuest: no row found after insert, trying by max id')
      // Fallback: get the row with the highest ID
      const maxRow = queryOne('SELECT id, name, tableNumber, createdAt, updatedAt FROM guests ORDER BY id DESC LIMIT 1')
      console.log('createGuest: max id row result:', maxRow)
      if (!maxRow) {
        console.warn('createGuest: no row found even by max id')
        return null
      }
      return {
        ...maxRow,
        tableNumber: maxRow.tableNumber === null ? null : Number(maxRow.tableNumber),
        role: 'Guest',
      }
    }
    return {
      ...row,
      tableNumber: row.tableNumber === null ? null : Number(row.tableNumber),
      role: 'Guest',
    }
  } catch (err) {
    console.error('Create guest error', err)
    return null
  }
}

export function findAccountById(id: number) {
  if (!db) return null
  const row = queryOne('SELECT id, name, email, role, avatar FROM accounts WHERE id = ?', [id])
  if (!row) return null
  return {
    ...row,
  }
}

function mapOrderRow(row: any) {
  const guest = row.guestId ? getGuestById(Number(row.guestId)) : null
  const dish = getDishById(Number(row.dishSnapshotId))
  const orderHandler = row.orderHandlerId ? findAccountById(Number(row.orderHandlerId)) : null
  const servingPlace = row.servingPlaceId ? getServingPlaceById(Number(row.servingPlaceId)) : null
  return {
    id: Number(row.id),
    guestId: row.guestId === null ? null : Number(row.guestId),
    guest,
    tableNumber: row.tableNumber === null ? null : Number(row.tableNumber),
    dishSnapshotId: Number(row.dishSnapshotId),
    servingPlaceId: row.servingPlaceId === null ? null : Number(row.servingPlaceId),
    servingPlace,
    dishSnapshot: dish
      ? {
          ...dish,
          dishId: dish.id,
        }
      : {
          id: Number(row.dishSnapshotId),
          dishId: Number(row.dishSnapshotId),
          name: 'Unknown',
          price: 0,
          image: '',
          description: '',
          status: 'Unavailable',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
    quantity: Number(row.quantity),
    orderHandlerId: row.orderHandlerId === null ? null : Number(row.orderHandlerId),
    orderHandler,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createOrder({
  guestId,
  orders,
  orderHandlerId,
  servingPlaceId,
}: {
  guestId: number
  orders: Array<{ dishId: number; quantity: number }>
  orderHandlerId?: number | null
  servingPlaceId?: number | null
}) {
  if (!db || !orders.length) return null
  const guest = getGuestById(guestId)
  if (!guest) return null
  try {
    const now = new Date().toISOString()
    const stmt = db.prepare(
      'INSERT INTO orders (guestId, tableNumber, dishSnapshotId, quantity, orderHandlerId, servingPlaceId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    for (const item of orders) {
      const dish = getDishById(item.dishId)
      if (!dish) continue
      stmt.run([
        guestId,
        guest.tableNumber,
        item.dishId,
        item.quantity,
        orderHandlerId ?? null,
        servingPlaceId ?? null,
        'Pending',
        now,
        now,
      ])
    }
    stmt.free()
    saveDatabase()
    const rows = queryAll(
      'SELECT id, guestId, tableNumber, dishSnapshotId, quantity, orderHandlerId, servingPlaceId, status, createdAt, updatedAt FROM orders WHERE guestId = ? AND createdAt = ? ORDER BY id ASC',
      [guestId, now]
    )
    return rows.map(mapOrderRow)
  } catch (err) {
    console.error('Create order error', err)
    return null
  }
}

export function getOrders({ fromDate, toDate }: { fromDate?: Date; toDate?: Date } = {}) {
  if (!db) return []
  const clauses: string[] = []
  const params: any[] = []
  if (fromDate) {
    clauses.push('createdAt >= ?')
    params.push(fromDate.toISOString())
  }
  if (toDate) {
    clauses.push('createdAt <= ?')
    params.push(toDate.toISOString())
  }
  let query = 'SELECT id, guestId, tableNumber, dishSnapshotId, quantity, orderHandlerId, servingPlaceId, status, createdAt, updatedAt FROM orders'
  if (clauses.length) query += ' WHERE ' + clauses.join(' AND ')
  query += ' ORDER BY id DESC'
  const rows = queryAll(query, params)
  return rows.map(mapOrderRow)
}

export function getOrderById(id: number) {
  if (!db) return null
  const row = queryOne(
    'SELECT id, guestId, tableNumber, dishSnapshotId, quantity, orderHandlerId, servingPlaceId, status, createdAt, updatedAt FROM orders WHERE id = ?',
    [id]
  )
  if (!row) return null
  return mapOrderRow(row)
}

export function updateOrder(
  id: number,
  { status, dishId, quantity }: { status: string; dishId: number; quantity: number }
) {
  if (!db) return null
  const order = getOrderById(id)
  if (!order) return null
  try {
    const now = new Date().toISOString()
    const stmt = db.prepare(
      'UPDATE orders SET dishSnapshotId = ?, quantity = ?, status = ?, updatedAt = ? WHERE id = ?'
    )
    stmt.run([dishId, quantity, status, now, id])
    stmt.free()
    saveDatabase()
    return getOrderById(id)
  } catch (err) {
    console.error('Update order error', err)
    return null
  }
}

export function payGuestOrders(guestId: number) {
  if (!db) return []
  try {
    const now = new Date().toISOString()
    const stmt = db.prepare(
      'UPDATE orders SET status = ?, updatedAt = ? WHERE guestId = ?'
    )
    stmt.run(['Paid', now, guestId])
    stmt.free()
    saveDatabase()
    return getOrders({}).filter((order) => order.guestId === guestId)
  } catch (err) {
    console.error('Pay guest orders error', err)
    return []
  }
}

export function getGuests() {
  if (!db) return []
  const rows = queryAll('SELECT id, name, tableNumber, createdAt, updatedAt FROM guests ORDER BY id DESC')
  return rows.map((row: any) => ({
    ...row,
    tableNumber: row.tableNumber === null ? null : Number(row.tableNumber),
  }))
}

export function createDish({ name, category, price, description, image, status }: { name: string; category?: string; price: number; description: string; image?: string; status?: string }) {
  if (!db) return null
  try {
    const now = new Date().toISOString()
    const insert = db.prepare('INSERT INTO dishes (name, category, price, description, image, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    insert.run([name, category || '', price, description, image || '', status || 'Available', now, now])
    insert.free()
    const dish = queryOne('SELECT id, name, category, price, description, image, status, createdAt, updatedAt FROM dishes WHERE id = (SELECT last_insert_rowid())')
    if (!dish) return null
    return {
      ...dish,
      price: Number((dish as any).price),
      category: dish.category || '',
    }
  } catch (err) {
    console.error('Create dish error', err)
    return null
  }
}

export function updateDish(id: number, { name, category, price, description, image, status }: { name: string; category?: string; price: number; description: string; image: string; status?: string }) {
  if (!db) return null
  try {
    const now = new Date().toISOString()
    const stmt = db.prepare('UPDATE dishes SET name = ?, category = ?, price = ?, description = ?, image = ?, status = ?, updatedAt = ? WHERE id = ?')
    stmt.run([name, category || '', price, description, image || '', status || 'Available', now, id])
    stmt.free()
    return getDishById(id)
  } catch (err) {
    console.error('Update dish error', err)
    return null
  }
}

export function deleteDish(id: number) {
  if (!db) return false
  try {
    const stmt = db.prepare('DELETE FROM dishes WHERE id = ?')
    stmt.run([id])
    stmt.free()
    saveDatabase()
    return true
  } catch (err) {
    console.error('Delete dish error', err)
    return false
  }
}

export function deleteOrder(id: number) {
  if (!db) return false
  try {
    const stmt = db.prepare('DELETE FROM orders WHERE id = ?')
    stmt.run([id])
    stmt.free()
    saveDatabase()
    return true
  } catch (err) {
    console.error('Delete order error', err)
    return false
  }
}

export function deleteWaiter(id: number) {
  if (!db) return false
  try {
    const deleteSales = db.prepare('DELETE FROM waiter_sales WHERE waiter_id = ?')
    deleteSales.run([id])
    deleteSales.free()
    const deleteWaiterStmt = db.prepare('DELETE FROM waiters WHERE id = ?')
    deleteWaiterStmt.run([id])
    deleteWaiterStmt.free()
    saveDatabase()
    return true
  } catch (err) {
    console.error('Delete waiter error', err)
    return false
  }
}

export function verifyPassword(password: string, hash: string) {
  try {
    const [salt, derived] = hash.split('$')
    if (!salt || !derived) return false
    const key = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64)
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), key)
  } catch (err) {
    console.error('verifyPassword error', err)
    return false
  }
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const key = crypto.scryptSync(password, salt, 64)
  return `${salt.toString('hex')}$${key.toString('hex')}`
}

export default {
  initDatabase,
  findAccountByEmail,
  createAccount,
  getAccounts,
  verifyPassword,
  getServingPlaces,
  getServingPlaceById,
  createServingPlace,
  updateServingPlace,
  deleteServingPlace,
  getWaiterSales,
  getWaiters,
  getWaiterById,
  createWaiter,
  updateWaiter,
  deleteWaiter,
  getServingPlaceSales,
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  getGuests,
  getGuestById,
  createGuest,
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  payGuestOrders,
}
