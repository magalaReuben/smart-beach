import fs from 'fs'
import path from 'path'
import envConfig from '@/config'

export const revalidate = 0

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as any
    if (!file || typeof file.arrayBuffer !== 'function') {
      return new Response(JSON.stringify({ message: 'No file provided' }), { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    // sanitize filename
    const originalName = String(file.name || `upload-${Date.now()}`)
    const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.\-_]/g, '-')}`
    const filePath = path.join(uploadsDir, safeName)
    fs.writeFileSync(filePath, buffer)

    const publicUrl = `${envConfig.NEXT_PUBLIC_URL}/uploads/${safeName}`
    return new Response(JSON.stringify({ data: publicUrl, message: 'OK' }), { status: 200 })
  } catch (err) {
    console.error('POST /api/media/upload error', err)
    return new Response(JSON.stringify({ message: 'Internal error' }), { status: 500 })
  }
}
