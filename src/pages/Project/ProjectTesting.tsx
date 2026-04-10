"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useStore, useStoreActions } from "@/api/storage"
import { getProjectDetail } from "@/api/project"
import { createTestCase, enhanceSingleTestcase } from "@/api/agent"
import type { Test, Testcase, NewTestcaseItem } from "@/api/types"
import { PENDING_TEST_STREAM_STORAGE_KEY } from "./applyTestStreamEvent"
import { mergeProjectSnapshotPreserveInFlight } from "@/lib/mergeProjectSnapshot"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"
import {
  Folder,
  Trash2,
  Plus,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Globe,
  Paperclip,
  type LucideIcon,
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

import {
  motion,
  AnimatePresence
} from "framer-motion"

const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024
const ATTACHMENT_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.pdf,.txt,.csv,.docx,.xlsx,.xls,image/png,image/jpeg,image/webp,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"

/** Case Builder categories — `prompt.py` <output_format>: functional | visual | performance | error handling */
const TESTCASE_CATEGORY_OPTIONS = [
  { value: "functional", label: "Functional" },
  { value: "visual", label: "Visual" },
  { value: "performance", label: "Performance" },
  { value: "error handling", label: "Error handling" },
] as const

const TESTCASE_CATEGORY_VALUE_SET = new Set<string>(
  TESTCASE_CATEGORY_OPTIONS.map((o) => o.value),
)

/** Map retired / LLM-legacy labels so the Select always uses the closed vocabulary. */
const TESTCASE_CATEGORY_LEGACY: Record<string, string> = {
  responsive: "functional",
  usability: "functional",
  accessibility: "visual",
  visual_responsive: "functional",
}

function coerceTestcaseCategory(raw: string | undefined): string {
  const t = (raw ?? "").trim()
  if (TESTCASE_CATEGORY_VALUE_SET.has(t)) return t
  const lower = t.toLowerCase()
  if (lower === "error handling") return "error handling"
  if (lower === "functional" || lower === "visual" || lower === "performance") return lower
  const mapped = TESTCASE_CATEGORY_LEGACY[lower]
  if (mapped && TESTCASE_CATEGORY_VALUE_SET.has(mapped)) return mapped
  return "functional"
}

type LocalTestAttachment = {
  id: string
  file_name: string
  mime_type: string
  file_detail: string
  file_content_base64: string
}

function guessAttachmentMime(file: File): string {
  const lower = file.name.toLowerCase()
  if (file.type) return file.type
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".pdf")) return "application/pdf"
  if (lower.endsWith(".txt")) return "text/plain"
  if (lower.endsWith(".csv")) return "text/csv"
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  }
  if (lower.endsWith(".xls")) return "application/vnd.ms-excel"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  return "application/octet-stream"
}

function fileToBase64Payload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = reader.result as string
      const i = s.indexOf("base64,")
      resolve(i >= 0 ? s.slice(i + 7) : s)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

type AttachmentKindVisual = {
  label: string
  bgClass: string
  fgClass: string
  Icon: LucideIcon
}

function getAttachmentKindVisual(fileName: string): AttachmentKindVisual {
  const n = fileName.toLowerCase()
  if (n.endsWith(".pdf"))
    return {
      label: "PDF",
      bgClass: "bg-red-500/15",
      fgClass: "text-red-600 dark:text-red-400",
      Icon: FileText,
    }
  if (n.endsWith(".docx"))
    return {
      label: "DOCX",
      bgClass: "bg-blue-500/15",
      fgClass: "text-blue-600 dark:text-blue-400",
      Icon: FileText,
    }
  if (n.endsWith(".xlsx") || n.endsWith(".xls"))
    return {
      label: n.endsWith(".xlsx") ? "XLSX" : "XLS",
      bgClass: "bg-emerald-500/15",
      fgClass: "text-emerald-700 dark:text-emerald-400",
      Icon: FileSpreadsheet,
    }
  if (n.endsWith(".csv"))
    return {
      label: "CSV",
      bgClass: "bg-amber-500/15",
      fgClass: "text-amber-800 dark:text-amber-300",
      Icon: FileSpreadsheet,
    }
  if (n.endsWith(".txt"))
    return {
      label: "TXT",
      bgClass: "bg-slate-500/15",
      fgClass: "text-slate-600 dark:text-slate-400",
      Icon: FileText,
    }
  return {
    label: "FILE",
    bgClass: "bg-muted",
    fgClass: "text-muted-foreground",
    Icon: FileText,
  }
}

