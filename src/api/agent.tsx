import axios from "axios"

import { API_BASE_URL, api } from "./index"
import type { StreamEvent } from "./types"

export type TestAttachmentPayload = {
  file_name: string
  mime_type: string
  /** User note per file (what the LLM should use as context). */
  file_detail: string
  /** Raw base64 (no data: prefix). */
  file_content_base64: string
}

/**
 * Generate testcases from URL extraction + optional **`test_detail.test_attachments`**.
 * Multiple files supported (images, PDF, TXT, CSV, DOCX, XLSX, XLS). Each file should include **`file_detail`**.
 */
export async function createTestCase(
  data: {
    project_detail: any
    test_detail: {
      test_name: string
      test_url: string
      test_spec: string
      /** Optional; omit or `[]` when none. */
      test_attachments?: TestAttachmentPayload[]
    }
  }
) {
  const res = await api.post("/agent/testcase", data)
  return res.data.data
}

/** AI polish for one testcase row (name + description); optional test_url + same attachments shape as create. */
export async function enhanceSingleTestcase(payload: {
  current_testcase_name: string
  current_testcase_description: string
  test_detail: {
    test_name: string
    test_url: string
    test_spec: string
    test_attachments?: TestAttachmentPayload[]
  }
}): Promise<{ testcase_name: string; testcase_description: string }> {
  const res = await api.post("/agent/testcase/draft", payload)
  return res.data.data
}


export async function runningTest(
  data: {
    project_detail: any
    test_detail: { test_name: string; test_url: string; test_spec: string, test_extraction: string }
    testcases: any[]
  }
) {
  const res = await api.post("/agent/testing", data)
  console.log(res.data)
  return res.data.data
}


export async function runningTestStream(
  data: {
    project_detail: any
    test_detail: { test_name: string; test_url: string; test_spec: string; test_extraction: string }
    testcases: any[]
  },
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const baseURL = api.defaults.baseURL || "http://localhost:8000/"
  const url = `${baseURL}agent/testing/stream`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.replace(/\r$/, "").trim()
      if (!trimmed.startsWith("data: ")) continue
      try {
        const event: StreamEvent = JSON.parse(trimmed.slice(6))
        onEvent(event)
      } catch {
        console.warn("[SSE] Failed to parse:", trimmed)
      }
    }
  }

  const tail = buffer.replace(/\r$/, "").trim()
  if (tail.startsWith("data: ")) {
    try {
      const event: StreamEvent = JSON.parse(tail.slice(6))
      onEvent(event)
    } catch { /* ignore */ }
  }
}


export async function createTestSummary(data: {
  test: any
  testcases: any[]
}) {
  const res = await api.post("/agent/summary", data)
  return res.data.data.test_summary_url
}

export type ExportDestination = "supabase" | "github" | "clickup" | "jira"
/** Integration id — matches DB enum `ProviderType` / column `provider_type`. */
export type ProviderTypeId = "github" | "clickup" | "jira"
/** @deprecated Use ProviderTypeId */
export type ProviderKindId = ProviderTypeId

/** Export summary PDF; non-supabase targets use API keys stored server-side for `user_id`. */
export async function exportTestReport(payload: {
  user_id: number
  destination?: ExportDestination
  test: any
  testcases: any[]
}) {
  // Use raw axios — the shared `api` client’s response interceptor resolves errors as success,
  // which breaks try/catch + loading state on the export screen.
  const res = await axios.post(
    `${API_BASE_URL}agent/export`,
    {
      destination: payload.destination ?? "supabase",
      user_id: payload.user_id,
      test: payload.test,
      testcases: payload.testcases,
    },
    {
      timeout: 600_000,
      headers: { "Content-Type": "application/json" },
    },
  )
  return res.data as { success?: boolean; data?: unknown; detail?: string }
}

export async function listUserProviders(userId: number) {
  const res = await api.get(`/user/${userId}/providers`)
  return res.data.data as Array<{
    provider_id: number
    provider_type: string
    has_secret: boolean
    provider_config: Record<string, unknown>
  }>
}

export async function upsertUserProvider(payload: {
  user_id: number
  provider_type: ProviderTypeId
  provider_api_key?: string | null
  provider_config?: Record<string, unknown> | null
}) {
  const res = await api.put("/user/providers", payload)
  return res.data
}

