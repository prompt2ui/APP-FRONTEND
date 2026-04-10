// components/chat-panel/ChatPanel.tsx
"use client"
import { useCallback, useRef, useState } from "react"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { useSendMessage } from "@/api/useSendMessage"
import type { Project, Test, Testcase, MessageFileMeta } from "@/api/types"

interface ChatPanelProps {
  project: Project
  test: Test
  testcase?: Testcase
}

export function ChatPanel({ project, test, testcase }: ChatPanelProps) {
  const { msgHistory, sendMessage, isAwaitingReply } = useSendMessage()
  const suggestionSeq = useRef(0)
  const [fillFromSuggestion, setFillFromSuggestion] = useState<{
    seq: number
    text: string
  } | null>(null)

  const handlePickSuggestion = useCallback((text: string) => {
    suggestionSeq.current += 1
    setFillFromSuggestion({ seq: suggestionSeq.current, text })
  }, [])

  const handleSend = useCallback(
    async (text: string, metas: MessageFileMeta[]) => {
      // map project / test / current testcase → context ที่ backend จะเอาไปใช้ต่อ
      await sendMessage(text, metas, {
        project: {
          project_id: project.project_id,
          project_name: project.project_name,
          project_description: project.project_description,
          project_code_path: project.project_code_path,
          project_figma_url: project.project_figma_url,
        },
        test: {
          test_id: test.test_id,
          project_id: test.project_id,
          test_name: test.test_name,
          test_url: test.test_url,
          test_spec: test.test_spec,
        },
        // เฉพาะ testcase ปัจจุบันที่ user เลือกอยู่
        testcase:
          testcase && {
            testcase_id: testcase.testcase_id,
            testcase_name: testcase.testcase_name,
            testcase_description: testcase.testcase_description,
            testcase_result: testcase.testcase_result,
            testcase_script: testcase.testcase_script,
            testcase_video: testcase.testcase_video,
            testcase_type: testcase.testcase_type,
            testcase_status: testcase.testcase_status,
            testcase_category: testcase.testcase_category,
            testcase_piority: testcase.testcase_piority,
          },
      })
    },
    [project, test, testcase, sendMessage]
  )

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      {/* basis-0 + min-h-0 on messages keeps this row from growing past the panel (otherwise input is pushed off/clipped). */}
      <ChatMessages
        messages={msgHistory}
        showThinking={isAwaitingReply}
        onPickSuggestion={handlePickSuggestion}
      />
      <ChatInput onSendMessage={handleSend} fillFromSuggestion={fillFromSuggestion} />
    </div>
  )
}
