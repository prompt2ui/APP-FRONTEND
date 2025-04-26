"use client"

import { MessagesModel } from "@/types/message"
import { ChatMessage } from "./chat-message"
import { ChatSuggestions } from "./chat-suggestions"


interface ChatMessagesProps {
  messages: MessagesModel[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.length === 0 ? (
        <ChatSuggestions />
      ) : (
        messages.map((message) => <ChatMessage key={message.id} message={message} />)
      )}
    </div>
  )
}
