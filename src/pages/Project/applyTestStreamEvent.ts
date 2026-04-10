import { useStore, useStoreActions } from "@/api/storage"
import type { StreamEvent, Test, Testcase } from "@/api/types"

/** Prisma `TestcaseResult`: success | fail. Accept legacy `pass` from older payloads. */
export function normalizeTestcaseForUi(tc: Testcase): Testcase {
  const r = tc.testcase_result?.trim().toLowerCase()
  let testcase_result = tc.testcase_result
  if (r === "pass") testcase_result = "success"
  if (r === "failure") testcase_result = "fail"
  return { ...tc, testcase_result }
}

export const PENDING_TEST_STREAM_STORAGE_KEY = "pendingTestGenerateStream"

export type PendingTestStreamBundle = {
  placeholderTestId: number
  streamPayload: {
    project_detail: unknown
    test_detail: {
      test_name: string
      test_url: string
      test_spec: string
      test_extraction: string
    }
    testcases: unknown[]
  }
}

export type ApplyTestStreamEventOptions = {
  projectId: number
  fallbackTestName: string
  fallbackTestUrl: string
  fallbackTestSpec: string
  placeholderTestId: number
}

/**
 * Applies one SSE event to the project test store. On `test_created`, replaces the
 * optimistic row (placeholder id) via `update` instead of `insert`.
 * @returns Real `test_id` when `test_created` (caller may navigate); otherwise `undefined`.
 */
export function applyTestStreamEvent(
  event: StreamEvent,
  options: ApplyTestStreamEventOptions,
): number | undefined {
  const {
    projectId,
    fallbackTestName,
    fallbackTestUrl,
    fallbackTestSpec,
    placeholderTestId,
  } = options

  if (event.type === "test_created" && event.test_id) {
    const pendingTestcases: Testcase[] = (event.testcases || []).map((tc, i) => ({
      testcase_id: -(i + 1),
      test_id: event.test_id!,
      testcase_name: tc.testcase_name,
      testcase_description: tc.testcase_description,
      testcase_category: tc.testcase_category,
      testcase_piority: tc.testcase_priority?.toLowerCase?.() ?? tc.testcase_priority,
      testcase_status: "running",
    }))

    const pendingTest: Test = {
      test_id: event.test_id,
      project_id: projectId,
      test_name: event.test_name || fallbackTestName,
      test_status: "running",
      test_url: event.test_url || fallbackTestUrl,
      test_spec: fallbackTestSpec,
      testcases: pendingTestcases,
    }

    useStoreActions.test.update(placeholderTestId, () => pendingTest)
    return event.test_id
  }

  if (event.type === "testcase_running" && event.testcase_name) {
    const state = useStore.getState()
    const tid =
      event.test_id ??
      state.currentProject?.tests.find((t) => t.test_status === "running")?.test_id
    if (tid == null) return

    useStoreActions.test.update(tid, (t) => ({
      ...t,
      testcases: t.testcases.map((tc, i) => {
        const matchByIndex = typeof event.index === "number" && event.index === i
        const matchByName = tc.testcase_name === event.testcase_name
        if (matchByIndex || matchByName) {
          return { ...tc, testcase_status: "running" }
        }
        return tc
      }),
    }))
    return
  }

  if (event.type === "testcase_complete" && event.testcase) {
    const state = useStore.getState()
    const tid =
      event.test_id ??
      state.currentProject?.tests.find((t) => t.test_status === "running")?.test_id
    if (tid == null) return

    const base = event.testcase as Testcase
    const completedTc = normalizeTestcaseForUi({
      ...base,
      testcase_status: event.testcase_status ?? base.testcase_status ?? "completed",
      testcase_result: event.testcase_result ?? base.testcase_result,
      testcase_piority: event.testcase_piority ?? base.testcase_piority,
    })
    useStoreActions.test.update(tid, (t) => {
      const byIndex =
        typeof event.index === "number" &&
        event.index >= 0 &&
        event.index < t.testcases.length
      if (byIndex) {
        return {
          ...t,
          testcases: t.testcases.map((tc, i) =>
            i === event.index ? completedTc : tc,
          ),
        }
      }
      const byName = t.testcases.some(
        (tc) => tc.testcase_name === completedTc.testcase_name,
      )
      return {
        ...t,
        testcases: byName
          ? t.testcases.map((tc) =>
              tc.testcase_name === completedTc.testcase_name ? completedTc : tc,
            )
          : [...t.testcases, completedTc],
      }
    })
    return
  }

  if (event.type === "done" && event.test) {
    const finalTest = event.test
    const normalized: Test = {
      ...finalTest,
      testcases: (finalTest.testcases || []).map((tc) =>
        normalizeTestcaseForUi(tc as Testcase),
      ),
    }
    useStoreActions.test.update(finalTest.test_id, () => normalized)
    return
  }

  return
}
