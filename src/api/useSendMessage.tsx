// hooks/useSendMessage.tsx
import { useState, useCallback } from 'react'
import { MessagesModel, MessageFileMeta, Project, Test, Testcase } from './types'

type SendMessageContext = {
  project: Pick<Project, 'project_id' | 'project_name' | 'project_description' | 'project_code_path' | 'project_figma_url'>
  test: Pick<Test, 'test_id' | 'project_id' | 'test_name' | 'test_url' | 'test_spec'>
  // ส่งเฉพาะ testcase ปัจจุบันที่ user สนใจ
  testcase?: Pick<
    Testcase,
    | 'testcase_id'
    | 'testcase_name'
    | 'testcase_description'
    | 'testcase_result'
    | 'testcase_script'
    | 'testcase_video'
    | 'testcase_type'
    | 'testcase_status'
    | 'testcase_category'
    | 'testcase_piority'
  >
}

export function useSendMessage() {
  const [msgHistory, updateMsgHistory] = useState<MessagesModel[]>([])
  const [isAwaitingReply, setIsAwaitingReply] = useState(false)

  const sendMessage = useCallback(
    async (textInput: string, filesInput: MessageFileMeta[] = [], context?: SendMessageContext) => {
      // 0) Validate Message-Input can't empty
      if (!textInput.trim() && filesInput.length === 0) return
      const hasFiles = filesInput.length > 0

      // 1) optimistic UI: โชว์ข้อความ user & preview รูปก่อน
      const messageRequest: MessagesModel = {
        id: crypto.randomUUID(),
        project_id: String(context?.project.project_id ?? ''),
        content: textInput,
        sender: 'user',
        attachments: hasFiles ? filesInput.map(f => f.preview) : [],
      }
      updateMsgHistory(prev => [...prev, messageRequest])
      setIsAwaitingReply(true)

      try {
        // 2) upload รูป → คืน URLs จริง
        if (hasFiles) {
          await uploadMessageAttachments(messageRequest, filesInput) // อัปเดต attachments โดยตรง
        }

        // 3) ส่งไป backend พร้อมรายละเอียด project / test / testcase ปัจจุบัน
        const messageResponse = await sendingMessage(messageRequest, context)
        // 4) update message history
        updateMsgHistory(prev => [...prev, messageResponse])
      } catch (err) {
        console.error(err)
        // TODO: handle error state
      } finally {
        setIsAwaitingReply(false)
      }
    },
    []
  )
  return { msgHistory, sendMessage, isAwaitingReply }
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



const sendingMessage = async (messageRequest: MessagesModel, context?: SendMessageContext) => {
  // ส่งข้อมูลไปยัง backend Python ผ่าน axios client ตัวเดียวกับ agent APIs
  const { api } = await import('./index')

  const res = await api.post("/chat/testcase", {
    message: messageRequest,
    context,
  })

  // backend ควรคืน shape ที่แสดงเป็นข้อความฝั่ง assistant
  return res.data
}