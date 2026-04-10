"use client"

import { Button } from "@/components/ui/button"

const SUGGESTIONS: { label: string; text: string }[] = [
  { label: "ใช้งานระบบนี้ยังไงดี?", text: "ใช้งานระบบนี้ยังไงดี?" },
  { label: "แนะนำ Testcase ที่สำคัญ", text: "แนะนำ Testcase ที่สำคัญ" },
  { label: "ช่วยหา Bug ให้หน่อย", text: "ช่วยหา Bug ให้หน่อย" },
  { label: "ช่วยเสนอวิธีปรับปรุงระบบ", text: "ช่วยเสนอวิธีปรับปรุงระบบ" },
]

interface ChatSuggestionsProps {
  onPickSuggestion: (text: string) => void
}

export function ChatSuggestions({ onPickSuggestion }: ChatSuggestionsProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-3xl font-bold tracking-tight text-center">
        คุยกับผู้ช่วยเพื่อช่วยออกแบบและทดสอบระบบของคุณ
      </h1>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map(({ label, text }) => (
          <Button
            key={text}
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => onPickSuggestion(text)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
