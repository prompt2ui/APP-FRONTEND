// hooks/useSendMessage.tsx
import { useState, useCallback, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { MessagesModel, MessageFileMeta } from '@/types/message'

export function useSendMessage() {
  const [msgHistory, updateMsgHistory] = useState<MessagesModel[]>([])

  const sendMessage = useCallback(
    async (textInput: string, filesInput?: MessageFileMeta[]) => {
      // 0) Validate Message-Input can't empty
      if (!textInput.trim() && (!filesInput || filesInput.length === 0)) return
      const hasFiles = ( filesInput && filesInput.length > 0 )

      // 1) optimistic UI: โชว์ข้อความ user & preview รุปก่อน
      const messageRequest: MessagesModel = {
        id: uuid(),
        project_id: uuid(),
        content: textInput,
        sender: 'user',
        attachments: hasFiles ? filesInput.map(f => f.preview) : [],
      }
      updateMsgHistory(prev => [...prev, messageRequest])

      try {
        // 2) upload รูป → คืน URLs จริง
        if (hasFiles) {
          await uploadMessageAttachments(messageRequest, filesInput)  // อัปเดต attachments โดยตรง
        }

        // 3) ส่งไป backend
        const messageResponse = await sendingMessage(messageRequest)
        // 4) update message history
        updateMsgHistory(prev => [...prev, messageResponse])


      } catch (err) {
        console.error(err)
        // TODO: handle error state
      }
    },
    []
  )
  return { msgHistory, sendMessage }
}





const uploadMessageAttachments = async (messageRequest: MessagesModel, filesInput: MessageFileMeta[]) => {
  const form = new FormData()
  filesInput.forEach(f => form.append('file', f.file, f.file.name))
  const resp = await fetch('/api/img', { method: 'POST', body: form })

  if (!resp.ok) {
    throw new Error('Failed to upload files')
  }

  const { url } = await resp.json()
  messageRequest.attachments = Array.isArray(url) ? url : [url]
}



const sendingMessage = async (messageRequest: MessagesModel) => {
  // ส่งข้อมูลไปยัง API Route ใน Next.js
  const res = await fetch('/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageRequest), // ส่งข้อความเป็น JSON
  })

  // ตรวจสอบการตอบกลับจาก API
  if (!res.ok) {
    throw new Error("Failed to send message")
  }

  // รับข้อมูลที่ backend ตอบกลับ
  const data = await res.json()
  return data
}