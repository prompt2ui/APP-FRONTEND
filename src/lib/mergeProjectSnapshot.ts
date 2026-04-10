import type { Project, Test } from "@/api/types"

/**
 * API project detail can lag behind the client (new test row, running run).
 * Replacing the Zustand project blindly drops optimistic / in-flight tests and
 * can make Testing Detail think the current test vanished → wrong navigate.
 */
export function mergeProjectSnapshotPreserveInFlight(
  prev: Project | null,
  api: Project,
): Project {
  if (!prev || prev.project_id !== api.project_id) return api

  const byId = new Map<number, Test>(api.tests.map((t) => [t.test_id, t]))
  const extras: Test[] = []

  for (const t of prev.tests) {
    if (byId.has(t.test_id)) continue
    const st = (t.test_status || "").toLowerCase()
    if (t.test_id < 0 || st === "running") {
      extras.push(t)
    }
  }

  if (extras.length === 0) return api
  return { ...api, tests: [...api.tests, ...extras] }
}
