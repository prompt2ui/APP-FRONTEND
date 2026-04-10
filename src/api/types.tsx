export interface NewTestcaseItem {
  testcase_id: string
  testcase_name: string
  testcase_description?: string
  testcase_priority?: string
  /** Case Builder vocabulary: functional | visual | performance | error handling */
  testcase_category?: string
}

// Canonical enums used by UI/AI logic.
// NOTE: backend may still return legacy values like "pending" / "success".
// We normalize those values in the UI layer.
export enum TestcaseStatus {
  running = "running",
  completed = "completed",
}

export enum TestcasePriority {
  low = "low",
  medium = "medium",
  high = "high",
}

/** ผลรันจริงจาก backend — ค่าอื่นหรือว่าง = ยัง running / รอผล */
export enum TestcaseResult {
  success = "success",
  fail = "fail",
}

export interface NewTest {
  test_name: string
  test_url: string
  test_spec: string
  test_attachments: []
}


/** One generated PDF summary row from `Test_Summary` (URL points to stored file). */
export interface TestSummary {
  id: number
  test_id: number
  test_summary: string
  created_at: string
}

export interface Testcase {
  testcase_id: number
  test_id: number
  testcase_name: string
  testcase_description?: string
  testcase_script?: string
  testcase_result?: string
  testcase_unique_id?: string
  testcase_video?: string
  testcase_type?: string
  testcase_status: string
  testcase_category?: string
  testcase_piority?: string
  /** Evaluator UX/product note; persisted as Markdown (GFM). */
  testcase_suggestion?: string
  testcase_console_logs?: string
  testcase_network_logs?:  string
  testcase_metadata?: string
  executed_at?: string
  created_at?: string
}

export interface Test {
  test_id: number
  project_id: number
  test_name: string
  test_status: string
  test_url?: string
  test_spec: string
  test_source_reference?: string
  test_documentation?: string
  start_time?: string
  end_time?: string
  testcases: Testcase[]
  /** PDF summary history for this test (newest first). */
  test_summaries?: TestSummary[]
}

export interface StreamEvent {
  type: "test_created" | "testcase_running" | "testcase_complete" | "done" | "error"
  test_id?: number
  /** 0-based index matching the testcases[] order from test_created / request payload */
  index?: number
  testcase_unique_id?: string
  project_id?: number
  test_name?: string
  test_url?: string
  total_testcases?: number
  testcases?: Array<{
    testcase_id: string
    testcase_name: string
    testcase_description: string
    testcase_category?: string
    testcase_priority: string
    testcase_status: string
  }>
  testcase_name?: string
  testcase_id?: string
  /** Echo of Prisma fields for SSE consumers (also on `testcase` when present). */
  testcase_result?: string
  testcase_status?: string
  testcase_piority?: string
  testcase?: Testcase
  test?: Test
  message?: string
}

export interface Project {
  project_id: number
  /** Owner user id (for server-side export / provider credentials). */
  user_id?: number
  project_name: string
  project_thumbnail?: string | null
  project_description?: string
  project_code_path?: string
  project_figma_url?: string
  created_at: string
  updated_at: string
  tests: Test[]
}




export interface MessageFileMeta {
    id: string
    file: File
    preview: string
  }
  
  
export interface MessagesModel {
    id: string
    project_id: string
    content: string
    sender: "user" | "assistant"
    attachments?: string[]
  }
  
  