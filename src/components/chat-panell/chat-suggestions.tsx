"use client"

import { Button } from "@/components/ui/button"

export function ChatSuggestions() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-3xl font-bold tracking-tight text-center">What can I help you ship?</h1>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button variant="outline" className="h-9">
          Clone a Screenshot
        </Button>
        <Button variant="outline" className="h-9">
          Import from Figma
        </Button>
        <Button variant="outline" className="h-9">
          Landing Page
        </Button>
        <Button variant="outline" className="h-9">
          Sign Up Form
        </Button>
      </div>
    </div>
  )
}
