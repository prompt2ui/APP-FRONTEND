// components/chat-panel/ChatPanel.tsx
"use client"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { useSendMessage } from "@/hooks/useSendMessage"

interface ChatPanelProps {
  isChatExpanded: boolean
  onToggleExpand: () => void
}

export function ChatPanel({ isChatExpanded, onToggleExpand }: ChatPanelProps) {
  const { msgHistory, sendMessage } = useSendMessage()


  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full">
        <ChatHeader
          isChatExpanded={isChatExpanded}
          onToggleExpand={onToggleExpand}
        />
        <ChatMessages messages={msgHistory} />
        <ChatInput onSendMessage={sendMessage} />
      </div>
    </div>
  )
}
