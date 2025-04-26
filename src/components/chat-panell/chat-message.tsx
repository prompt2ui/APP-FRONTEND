// src/components/chat-panel/chat-message.tsx
'use client'

import { MessagesModel } from '@/types/message'

interface ChatMessageProps {
  message: MessagesModel
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={`flex mb-4 ${
        message.sender === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 space-y-2
          ${
            message.sender === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
      >
        {/* ถ้ามีรูปแนบ, แสดงเป็น thumbnail */}
        {message.attachments?.length ? (
          <div className="flex flex-wrap gap-2">
            {message.attachments.slice(0, 3).map((url, i) => (
              <div
                key={i}
                className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={url}
                  alt={`attachment-${i}`}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : null}

        {/* ข้อความ */}
        <div>{message.content}</div>
      </div>
    </div>
  )
}
