// lib/api.ts
import { MessagesModel } from "@/types/message"

export async function MessageSending(msg: MessagesModel): Promise<MessagesModel> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_BACKEND_URL!}/chat/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  })

  if (!res.ok) {
    throw new Error("Failed to send message")
  }

  const data = await res.json()
  return data
}