function AttachmentFileTypePreview({ fileName }: { fileName: string }) {
  const { label, bgClass, fgClass, Icon } = getAttachmentKindVisual(fileName)
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-1 px-1 ${bgClass}`}
    >
      <Icon className={`h-9 w-9 shrink-0 ${fgClass}`} strokeWidth={1.75} aria-hidden />
      <span className={`text-[10px] font-bold uppercase tracking-wide ${fgClass}`}>
        {label}
      </span>
    </div>
  )
}

export default function ProjectTestingPage() {
  const navigate = useNavigate()
  const { id: routeProjectId } = useParams()
  const { currentProject } = useStore()

  const [test_name, setTest_name] = useState("")
  const [test_url, setTest_url] = useState("")
  const [test_spec, setTest_spec] = useState("")
  const [test_extraction, setTest_extraction] = useState("")
  const [test_attachments, setTest_attachments] = useState<LocalTestAttachment[]>([])
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [TestCaseList, setTestCaseList] = useState<NewTestcaseItem[]>([])
  const [errorCases, setErrorCases] = useState<string[]>([])
  const [sparkleTarget, setSparkleTarget] = useState<{
    testcase_id: string
    field: "testcase_name" | "testcase_description"
  } | null>(null)
  const [sparkleLoadingId, setSparkleLoadingId] = useState<string | null>(null)
  const sparkleBlurTimerRef = useRef<number | null>(null)

  const handleValidateForm = () => {
    const invalidIds = TestCaseList
      .filter(tc => !tc.testcase_name?.trim() || !tc.testcase_description?.trim())
      .map(tc => tc.testcase_id)

    setErrorCases(invalidIds)
    return invalidIds.length === 0
  }

  const handleValidateButtonForm = () => {
    if (loadingState === "starting") return false
    if (loadingState === "analysis_complete") {
      const isValid =
        TestCaseList.length > 0 &&
        TestCaseList.every(
          (tc) => tc.testcase_name?.trim() && tc.testcase_description?.trim()
        )
      return isValid
    }

    if (loadingState === "idle") {
      const isValid =
        test_name.trim() !== "" && test_url.trim() !== ""
      return isValid
    }

    return false
  }


  type LoadingState = "idle" | "analyzing" | "analysis_fadeout" | "analysis_complete" | "starting"
  const [loadingState, setLoadingState] = useState<LoadingState>("idle")

  const handleAttachmentPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const added: LocalTestAttachment[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > MAX_ATTACHMENT_BYTES) continue
      const lower = file.name.toLowerCase()
      const allowed =
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".webp") ||
        lower.endsWith(".pdf") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".csv") ||
        lower.endsWith(".docx") ||
        lower.endsWith(".xlsx") ||
        lower.endsWith(".xls")
      if (!allowed) continue
      const b64 = await fileToBase64Payload(file)
      const mime = guessAttachmentMime(file)
      added.push({
        id: crypto.randomUUID(),
        file_name: file.name,
        mime_type: mime,
        file_detail: "",
        file_content_base64: b64,
      })
    }
    if (added.length) setTest_attachments((prev) => [...prev, ...added])
    e.target.value = ""
  }

  const updateAttachmentDetail = (id: string, file_detail: string) => {
    setTest_attachments((prev) => prev.map((a) => (a.id === id ? { ...a, file_detail } : a)))
  }

  const removeAttachment = (id: string) => {
    setTest_attachments((prev) => prev.filter((a) => a.id !== id))
  }

  useEffect(() => {
    if (!routeProjectId) {
      navigate("/")
      return
    }
    const pid = Number(routeProjectId)
    if (!Number.isFinite(pid)) {
      navigate("/")
      return
    }
    if (currentProject?.project_id === pid) return

    let cancelled = false
    void getProjectDetail(pid)
      .then((res) => {
        if (cancelled) return
        const fresh = {
          ...res.project,
          tests: res.tests || [],
        }
        const prev = useStore.getState().currentProject
        useStoreActions.project.set(
          mergeProjectSnapshotPreserveInFlight(
            prev?.project_id === fresh.project_id ? prev : null,
            fresh,
          ),
        )
      })
      .catch(() => {
        if (!cancelled) navigate("/")
      })
    return () => {
      cancelled = true
    }
  }, [routeProjectId, currentProject?.project_id, navigate])

  const routePid = routeProjectId ? Number(routeProjectId) : NaN
  const projectReady =
    Number.isFinite(routePid) && currentProject?.project_id === routePid
  if (!routeProjectId || !Number.isFinite(routePid)) return null
  if (!projectReady) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Spinner className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลดโปรเจกต์...</p>
      </div>
    )
  }


  //   const res = await generateTestCases(projectData) 
  //   setLoadingState("analysis_complete")
  //   setGeneratedTests(res)

  const handleCreateTestCase = async () => {
    if (loadingState === "idle") {
      // useStoreActions.test.set({
      // test_name:    test_name,
      // test_url:     test_url,
      // test_spec:    test_spec
      // })
      const data = {
        project_detail: currentProject,
        test_detail: {
          test_name,
          test_url,
          test_spec,
          test_attachments: test_attachments.map(
            ({ file_name, mime_type, file_detail, file_content_base64 }) => ({
              file_name,
              mime_type,
              file_detail,
              file_content_base64,
            })
          ),
        },
      }
      setLoadingState("analyzing")
      const response = await createTestCase(data)
      const testcases = response.testcase.map((item: any) => ({
        testcase_id: crypto.randomUUID(),
        testcase_priority: item.testcase_priority,
        testcase_category: coerceTestcaseCategory(item.testcase_category),
        testcase_name: item.testcase_name,
        testcase_description: item.testcase_description,
      }))
      setTestCaseList(testcases)
      setTest_extraction(response.test_extraction)
      setLoadingState("analysis_fadeout")
      console.log("current:", loadingState)

    } else if (loadingState === "analysis_complete") {
      if (!handleValidateForm()) return

      const data = {
        project_detail: currentProject,
        test_detail: {
          test_name,
          test_url,
          test_spec,
          test_extraction,
        },
        testcases: TestCaseList,
      }

      const placeholderTestId = -Math.abs(Date.now())
      const pendingTest: Test = {
        test_id: placeholderTestId,
        project_id: currentProject!.project_id,
        test_name,
        test_status: "running",
        test_url,
        test_spec,
        testcases: TestCaseList.map((tc, i) => ({
          testcase_id: -(i + 1),
          test_id: placeholderTestId,
          testcase_name: tc.testcase_name,
          testcase_description: tc.testcase_description ?? "",
          testcase_category: coerceTestcaseCategory(tc.testcase_category),
          testcase_piority: tc.testcase_priority,
          testcase_status: "running",
        })),
      }

      useStoreActions.test.insert(pendingTest)
      sessionStorage.setItem(
        PENDING_TEST_STREAM_STORAGE_KEY,
        JSON.stringify({ placeholderTestId, streamPayload: data }),
      )
      setLoadingState("analysis_complete")
      navigate(`/project/${routeProjectId}/testing/${placeholderTestId}`)
    }
  }

  const handleEditTestCase = (testcase_id: string, field: string, value: string) => {
    setTestCaseList(prev =>
      prev.map(item => (item.testcase_id === testcase_id ? { ...item, [field]: value } : item))
    )
  }

  const handleAddTestCase = () => {
    setTestCaseList(prev => [
      ...prev,
      {
        testcase_id: crypto.randomUUID(),
        testcase_priority: "Low",
        testcase_category: "functional",
        testcase_name: "",
        testcase_description: "",
      },
    ])
  }

  const handleDeleteTestCase = (testcase_id: string) => {
    setTestCaseList(prev => prev.filter(item => item.testcase_id !== testcase_id))
  }

  const getTestCasePriorityColor = (priority: string) => {
    const p = priority?.toLowerCase()
    if (p === "high") {
      return "bg-[#A84446]/10 text-[#A84446] border border-[#A84446]/40"
    }
    if (p === "medium") {
      return "bg-[#9FA83F]/10 text-[#9FA83F] border border-[#9FA83F]/40"
    }
    if (p === "low") {
      return "bg-[#498D52]/10 text-[#498D52] border border-[#498D52]/40"
    }
    return "border border-border text-foreground"
  }

  const clearSparkleTargetSoon = () => {
    if (sparkleBlurTimerRef.current) window.clearTimeout(sparkleBlurTimerRef.current)
    sparkleBlurTimerRef.current = window.setTimeout(() => {
      setSparkleTarget(null)
    }, 150)
  }

  const handleSparkles = async (testcase_id: string, field: "testcase_name" | "testcase_description") => {
    if (sparkleLoadingId) return
    const item = TestCaseList.find((t) => t.testcase_id === testcase_id)
    if (!item) return

    setSparkleLoadingId(testcase_id)

    try {
      const pair = await enhanceSingleTestcase({
        current_testcase_name: item.testcase_name ?? "",
        current_testcase_description: item.testcase_description ?? "",
        test_detail: {
          test_name: test_name,
          test_url: test_url,
          test_spec: test_spec,
          test_attachments: test_attachments.map(
            ({ file_name, mime_type, file_detail, file_content_base64 }) => ({
              file_name,
              mime_type,
              file_detail,
              file_content_base64,
            }),
          ),
        },
      })

      setTestCaseList((prev) =>
        prev.map((t) =>
          t.testcase_id === testcase_id
            ? {
              ...t,
              testcase_name: pair.testcase_name,
              testcase_description: pair.testcase_description,
            }
            : t,
        ),
      )

      setSparkleTarget({ testcase_id, field })
    } catch (e) {
      console.error("[enhanceSingleTestcase]", e)
    } finally {
      setSparkleLoadingId(null)
    }
  }

  if (loadingState === "analyzing" || loadingState === "analysis_fadeout") {
    return (
      <AnimatePresence mode="wait" onExitComplete={() => {
        if (loadingState === "analysis_fadeout") {
          setLoadingState("analysis_complete")
        }
      }}>
        {loadingState === "analyzing" && (
          <motion.div
            className="flex flex-col items-center justify-center bg-background"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="relative grid grid-cols-11 p-2 mt-12">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-tl from-background via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-bl from-background via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-transparent" />
              </div>

              {Array.from({ length: 88 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square size-16 border border-muted hover:bg-primary/40 transition-colors"
                />
              ))}
            </div>

            <img src="/processing.png" alt="processing-img" className="absolute scale-110" />
            <Spinner />
            <p className="mt-4 text-muted-foreground">กำลังประมวลผลคำขอของคุณ...</p>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <motion.div
      key="main-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex w-full min-w-0 flex-col bg-background text-foreground"
    >
      <div className="px-4 pt-4 pb-6 md:px-8 md:pt-8 md:pb-10">
        {(loadingState as string) === "idle" ? (
          <Card className="mx-auto max-w-2xl overflow-hidden border-border/80 bg-card/80 shadow-sm">
            <CardHeader className="space-y-0 pb-4">
              <div className="flex gap-4">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                  aria-hidden
                >
                  <Sparkles className="size-5" />
                </div>
                <div className="min-w-0 space-y-1.5 pt-0.5">
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    สร้างเทสต์ใหม่
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    เน้นชื่อกับ URL ก่อน — ส่วนอื่นเติมทีหลังได้ เราจะช่วยร่าง Test Case ให้
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pb-2">
              <section className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 md:p-5">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Globe className="size-3.5 opacity-80" aria-hidden />
                  ข้อมูลเทสต์
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="new-test-name" className="text-sm font-medium">
                      ชื่อเทสต์
                    </label>
                    <Input
                      id="new-test-name"
                      className="bg-background/80"
                      placeholder="เช่น Checkout / Dashboard"
                      value={test_name}
                      onChange={(e) => setTest_name(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="new-test-url" className="text-sm font-medium">
                      URL เริ่มต้น
                    </label>
                    <Input
                      id="new-test-url"
                      className="bg-background/80"
                      placeholder="https://…"
                      value={test_url}
                      onChange={(e) => setTest_url(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      หน้าแรกที่เปิดแล้วค่อยรันเทสต์
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="new-test-spec" className="text-sm font-medium">
                      โน้ตเพิ่มเติม
                      <span className="ml-1.5 font-normal text-muted-foreground">— ไม่บังคับ</span>
                    </label>
                    <Textarea
                      id="new-test-spec"
                      className="min-h-0 bg-background/80"
                      placeholder="จุดที่อยากให้โฟกัส เช่น API สำคัญ หรือ flow พิเศษ"
                      rows={3}
                      value={test_spec}
                      onChange={(e) => setTest_spec(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4 md:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Paperclip className="size-3.5 opacity-80" aria-hidden />
                    ไฟล์อ้างอิง
                  </h2>
                  <span className="text-xs text-muted-foreground">ไม่บังคับ</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  รูป · PDF · ข้อความ · ตาราง — สูงสุดประมาณ 6MB ต่อไฟล์
                </p>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  accept={ATTACHMENT_ACCEPT}
                  multiple
                  onChange={handleAttachmentPick}
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="flex min-h-[5.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-muted-foreground/35 bg-background/50 px-4 py-5 transition hover:border-muted-foreground/55 hover:bg-muted/30"
                >
                  <Folder className="h-7 w-7 text-muted-foreground/80" aria-hidden />
                  <span className="text-sm font-medium text-foreground">เลือกไฟล์</span>
                  <span className="text-center text-xs text-muted-foreground">
                    เลือกได้หลายไฟล์ · แต่ละไฟล์มีช่องให้ใส่คำอธิบายสั้น ๆ
                  </span>
                </button>

                {test_attachments.length > 0 && (
                  <ul className="space-y-3 pt-1">
                    {test_attachments.map((att) => {
                      const isImg =
                        att.mime_type.startsWith("image/") ||
                        /\.(png|jpe?g|webp)$/i.test(att.file_name)
                      return (
                        <li
                          key={att.id}
                          className="rounded-xl border border-border/80 bg-background/60 p-3 shadow-sm"
                        >
                          <div className="flex flex-wrap items-start gap-3">
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                              {isImg ? (
                                <img
                                  src={`data:${att.mime_type};base64,${att.file_content_base64}`}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <AttachmentFileTypePreview fileName={att.file_name} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className="truncate text-sm font-medium"
                                  title={att.file_name}
                                >
                                  {att.file_name}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 text-destructive hover:text-destructive"
                                  onClick={() => removeAttachment(att.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <Textarea
                                placeholder="สั้น ๆ ว่าไฟล์นี้ใช้ประกอบอะไร"
                                rows={2}
                                className="min-h-[3rem] text-sm"
                                value={att.file_detail}
                                onChange={(e) =>
                                  updateAttachmentDetail(att.id, e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </CardContent>
          </Card>

        ) : (loadingState as string) === "analysis_complete" ? (
          <Card className="max-w-6xl mx-auto bg-card/60 border border-border pb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">สร้างเทสต์ใหม่</CardTitle>
              <CardDescription className="text-muted-foreground">
                ตรวจสอบและปรับ
                <span className="text-primary/70 mx-1">รายละเอียด</span>
                ของ Test Case ที่ระบบสร้างให้
                <span className="text-primary/70 mx-1">รันทดสอบจริง</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Table className="border-separate border-spacing-y-2 text-sm">
                  <TableHeader>
                    <TableRow className="text-muted-foreground border-b border-border">
                      <TableHead className="w-[40px] text-center text-gray-500 text-xs">ลำดับ</TableHead>
                      <TableHead className="text-left text-gray-500 text-xs">ความสำคัญ</TableHead>
                      <TableHead className="text-left text-gray-500 text-xs">หมวดหมู่</TableHead>
                      <TableHead className="text-left text-gray-500 text-xs">ชื่อ Test Case</TableHead>
                      <TableHead className="text-left text-gray-500 text-xs">คำอธิบาย Test Case</TableHead>
                      <TableHead className="text-right" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {TestCaseList.map((testcase, i) => (
                      <TableRow
                        key={testcase.testcase_id}
                        className="rounded-lg border border-border hover:bg-card/60 transition-colors"
                      >
                        <TableCell className="text-gray-500 text-center">{i + 1}</TableCell>

                        <TableCell className="w-[8rem]">
                          <Select
                            value={testcase.testcase_priority}
                            onValueChange={val =>
                              handleEditTestCase(testcase.testcase_id, "testcase_priority", val)
                            }
                          >
                            <SelectTrigger
                              className={`w-[8rem] !h-14 text-xs font-medium border-none
                                        ${getTestCasePriorityColor(testcase.testcase_priority!)}`}
                            >
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="High"
                                className="text-xs font-medium text-[#A84446] hover:text-[#A84446]"
                              >
                                สูง
                              </SelectItem>
                              <SelectItem
                                value="Medium"
                                className="text-xs font-medium text-[#9FA83F] hover:text-[#9FA83F]"
                              >
                                ปานกลาง
                              </SelectItem>
                              <SelectItem
                                value="Low"
                                className="text-xs font-medium text-[#498D52] hover:text-[#498D52]"
                              >
                                ต่ำ
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="w-[10.5rem]">
                          <Select
                            value={coerceTestcaseCategory(testcase.testcase_category)}
                            onValueChange={(val) =>
                              handleEditTestCase(testcase.testcase_id, "testcase_category", val)
                            }
                          >
                            <SelectTrigger
                              className="w-full !h-14 text-xs font-medium border border-border bg-transparent"
                            >
                              <SelectValue placeholder="หมวดหมู่" />
                            </SelectTrigger>
                            <SelectContent>
                              {TESTCASE_CATEGORY_OPTIONS.map((opt) => (
                                <SelectItem
                                  key={opt.value}
                                  value={opt.value}
                                  className="text-xs font-medium"
                                >
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="w-lg">
                          <div className="relative">
                            <Input
                              value={testcase.testcase_name}
                              onChange={(e) =>
                                handleEditTestCase(
                                  testcase.testcase_id,
                                  "testcase_name",
                                  e.target.value,
                                )
                              }
                              onFocus={() => {
                                if (sparkleBlurTimerRef.current)
                                  window.clearTimeout(
                                    sparkleBlurTimerRef.current,
                                  )
                                setSparkleTarget({
                                  testcase_id: testcase.testcase_id,
                                  field: "testcase_name",
                                })
                              }}
                              onBlur={clearSparkleTargetSoon}
                              className={`h-14 pr-10 text-sm bg-transparent border-border transition-colors
                                      ${errorCases.includes(testcase.testcase_id) &&
                                  !testcase.testcase_name?.trim()
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : ""
                                }`}
                            />

                            {sparkleTarget?.testcase_id ===
                              testcase.testcase_id &&
                              sparkleTarget.field === "testcase_name" && (
                                <Button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void handleSparkles(
                                      testcase.testcase_id,
                                      "testcase_name",
                                    )
                                  }}
                                  size="icon"
                                  variant="ghost"
                                  disabled={sparkleLoadingId === testcase.testcase_id}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 text-[#9FA83F] hover:text-[#9FA83F]/80"
                                >
                                  {sparkleLoadingId === testcase.testcase_id ? (
                                    <Spinner className="size-4 text-primary/80" />
                                  ) : (
                                    <Sparkles className="h-4 w-4 text-primary" />
                                  )}
                                </Button>
                              )}
                          </div>
                        </TableCell>

                        <TableCell className="w-lg align-top">
                          <div className="relative">
                            <Textarea
                              value={testcase.testcase_description}
                              onChange={(e) =>
                                handleEditTestCase(
                                  testcase.testcase_id,
                                  "testcase_description",
                                  e.target.value,
                                )
                              }
                              onFocus={() => {
                                if (sparkleBlurTimerRef.current)
                                  window.clearTimeout(
                                    sparkleBlurTimerRef.current,
                                  )
                                setSparkleTarget({
                                  testcase_id: testcase.testcase_id,
                                  field: "testcase_description",
                                })
                              }}
                              onBlur={clearSparkleTargetSoon}
                              rows={2}
                              className={`h-14 pr-10 text-sm bg-transparent border-border transition-colors resize-y
                                      ${errorCases.includes(testcase.testcase_id) &&
                                  !testcase.testcase_description?.trim()
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : ""
                                }`}
                            />

                            {sparkleTarget?.testcase_id ===
                              testcase.testcase_id &&
                              sparkleTarget.field ===
                              "testcase_description" && (
                                <Button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void handleSparkles(
                                      testcase.testcase_id,
                                      "testcase_description",
                                    )
                                  }}
                                  size="icon"
                                  variant="ghost"
                                  disabled={sparkleLoadingId === testcase.testcase_id}
                                  className="absolute right-1 top-3 text-[#9FA83F] hover:text-[#9FA83F]/80"
                                >
                                  {sparkleLoadingId === testcase.testcase_id ? (
                                    <Spinner className="size-4 text-primary/80" />
                                  ) : (
                                    <Sparkles className="h-4 w-4 text-primary" />
                                  )}
                                </Button>
                              )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleDeleteTestCase(testcase.testcase_id)}
                            size="icon"
                            variant="ghost"
                            className="text-[#9D2B2F] hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button
                  onClick={handleAddTestCase}
                  variant="ghost"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span>เพิ่ม Test Case สำหรับ Frontend Test</span>
                </Button>
              </div>
            </CardContent>
          </Card>


        ) : null}
      </div>

      <footer className="shrink-0 border-t border-border bg-background px-4 py-4 flex justify-center md:py-6">
        <Button
          onClick={handleCreateTestCase}
          disabled={!handleValidateButtonForm()}
          className={`px-6 aria-label="create-testcase-button"
        ${handleValidateButtonForm() ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
        >
          <span className="transition-all duration-300 ease-out flex items-center gap-2">
            {loadingState === "starting" ? (
              <>
                <Spinner className="size-4" />
                กำลังเริ่มทดสอบ...
              </>
            ) : (
              "ถัดไป →"
            )}
          </span>
        </Button>
      </footer>
    </motion.div>
  )
}