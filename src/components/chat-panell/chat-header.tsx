"use client"

import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatHeaderProps {
  isChatExpanded: boolean
  onToggleExpand: () => void
}

export function ChatHeader({ isChatExpanded, onToggleExpand }: ChatHeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border px-4">
      <div className="flex items-center">
        <div className="text-lg font-semibold">v0</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleExpand}
        className="h-8 w-8"
        aria-label={isChatExpanded ? "Collapse chat" : "Expand chat"}
      >
        <ArrowLeftIcon
          className={`h-4 w-4 transition-transform duration-200 ${
            !isChatExpanded ? "rotate-180" : ""
          }`}
        />

      </Button>
    </header>
  )
}
