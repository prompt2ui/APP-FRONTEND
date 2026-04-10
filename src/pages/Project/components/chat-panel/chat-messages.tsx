"use client"

import { useEffect, useRef } from "react"
import { MessagesModel } from '@/api/types'
import { AssistantChatAvatar, ChatMessage } from "./chat-message"
import { ChatSuggestions } from "./chat-suggestions"


interface ChatMessagesProps {
  messages: MessagesModel[]
  /** แสดง bubble ระหว่างรอ reply จาก assistant */
  showThinking?: boolean
  onPickSuggestion?: (text: string) => void
}

function ChatThinkingBubble() {
  return (
    <div className="flex justify-start mb-4 items-start gap-2.5">
      <AssistantChatAvatar className="mt-0.5" />
      <div
        className="min-w-0 max-w-[80%] rounded-lg bg-muted px-4 py-3 text-muted-foreground text-sm flex items-center gap-2"
        aria-busy="true"
        aria-live="polite"
      >
        <span>กำลังคิด</span>
        <span className="flex gap-1 items-center" aria-hidden>
          <span
            className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      </div>
    </div>
  )
}

export function ChatMessages({
  messages,
  showThinking = false,
  onPickSuggestion,
}: ChatMessagesProps) {
  const thinkingAnchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showThinking) return
    thinkingAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [showThinking, messages.length])

  return (
    <div className="min-h-0 min-w-0 flex-1 basis-0 overflow-y-auto overscroll-contain p-4 space-y-6">
      {messages.length === 0 && !showThinking ? (
        <ChatSuggestions onPickSuggestion={onPickSuggestion ?? (() => {})} />
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {showThinking ? (
            <div ref={thinkingAnchorRef}>
              <ChatThinkingBubble />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
