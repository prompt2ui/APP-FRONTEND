// app-ide/src/api/storage.tsx
import { create } from "zustand"
import type { 
  Project,
  Test,
  Testcase,
  NewTest,
  NewTestcaseItem
} from "./types"


interface StoreState {
  currentProject:     Project | null
  currentTest:        NewTest | null
  currentTestcases:   NewTestcaseItem[]
  setProject:         (project: Project | null) => void
  setTest:            (test: NewTest | null) => void
  setTestcases:       (items: NewTestcaseItem[]) => void
  insertTest:         (test: Test) => void
  updateTestInProject: (testId: number, updater: (test: Test) => Test) => void
  resetAll:           () => void
}

export const useStore = create<StoreState>((set) => ({
  currentProject:     null as Project | null,
  currentTest:        null as NewTest | null,
  currentTestcases:   []   as NewTestcaseItem[],

  setProject:         (project: Project | null) => set({ currentProject: project }),
  setTest:            (test: NewTest | null) => set({ currentTest: test }),
  setTestcases:       (items: NewTestcaseItem[]) => set({ currentTestcases: items }),

  insertTest: (test: Test) =>
    set((state) => ({
      currentProject: state.currentProject
        ? {
            ...state.currentProject,
            tests: [...state.currentProject.tests, test],
          }
        : state.currentProject,
    })),

  updateTestInProject: (testId: number, updater: (test: Test) => Test) =>
    set((state) => {
      if (!state.currentProject) return state
      return {
        currentProject: {
          ...state.currentProject,
          tests: state.currentProject.tests.map((t) =>
            t.test_id === testId ? updater(t) : t
          ),
        },
      }
    }),

  resetAll: () =>
    set({
      currentProject: null,
      currentTest: null,
      currentTestcases: [],
    }),
}))



export const useStoreActions = {
  project: {
    set(data: Project | null) {
      const { setProject } = useStore.getState()
      setProject(data)
    },
  },
  test: {
    set(data: NewTest | null) {
      const { setTest } = useStore.getState()
      setTest(data)
    },
    insert(data: Test) {
      useStore.getState().insertTest(data)
    },
    update(testId: number, updater: (test: Test) => Test) {
      useStore.getState().updateTestInProject(testId, updater)
    },
    upsertTestcase(testId: number, testcase: Testcase) {
      useStore.getState().updateTestInProject(testId, (test) => {
        const exists = test.testcases.some((tc) => tc.testcase_id === testcase.testcase_id)
        return {
          ...test,
          testcases: exists
            ? test.testcases.map((tc) => tc.testcase_id === testcase.testcase_id ? testcase : tc)
            : [...test.testcases, testcase],
        }
      })
    },
  },
  testcase: {
    set(items: NewTestcaseItem[]) {
      const { setTestcases } = useStore.getState()
      setTestcases(items)
    },
  },
  system: {
    resetAll() {
      const { resetAll } = useStore.getState()
      resetAll()
    },
  },
}