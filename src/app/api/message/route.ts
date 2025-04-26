// app-frontend/src/app/api/message/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { MessagesModel } from "@/types/message"  // สร้างให้ตรงกับโครงสร้างข้อมูลที่คุณจะส่ง

export async function POST(msg: NextRequest) {
  try {
    const req: MessagesModel = await msg.json()
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_BACKEND_URL}/chat/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),  
    })

    // ตรวจสอบการตอบกลับจาก backend
    if (!res.ok) {
      throw new Error("Failed to send message")
    }
    const data = await res.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error("Error in sending message:", error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
