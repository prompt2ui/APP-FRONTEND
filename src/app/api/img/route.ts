// app/api/img/route.ts  (Next.js App Router)
import { NextResponse } from 'next/server'
import ImageKit from 'imagekit'

export const config = { api: { bodyParser: false } }

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
})

export async function POST(request: Request) {
  const form = await request.formData()

  // ดึงไฟล์ทั้งหมด (array of Blob)
  const blobs = form.getAll('file') as Blob[]
  if (blobs.length === 0) {
    return NextResponse.json({ url: [] })
  }

  // อัปโหลดทุกไฟล์แบบขนาน
  const urls = await Promise.all(
    blobs.map(async (blob, idx) => {
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      // ตั้งชื่อไฟล์ ถ้ามี field "filename" ก็ใช้ของเขา ถ้าไม่ใช้ index ช่วย
      const originalName = (form.getAll('filename')[idx] as string) || `upload-${Date.now()}-${idx}`
      const uploadResp = await imagekit.upload({
        file: buffer,
        fileName: originalName,
        folder: '/uploads'
      })
      return uploadResp.url
    })
  )

  return NextResponse.json({ url: urls })
}
