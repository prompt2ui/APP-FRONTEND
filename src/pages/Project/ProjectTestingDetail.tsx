"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useStore, useStoreActions } from "@/api/storage"
import { getProjectDetail } from "@/api/project"
import axios from "axios"
import { exportTestReport, runningTestStream } from "@/api/agent"
import type { ExportDestination } from "@/api/agent"
import {
    applyTestStreamEvent,
    PENDING_TEST_STREAM_STORAGE_KEY,
    type PendingTestStreamBundle,
} from "./applyTestStreamEvent"
import { UserDetail, cn } from "@/lib/utils"
import { mergeProjectSnapshotPreserveInFlight } from "@/lib/mergeProjectSnapshot"
import {
    categoryBadgeClass,
    formatCategoryLabel,
    normalizeCategoryKey,
} from "@/lib/testcase-category"
import { integrationConnectorById } from "./integration-connectors"
import { toast } from "sonner"
import { TestcaseSuggestionMarkdown } from "./components/testcase-suggestion-markdown"

// import { getTestDetail } from "@/api/project"
import {
    MultiSelect,
    MultiSelectContent,
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectTrigger,
    MultiSelectValue,
} from "@/components/ui/multi-select"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

import { Separator } from "@/components/ui/separator"


import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Code2, Braces, Share } from "lucide-react"

import {
    EyeIcon,
    Code2Icon,
    PanelRightOpen,
    CircleX,
    Download,
    Slash,
    ChevronsRight,
    ChevronsLeft,
    ChevronsUpDown,
    CloudUpload,
    Info,
    Loader2,
    CheckCircle2,
    Clock,
    Play,
    Globe,
    Navigation,
    PencilLine,
    MousePointerClick,
    FileText,
    Send,
} from "lucide-react"

import {
    Card
} from "@/components/ui/card"

import {
    motion,
    AnimatePresence
} from "framer-motion"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { ChatPanel } from "./components/chat-panel/chat-panel"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import PreviewPanel from "./components/preview-panel"
import CodePanel from "./components/code-panel"

import { TestcaseResult, type StreamEvent, type Test, type Testcase } from "@/api/types"

function formatPdfSummaryTimestamp(iso: string) {
    try {
        return new Date(iso).toLocaleString("th-TH", {
            dateStyle: "short",
            timeStyle: "short",
        })
    } catch {
        return iso
    }
}

function isPassResult(r?: string) {
    return r === "pass" || r === "success"
}

function parseMaybeJson(value: unknown) {
    if (value == null) return null
    if (typeof value === "string") {
        const trimmed = value.trim()
        if (!trimmed) return null
        try {
            return JSON.parse(trimmed)
        } catch {
            return null
        }
    }
    if (typeof value === "object") return value
    return null
}

function getLogsFromPayload(payload: unknown): any[] {
    if (Array.isArray(payload)) return payload
    if (payload && typeof payload === "object" && Array.isArray((payload as any).logs)) {
        return (payload as any).logs
    }
    return []
}

function formatConsoleLog(log: any): string {
    if (!log || typeof log !== "object") return "-"
    if (typeof log.text === "string" && log.text.trim()) return log.text

    const type = typeof log.type === "string" ? log.type.toLowerCase() : ""
    const method = typeof log.method === "string" ? log.method.toUpperCase() : ""
    const url = typeof log.url === "string" ? log.url : ""
    const label = typeof log.label === "string" ? log.label : ""
    const tag = typeof log.tag === "string" ? log.tag : ""
    const valueSuffix = (() => {
        const v = log.value
        if (v === undefined || v === null) return ""
        const s = typeof v === "string" ? v : String(v)
        if (!s) return ""
        return ` · ${s}`
    })()

    if (type === "request") {
        return `${method || "REQUEST"} ${url || "-"}`
    }
    if (type === "navigated") {
        return `Nav · ${url || "-"}`
    }
    if (type === "input") {
        return `Typing · ${label || tag || "-"}${valueSuffix}`
    }
    if (type === "change") {
        return `Done · ${label || tag || "-"}${valueSuffix}`
    }
    if (type === "click") {
        const href = typeof log.href === "string" ? log.href : ""
        const base = `Click · ${label || tag || "-"}`
        return href ? `${base} → ${href}` : base
    }
    if (type === "submit") {
        const action = typeof log.action === "string" ? log.action : ""
        const submitMethod = typeof log.method === "string" ? log.method : ""
        const tail = [submitMethod && `(${submitMethod})`, action].filter(Boolean).join(" ")
        return tail ? `submit form ${tail}` : "submit form"
    }

    return [type, method, label || tag, url].filter(Boolean).join(" • ") || "-"
}

function getConsoleLogIcon(log: any) {
    const type = typeof log?.type === "string" ? log.type.toLowerCase() : ""

    if (type === "request") return <Globe className="h-3.5 w-3.5 text-current" />
    if (type === "navigated") return <Navigation className="h-3.5 w-3.5 text-current" />
    if (type === "input") return <PencilLine className="h-3.5 w-3.5 text-current" />
    if (type === "change") return <CheckCircle2 className="h-3.5 w-3.5 text-current" />
    if (type === "click") return <MousePointerClick className="h-3.5 w-3.5 text-current" />
    if (type === "submit") return <Send className="h-3.5 w-3.5 text-current" />

    return <FileText className="h-3.5 w-3.5 text-current" />
}

function IntegrationExportLogo({
    providerId,
    loading,
}: {
    providerId: "clickup" | "jira" | "github"
    loading: boolean
}) {
    if (loading) {
        return <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
    }
    const c = integrationConnectorById(providerId)
    if (!c) return null
    return (
        <img
            src={c.logoUrl}
            alt=""
            className={cn(c.logoSizeClass ?? "size-8", "object-contain")}
        />
    )
}

export default function ProjectTestingDetailPage() {
    const navigate = useNavigate()
    const { currentProject } = useStore()
    const { id: routeProjectId, currentTestId } = useParams()
    const [currentTest, setCurrentTest] = useState<Test>({} as Test)
    const [currentTestCase, setCurrentTestCase] = useState<string[]>([])
    const [TestCase, setTestCase] = useState<Testcase | undefined>(undefined)
    const [TestScript, setTestScript] = useState<string>("")
    const [TestVideo, setTestVideo] = useState<string>("")



    const [leftPanelResizeing, setleftPanelResizeing] = useState(false)
    const [paneState, setPaneState] = useState<0 | 1>(0)
    const leftPanelRef = useRef<any>(null)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [mode, setMode] = useState<"preview" | "code">("preview")
    const [isPageLoading, setIsPageLoading] = useState(true)

    const togglePaneViaHandle = () => {
        setPaneState((prev) => (prev === 0 ? 1 : 0))
    }

    const togglePaneViaButton = () => {
        if (!leftPanelRef.current) return
        setleftPanelResizeing(true)
        if (isCollapsed) {
            leftPanelRef.current.expand()
            setIsCollapsed(false)

        } else {
            leftPanelRef.current.collapse()
            setIsCollapsed(true)
        }
        setTimeout(() => setleftPanelResizeing(false), 300)
    }

    const selectDisplayMode = (m: "preview" | "code") => {
        setMode(m)
    }

    const [TestCaseMetadata, setTestCaseMetadata] = useState<{
        testcase_metadata: any
        testcase_console: any
        testcase_network: any
    }>({
        testcase_metadata: null,
        testcase_console: null,
        testcase_network: null,
    })

    const TestCaseChangeHandle = (value: string) => {
        const selected = currentTest.testcases.find(
            (tc) => String(tc.testcase_id) === value
        )
        if (selected) {
            selectTestcase(selected)
        }
    }

    const [exportingDestination, setExportingDestination] = useState<string | null>(null)

    const handleTestExport = async (destination: ExportDestination) => {
        const testcase = currentTest?.testcases?.filter((tc) =>
            currentTestCase.includes(String(tc.testcase_id))
        )
        if (!testcase?.length) {
            toast.error("เลือก testcase ที่ต้องการ export อย่างน้อยหนึ่งรายการ")
            return
        }
        const userId = currentProject?.user_id ?? UserDetail.user_id
        setExportingDestination(destination)
        const loadingId = toast.loading(
            destination === "supabase"
                ? "กำลังสร้างรายงานสรุป (AI + PDF) อาจใช้เวลาหลายนาที…"
                : `กำลังสร้างรายงานสรุป ${destination}`,
            { duration: Number.POSITIVE_INFINITY },
        )
        try {
            const res = await exportTestReport({
                user_id: userId,
                destination,
                test: {
                    test_id: currentTest?.test_id,
                    project_id: currentTest?.project_id,
                    project_name: currentProject?.project_name,
                    test_name: currentTest?.test_name,
                    test_url: currentTest?.test_url ?? null,
                },
                testcases: testcase,
            })
            if (!res?.success) {
                const errBody = res as { error?: string; detail?: string }
                toast.error(errBody?.error ?? errBody?.detail ?? "Export ไม่สำเร็จ")
                return
            }
            const raw = res as {
                test_summary_url?: string
                external_url?: string
                data?: { test_summary_url?: string; external_url?: string }
            }
            const summaryUrl =
                raw.test_summary_url ?? raw.data?.test_summary_url
            const externalUrl = raw.external_url ?? raw.data?.external_url
            if (summaryUrl) window.open(summaryUrl, "_blank", "noopener,noreferrer")
            if (externalUrl) window.open(externalUrl, "_blank", "noopener,noreferrer")
            if (summaryUrl && currentProject?.project_id) {
                try {
                    const detailRes = await getProjectDetail(currentProject.project_id)
                    const fresh = {
                        ...detailRes.project,
                        tests: detailRes.tests || [],
                    }
                    const prev = useStore.getState().currentProject
                    useStoreActions.project.set(
                        mergeProjectSnapshotPreserveInFlight(
                            prev?.project_id === fresh.project_id ? prev : null,
                            fresh,
                        ),
                    )
                } catch {
                    /* ignore refresh failure */
                }
            }
            if (destination === "supabase") {
                toast.success("เปิดรายงานสรุปแล้ว")
            } else {
                toast.success(`ส่งไปยัง ${destination} แล้ว`)
            }
        } catch (e: unknown) {
            console.error(e)
            if (axios.isAxiosError(e)) {
                const data = e.response?.data as { detail?: unknown } | undefined
                const detail = data?.detail
                const msg =
                    typeof detail === "string"
                        ? detail
                        : e.code === "ECONNABORTED"
                            ? "หมดเวลารอ (timeout 10 นาที) — ลองใหม่หรือลดจำนวน testcase"
                            : typeof data === "object" && data && "message" in data
                                ? String((data as { message?: unknown }).message)
                                : e.message
                toast.error(msg)
            } else {
                toast.error("Export ล้มเหลว")
            }
        } finally {
            toast.dismiss(loadingId)
            setExportingDestination(null)
        }
    }

    const selectTestcase = useCallback((tc: Testcase | undefined) => {
        if (!tc) return
        setTestCase(tc)
        setTestScript(tc.testcase_script || "")
        const parsedMetadata = parseMaybeJson(tc.testcase_metadata)
        const parsedConsole = parseMaybeJson(tc.testcase_console_logs)
        const parsedNetwork = parseMaybeJson(tc.testcase_network_logs)

        setTestCaseMetadata({
            testcase_metadata: parsedMetadata,
            testcase_console: parsedConsole,
            testcase_network: parsedNetwork,
        })

        if (tc.testcase_status === "completed" && tc.testcase_video) {
            setTestVideo(tc.testcase_video)
        } else {
            setTestVideo("")
        }
    }, [])

    useEffect(() => {
        if (!routeProjectId || !currentTestId) {
            navigate("/")
            return
        }
        const pid = Number(routeProjectId)
        if (!Number.isFinite(pid)) {
            navigate("/")
            return
        }

        if (!currentProject || currentProject.project_id !== pid) {
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
                            prev?.project_id === fresh.project_id
                                ? prev
                                : null,
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
        }

        const found = currentProject.tests.find(
            (t) => String(t.test_id) === String(currentTestId),
        )
        if (!found) {
            const tid = Number(currentTestId)
            if (Number.isFinite(tid) && tid < 0) {
                setIsPageLoading(true)
                return
            }
            navigate(`/project/${routeProjectId}`)
            return
        }
        setCurrentTest(found)

        if (found && found.testcases && found.testcases.length > 0) {
            const selectedId = TestCase?.testcase_id
            const stillExists = selectedId
                ? found.testcases.find((tc) => tc.testcase_id === selectedId)
                : undefined
            const upgraded =
                stillExists &&
                stillExists.testcase_status === "completed" &&
                TestCase?.testcase_status !== "completed"

            if (!TestCase || upgraded) {
                selectTestcase(
                    stillExists ||
                    found.testcases.find(
                        (tc) => tc.testcase_status === "completed",
                    ) ||
                    found.testcases[0],
                )
            } else if (!stillExists) {
                selectTestcase(found.testcases[0])
            }
        }
        setIsPageLoading(false)
    }, [routeProjectId, currentTestId, currentProject, navigate, selectTestcase])

    /**
     * Generate-test flow: Create Test page inserts an optimistic run + navigates here immediately.
     * We consume POST /agent/testing/stream on this page so leaving Create Test does not abort fetch.
     */
    useEffect(() => {
        const pidFromRoute = routeProjectId ? Number(routeProjectId) : NaN
        if (
            !currentProject?.project_id ||
            !currentTestId ||
            !Number.isFinite(pidFromRoute) ||
            currentProject.project_id !== pidFromRoute
        ) {
            return
        }

        const routeTestId = Number(currentTestId)
        if (!Number.isFinite(routeTestId) || routeTestId >= 0) return

        const raw = sessionStorage.getItem(PENDING_TEST_STREAM_STORAGE_KEY)
        if (!raw) return

        let bundle: PendingTestStreamBundle
        try {
            bundle = JSON.parse(raw) as PendingTestStreamBundle
        } catch {
            return
        }
        if (bundle.placeholderTestId !== routeTestId) return

        const consumerLockKey = `pendingStreamConsumer:${routeTestId}`
        if (sessionStorage.getItem(consumerLockKey) === "1") return
        sessionStorage.setItem(consumerLockKey, "1")

        const streamPayload = bundle.streamPayload
        const applyOptions = {
            projectId: currentProject.project_id,
            fallbackTestName: streamPayload.test_detail.test_name,
            fallbackTestUrl: streamPayload.test_detail.test_url,
            fallbackTestSpec: streamPayload.test_detail.test_spec,
            placeholderTestId: routeTestId,
        }

        void runningTestStream(
            streamPayload as Parameters<typeof runningTestStream>[0],
            (event: StreamEvent) => {
                if (event.type === "error") {
                    const msg =
                        typeof event.message === "string" ? event.message : "การสร้างสคริปต์ล้มเหลว"
                    toast.error(msg)
                    sessionStorage.removeItem(PENDING_TEST_STREAM_STORAGE_KEY)
                    sessionStorage.removeItem(consumerLockKey)
                    return
                }

                const realTestId = applyTestStreamEvent(event, applyOptions)
                if (realTestId != null && routeProjectId) {
                    navigate(`/project/${routeProjectId}/testing/${realTestId}`, {
                        replace: true,
                    })
                    sessionStorage.removeItem(PENDING_TEST_STREAM_STORAGE_KEY)
                    sessionStorage.removeItem(consumerLockKey)
                }
                if (event.type === "done") {
                    sessionStorage.removeItem(PENDING_TEST_STREAM_STORAGE_KEY)
                    sessionStorage.removeItem(consumerLockKey)
                }
            },
        ).catch((err: unknown) => {
            console.error("[testing/stream]", err)
            toast.error("ไม่สามารถเชื่อมต่อสตรีมการสร้างสคริปต์ได้")
            sessionStorage.removeItem(PENDING_TEST_STREAM_STORAGE_KEY)
            sessionStorage.removeItem(consumerLockKey)
        })
    }, [currentProject, currentTestId, navigate, routeProjectId])

    const routePidForRender = routeProjectId ? Number(routeProjectId) : NaN
    const projectAligned =
        Number.isFinite(routePidForRender) &&
        currentProject != null &&
        currentProject.project_id === routePidForRender
    if (!projectAligned || currentTest.test_id == null) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">กำลังโหลดรายละเอียดการทดสอบ...</p>
            </div>
        )
    }

    const isTestRunning = currentTest.test_status === "running"
    const completedCount = currentTest.testcases?.filter((tc) => tc.testcase_status === "completed").length || 0
    const totalCount = currentTest.testcases?.length || 0

    const tcStatusRaw = TestCase?.testcase_status
    const tcStatus: string | undefined =
        tcStatusRaw === "pending" ? "running" : tcStatusRaw?.toLowerCase()
    const tcResultNorm = TestCase?.testcase_result?.trim().toLowerCase() ?? ""

    /** Prisma: status running|completed; result success|fail — badge shows outcome when completed. */
    const testcaseOutcomeLabel: "running" | "success" | "fail" | "completed" | "unknown" = (() => {
        if (tcStatus === "running") return "running"
        if (tcStatus === "completed") {
            if (tcResultNorm === TestcaseResult.success || tcResultNorm === "pass") return "success"
            if (tcResultNorm === TestcaseResult.fail || tcResultNorm === "failure") return "fail"
            return "completed"
        }
        return "unknown"
    })()

    const canShowLeftPanel = tcStatus === "completed" || tcStatus === "running"

    const consoleLogs = getLogsFromPayload(TestCaseMetadata?.testcase_console)
    const networkLogs = getLogsFromPayload(TestCaseMetadata?.testcase_network)
    const hasConsoleLogs = consoleLogs.length > 0
    const hasNetworkLogs = networkLogs.length > 0








    return (
        <motion.div
            key="main-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-background z-40 text-foreground min-h-[93vh] max-h-[93vh] relative! overflow-y-clip"
        >
            <AnimatePresence>
                {isPageLoading && (
                    <motion.div
                        key="page-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm"
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล Test และ Testcase...</p>
                    </motion.div>
                )}
            </AnimatePresence>
            <ResizablePanelGroup direction="horizontal" className="w-screen h-full !overflow-visible">
                {canShowLeftPanel && (
                    <>
                        <ResizablePanel
                            ref={leftPanelRef}
                            defaultSize={25}
                            minSize={20}
                            maxSize={60}
                            collapsible={true}
                            collapsedSize={0}
                            onCollapse={togglePaneViaHandle}
                            onExpand={togglePaneViaHandle}
                            className={`
                z-15
                ${leftPanelResizeing
                                    ? "duration-300 transition-all"
                                    : ""}
              `}
                        >
                            <div className="relative flex h-full min-w-0 flex-1 flex-col">
                                {/* <ChatMessages/>
                // <ChatInput/> */}
                                <Tabs defaultValue="detail" className="flex h-full min-h-0 flex-1 flex-col gap-0">
                                    <TabsList className="w-full shrink-0 bg-background h-16! min-h-16! rounded-none border-b border-foreground/30 m-0 py-2 px-4">
                                        <TabsTrigger value="detail" className="data-[state=active]:cursor-auto !bg-background cursor-pointer rounded-xl! border-none data-[state=active]:bg-[#27272A]!">Detail</TabsTrigger>
                                        <TabsTrigger value="chat" className="data-[state=active]:cursor-auto !bg-background cursor-pointer rounded-xl! border-none data-[state=active]:bg-[#27272A]!">Chat</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="detail" className="mt-0 min-h-0 max-h-full flex-1 overflow-y-auto data-[state=inactive]:hidden">
                                        {/* <div className="w-full">
                            
                        </div> */}

                                        <Accordion
                                            type="multiple"
                                            className="w-full px-4"
                                            defaultValue={["item-1"]}
                                        >

                                            <AccordionItem className="bg-[#262626] border rounded-xl px-2 my-2" value="item-1">
                                                <AccordionTrigger className="text-lg font-bold">
                                                    <span className="flex flex-row items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary border border-primary/40 shadow-sm">
                                                            <Info size={22} />
                                                        </div>
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-base font-semibold">ข้อมูลการทดสอบ</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                รายละเอียดของ Test และ Testcase ปัจจุบัน
                                                            </span>
                                                        </div>
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="text-sm space-y-2 py-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">ชื่อการทดสอบ</span>
                                                        <span className="font-medium text-right truncate max-w-[250px]">
                                                            {currentTest.test_name}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">กรณีทดสอบ</span>
                                                        <span className="font-medium text-right truncate max-w-[250px]">
                                                            {TestCase?.testcase_name}
                                                        </span>
                                                    </div>

                                                    <div className="h-px w-full bg-border my-2" />

                                                    <div className="w-full flex flex-col gap-1">
                                                        <span className="text-muted-foreground">รายละเอียด</span>
                                                        <span className="font-medium flex-wrap text-sm">
                                                            {TestCase?.testcase_description}
                                                        </span>
                                                    </div>

                                                    <div className="h-px w-full bg-border my-2" />

                                                    {TestCase?.testcase_suggestion?.trim() ? (
                                                        <div className="w-full flex flex-col gap-1">
                                                            <span className="text-muted-foreground">
                                                                คำแนะนำ
                                                            </span>
                                                            <div className="min-w-0 text-sm font-medium flex-wrap">
                                                                <TestcaseSuggestionMarkdown
                                                                    markdown={TestCase.testcase_suggestion.trim()}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    <div className="h-px w-full bg-border my-2" />

                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">สถานะ</span>
                                                        <span className="capitalize text-right">
                                                            <Badge
                                                                variant="outline"
                                                                className={`
                                                    inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-xs font-medium
                                                    ${testcaseOutcomeLabel === "success"
                                                                        ? "bg-[#498D52]/10 text-[#498D52] border-[#498D52]/40"
                                                                        : testcaseOutcomeLabel === "fail"
                                                                            ? "bg-[#A84446]/10 text-[#A84446] border-[#A84446]/40"
                                                                            : testcaseOutcomeLabel === "running"
                                                                                ? "bg-[#9FA83F]/10 text-[#9FA83F] border-[#9FA83F]/40"
                                                                                : testcaseOutcomeLabel === "completed"
                                                                                    ? "bg-muted text-muted-foreground border-border"
                                                                                    : "bg-muted text-muted-foreground border-border"
                                                                    }
                                                `}
                                                            >
                                                                {testcaseOutcomeLabel === "success" && (
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                )}
                                                                {testcaseOutcomeLabel === "fail" && (
                                                                    <CircleX className="h-3.5 w-3.5" />
                                                                )}
                                                                {testcaseOutcomeLabel === "running" && (
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                )}
                                                                {(testcaseOutcomeLabel === "completed" ||
                                                                    testcaseOutcomeLabel === "unknown") && (
                                                                        <Clock className="h-3.5 w-3.5" />
                                                                    )}
                                                                <span>{testcaseOutcomeLabel !== "unknown" ? testcaseOutcomeLabel : (tcStatus ?? "-")}</span>
                                                            </Badge>
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center gap-3">
                                                        <span className="text-muted-foreground shrink-0">
                                                            หมวดหมู่
                                                        </span>
                                                        <span className="text-right">
                                                            {(() => {
                                                                const tc = TestCase
                                                                if (!tc) {
                                                                    return (
                                                                        <span className="font-medium text-muted-foreground">
                                                                            -
                                                                        </span>
                                                                    )
                                                                }
                                                                const fromCategory = (
                                                                    tc.testcase_category ?? ""
                                                                ).trim()
                                                                const fromType = (
                                                                    tc.testcase_type ?? ""
                                                                ).trim()
                                                                const raw = fromCategory || fromType
                                                                if (!raw) {
                                                                    return (
                                                                        <span className="font-medium text-muted-foreground">
                                                                            -
                                                                        </span>
                                                                    )
                                                                }
                                                                const key = normalizeCategoryKey(
                                                                    fromCategory || raw,
                                                                )
                                                                const cls = categoryBadgeClass(key)
                                                                const label = formatCategoryLabel(raw)
                                                                return (
                                                                    <span
                                                                        className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium ${cls}`}
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                )
                                                            })()}
                                                        </span>
                                                    </div>

                                                    {currentTest.test_url && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">เว็บไซต์</span>
                                                            <a
                                                                href={currentTest.test_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-blue-500 underline truncate max-w-[250px] text-right"
                                                            >
                                                                {(() => {
                                                                    const clean = currentTest.test_url
                                                                        .replace(/^https?:\/\//, "")
                                                                    return clean.length > 15
                                                                        ? `${clean.slice(0, 15)}...`
                                                                        : clean
                                                                })()}
                                                            </a>
                                                        </div>
                                                    )}

                                                    {currentTest.start_time && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">เริ่มทดสอบ</span>
                                                            <span className="text-right">
                                                                {new Date(currentTest.start_time).toLocaleString("th-TH")}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {currentTest.end_time && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">สิ้นสุด</span>
                                                            <span className="text-right">
                                                                {new Date(currentTest.end_time).toLocaleString("th-TH")}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* <div className="h-px w-full bg-border my-2" /> */}

                                                    {TestCaseMetadata?.testcase_metadata?.url && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">URL</span>
                                                            <a
                                                                href={TestCaseMetadata.testcase_metadata.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-blue-500 underline truncate max-w-[250px] text-right"
                                                            >
                                                                {TestCaseMetadata.testcase_metadata.url}
                                                            </a>
                                                        </div>
                                                    )}

                                                    {TestCaseMetadata?.testcase_metadata?.os && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">OS</span>
                                                            <span>{TestCaseMetadata.testcase_metadata.os}</span>
                                                        </div>
                                                    )}

                                                    {TestCaseMetadata?.testcase_metadata?.browser && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Browser</span>
                                                            <span>{TestCaseMetadata.testcase_metadata.browser}</span>
                                                        </div>
                                                    )}

                                                    {TestCaseMetadata?.testcase_metadata?.window && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Window size</span>
                                                            <span>
                                                                {TestCaseMetadata.testcase_metadata.window.width}×{TestCaseMetadata.testcase_metadata.window.height}
                                                            </span>
                                                        </div>
                                                    )}
                                                </AccordionContent>



                                            </AccordionItem>

                                            <AccordionItem
                                                className="bg-[#262626] border rounded-xl px-2 my-2"
                                                value="item-2"
                                                disabled={!hasConsoleLogs}
                                            >
                                                <AccordionTrigger className="text-lg font-bold">
                                                    <span className="flex flex-row items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary  shadow-sm">
                                                            <Code2 size={22} />
                                                        </div>
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-base font-semibold">Console &amp; UI logs</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {hasConsoleLogs
                                                                    ? "Console, error ใน page และเหตุการณ์ UI (คลิก, input, submit, นำทาง)"
                                                                    : "ยังไม่มีข้อความ log ที่เกิดขึ้นระหว่างการทดสอบ"}
                                                            </span>
                                                        </div>
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                                    <TooltipProvider>
                                                        {hasConsoleLogs ? (
                                                            <Table className="w-full text-sm">
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="text-foreground/30">time</TableHead>
                                                                        <TableHead className="text-foreground/30">log</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>

                                                                <TableBody>
                                                                    {consoleLogs.map((log: any, i: number) => {
                                                                        const start = new Date(TestCaseMetadata?.testcase_console?.startTime || 0).getTime()
                                                                        const now = new Date(log.timestamp).getTime()
                                                                        const diff = Number.isFinite(now - start)
                                                                            ? ((now - start) / 1000).toFixed(2)
                                                                            : "0.00"

                                                                        return (

                                                                            <TableRow key={i} className="hover:bg-muted/50">
                                                                                <TableCell className="text-muted-foreground text-xs">
                                                                                    {diff}s
                                                                                </TableCell>
                                                                                <TableCell className="font-mono text-xs">
                                                                                    <div className="flex items-center gap-2">
                                                                                        {getConsoleLogIcon(log)}
                                                                                        <span>{formatConsoleLog(log)}</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        )
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        ) : (
                                                            <p className="py-4 text-center text-sm text-muted-foreground">
                                                                ยังไม่มีข้อมูล
                                                            </p>
                                                        )}

                                                    </TooltipProvider>
                                                </AccordionContent>
                                            </AccordionItem>

                                            <AccordionItem
                                                className="bg-[#262626] border rounded-xl px-2 my-2"
                                                value="item-3"
                                                disabled={!hasNetworkLogs}
                                            >
                                                <AccordionTrigger className="text-lg font-bold">
                                                    <span className="flex flex-row items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary  shadow-sm">
                                                            <Share size={22} />
                                                        </div>
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-base font-semibold">Network</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {hasNetworkLogs
                                                                    ? "รายการคำขอ Network ระหว่างการทดสอบ"
                                                                    : "ยังไม่มีรายการคำขอ Network ระหว่างการทดสอบ"}
                                                            </span>
                                                        </div>
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                                    <TooltipProvider>
                                                        {hasNetworkLogs ? (
                                                            <Table className="w-full text-sm">
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="text-foreground/30 w-[50px] text-center"> </TableHead>
                                                                        <TableHead className="text-foreground/30 w-[150px]">name</TableHead>
                                                                        <TableHead className="text-foreground/30 ">status</TableHead>
                                                                        <TableHead className="text-foreground/30 text-right">domain</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>

                                                                <TableBody>
                                                                    {networkLogs.map((log: any, i: number) => {
                                                                        const name = log.url?.split("/").pop() || log.url
                                                                        let domain = "-"
                                                                        try {
                                                                            if (log.url) domain = new URL(log.url).hostname
                                                                        } catch {
                                                                            domain = "-"
                                                                        }
                                                                        const icon = name?.endsWith(".js")
                                                                            ? <Braces className="text-orange-500" size={16} />
                                                                            : name?.includes("settings")
                                                                                ? <Share className="text-green-500" size={16} />
                                                                                : <Code2 className="text-blue-500" size={16} />

                                                                        return (
                                                                            <Tooltip key={i}>
                                                                                <TooltipTrigger asChild>
                                                                                    <TableRow className="cursor-pointer hover:bg-muted/50">
                                                                                        <TableCell className="text-center">
                                                                                            <div className="flex flex-row items-center gap-2 text-foreground/30">
                                                                                                {i + 1}
                                                                                                {icon}
                                                                                            </div>
                                                                                        </TableCell>
                                                                                        <TableCell className="w-[150px] flex items-center gap-2">{name}</TableCell>
                                                                                        <TableCell>{log.status}</TableCell>
                                                                                        <TableCell className="text-right">{domain}</TableCell>
                                                                                    </TableRow>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="max-w-md p-4 text-xs">
                                                                                    <p><b>Request URL:</b> {log.url}</p>
                                                                                    <p><b>Request Method:</b> {log.method || "GET"}</p>
                                                                                    <p><b>Status Code:</b> {log.status}</p>
                                                                                    <p><b>Content-Type:</b> {log.contentType || "-"}</p>
                                                                                    <p><b>Cache-Control:</b> {log.cache || "-"}</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        )
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        ) : (
                                                            <p className="py-4 text-center text-sm text-muted-foreground">
                                                                ยังไม่มีข้อมูล
                                                            </p>
                                                        )}
                                                    </TooltipProvider>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </TabsContent>
                                    <TabsContent value="chat" className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col data-[state=inactive]:hidden">
                                        {currentProject && TestCase && (
                                            <ChatPanel
                                                project={currentProject as any}
                                                test={currentTest}
                                                testcase={TestCase}
                                            />
                                        )}
                                        {currentProject && !TestCase && (
                                            <ChatPanel
                                                project={currentProject as any}
                                                test={currentTest}
                                            />
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />
                    </>
                )}

                <ResizablePanel
                >
                    <div className="relative flex h-full min-w-0 flex-1 flex-col bg-sidebar-accent">
                        <header
                            id="header-actions"
                            className="bg-background h-16 relative z-20 flex w-full shrink-0 items-center justify-between gap-4 px-3 border-b border-foreground/30"
                        >

                            <div className="flex items-center gap-3">
                                {/* === Pane Toggle === */}
                                {canShowLeftPanel && (
                                    <Button
                                        onClick={togglePaneViaButton}
                                        variant="secondary"
                                        className="cursor-pointer p-0.5 size-11 group bg-secondary hover:bg-secondary disabled:opacity-100 disabled:cursor-not-allowed"
                                    >
                                        {paneState === 0 ? (
                                            <div className="size-8 group-disabled:bg-background/70 p-[0.4rem] rounded-md hover:bg-secondary/80">
                                                <ChevronsRight
                                                    size={33}
                                                    className="group-disabled:text-[#13AE5B] m-auto items-center"
                                                />
                                            </div>
                                        ) : (
                                            <div className="size-8 group-disabled:bg-background/70 p-[0.4rem] rounded-md hover:bg-secondary/80">
                                                <ChevronsLeft
                                                    size={33}
                                                    className="group-disabled:text-[#13AE5B] m-auto items-center"
                                                />
                                            </div>
                                        )}
                                    </Button>
                                )}

                                {/* === Mode Selector === */}
                                <div className="relative border-input border flex bg-input/30 items-center gap-0.5 px-0.5 rounded-md">
                                    <Button
                                        onClick={() => selectDisplayMode("preview")}
                                        disabled={mode === "preview"}
                                        variant="secondary"
                                        className="p-0.5 size-11 group bg-transparent hover:bg-transparent cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed"
                                    >
                                        <div className="size-8 group-disabled:bg-input/30 p-[0.4rem] rounded-md hover:bg-input/50">
                                            <EyeIcon
                                                size={33}
                                                className="group-disabled:text-[#A05BFE] m-auto items-center"
                                            />
                                        </div>
                                    </Button>

                                    <Button
                                        onClick={() => selectDisplayMode("code")}
                                        disabled={mode === "code"}
                                        variant="secondary"
                                        className="p-0.5 size-11 group bg-transparent hover:bg-transparent cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed"
                                    >
                                        <div className="size-8 group-disabled:bg-input/30 p-[0.4rem] rounded-md hover:bg-input/50">
                                            <Code2Icon
                                                size={33}
                                                className="group-disabled:text-[#13AE5B] m-auto items-center"
                                            />
                                        </div>
                                    </Button>
                                </div>

                                <div className="relative bg-input/30 border-input border flex items-center w-full px-5 gap-0.5 p-0.5 size-11 rounded-md text-xs">
                                    <h1>{currentTest.test_name}</h1>
                                    <Slash className="-rotate-[20deg] size-3.5 text-muted-foreground/50 mx-1" />
                                    <Select
                                        value={TestCase ? String(TestCase.testcase_id) : ""}
                                        onValueChange={TestCaseChangeHandle}
                                    >
                                        <SelectTrigger className="w-[240px] !text-xs text-foreground flex justify-between items-center !bg-transparent !border-none !hover:bg-transparent !focus:border-none ">
                                            <SelectValue placeholder="Choose testcase" />
                                        </SelectTrigger>
                                        <SelectContent className="text-foreground/60">
                                            {currentTest?.testcases?.map((testcase) => (
                                                <SelectItem key={testcase.testcase_id} value={String(testcase.testcase_id)}
                                                    className="!py-2 my-2 !text-xs flex justify-between items-center">
                                                    <span>
                                                        {(() => {
                                                            const r =
                                                                testcase.testcase_result?.trim().toLowerCase() ??
                                                                ""
                                                            const isSuccess = r === TestcaseResult.success
                                                            const isFail = r === TestcaseResult.fail
                                                            if (isSuccess) {
                                                                return (
                                                                    <div className="flex items-center gap-1 rounded-lg bg-green-500/15 px-3 py-0.5 text-center text-[0.7rem] text-green-500">
                                                                        <CheckCircle2 className="size-3 text-green-500" />
                                                                    </div>
                                                                )
                                                            }
                                                            if (isFail) {
                                                                return (
                                                                    <div className="flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-0.5 text-center text-[0.7rem] text-red-500">
                                                                        <CircleX className="size-3 text-red-500" />
                                                                    </div>
                                                                )
                                                            }
                                                            const status =
                                                                testcase.testcase_status?.toLowerCase() ?? ""
                                                            const showSpinner = status === "running"
                                                            return (
                                                                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-3 py-0.5 text-center text-[0.7rem] text-muted-foreground">
                                                                    {showSpinner ? (
                                                                        <Loader2 className="size-3 animate-spin" />
                                                                    ) : (
                                                                        <Clock className="size-3" />
                                                                    )}
                                                                </div>
                                                            )
                                                        })()}
                                                    </span>

                                                    <span>{testcase.testcase_name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* <h1 className="text-lg font-bold">
                        {paneState === 0 ? "Chat Panel" : "Code Panel"}
                    </h1> */}
                            {/* <div className="relative border-input border flex bg-input/30 items-center gap-0.5 px-0.5 rounded-md cursor-pointer">
                        <Button
                            onClick={() => selectDisplayMode("preview")}
                            disabled={mode === "preview"}
                            variant="secondary"
                            className="p-0.5 size-11 w-fit group bg-transparent hover:bg-transparent cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <CloudUpload/>
                            <h1>share</h1>
                        </Button>
                    </div> */}
                            <DropdownMenu>
                                <DropdownMenuTrigger className="hover:bg-input/70 relative text-center flex items-center p-0.5 px-3 gap-2 size-11 w-fit border-input border bg-input/30 rounded-md cursor-pointer">
                                    <CloudUpload size={15} className="mt-1" />
                                    <h1>share</h1>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="mr-3 mt-4 bg-background border border-foreground/30 w-sm px-5 py-3">
                                    <h1 className="text-lg py-2">Test Summarize</h1>
                                    <div className="my-3">

                                        <MultiSelect values={currentTestCase} onValuesChange={setCurrentTestCase}>
                                            <MultiSelectTrigger className="w-full max-w-[400px]">
                                                <MultiSelectValue placeholder="Select testcase you want to export..." />
                                            </MultiSelectTrigger>
                                            <MultiSelectContent className="gap-4">
                                                <MultiSelectGroup>
                                                    {currentTest?.testcases?.map((testcase) => (
                                                        <MultiSelectItem
                                                            key={testcase.testcase_id}
                                                            value={String(testcase.testcase_id)}
                                                        >
                                                            {testcase.testcase_name}
                                                        </MultiSelectItem>
                                                    ))}
                                                </MultiSelectGroup>
                                            </MultiSelectContent>
                                        </MultiSelect>
                                        {/* <Separator className="my-4" /> */}
                                        <div className="flex justify-center gap-8 border-t pt-6">
                                            <div className="flex flex-col items-center gap-2">
                                                <Button
                                                    onClick={() => void handleTestExport("supabase")}
                                                    disabled={!!exportingDestination}
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-14 w-14 cursor-pointer rounded-full border-2 hover:bg-muted"
                                                >
                                                    {exportingDestination === "supabase" ? (
                                                        <Loader2 className="h-6 w-6 animate-spin" />
                                                    ) : (
                                                        <Download className="h-6 w-6" />
                                                    )}
                                                </Button>
                                                <span className="text-sm font-medium">Download</span>
                                            </div>

                                            <div className="flex flex-col items-center gap-2 overflow-hidden">
                                                <Button
                                                    onClick={() => void handleTestExport("clickup")}
                                                    disabled={!!exportingDestination}
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-14 w-14 cursor-pointer overflow-hidden rounded-full border-2 hover:bg-muted"
                                                >
                                                    <IntegrationExportLogo
                                                        providerId="clickup"
                                                        loading={exportingDestination === "clickup"}
                                                    />
                                                </Button>
                                                <span className="text-sm font-medium">ClickUp</span>
                                            </div>

                                            <div className="flex flex-col items-center gap-2 overflow-hidden">
                                                <Button
                                                    onClick={() => void handleTestExport("jira")}
                                                    disabled={!!exportingDestination}
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-14 w-14 cursor-pointer overflow-hidden rounded-full border-2 hover:bg-muted"
                                                >
                                                    <IntegrationExportLogo
                                                        providerId="jira"
                                                        loading={exportingDestination === "jira"}
                                                    />
                                                </Button>
                                                <span className="text-sm font-medium">Jira</span>
                                            </div>

                                            <div className="flex flex-col items-center gap-2 overflow-hidden">
                                                <Button
                                                    onClick={() => void handleTestExport("github")}
                                                    disabled={!!exportingDestination}
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-14 w-14 cursor-pointer overflow-hidden rounded-full border-2 hover:bg-muted"
                                                >
                                                    <IntegrationExportLogo
                                                        providerId="github"
                                                        loading={exportingDestination === "github"}
                                                    />
                                                </Button>
                                                <span className="text-sm font-medium">GitHub</span>
                                            </div>
                                        </div>
                                    </div>

                                    {Array.isArray(currentTest.test_summaries) &&
                                        currentTest.test_summaries.length > 0 && (
                                            <div className="mt-4 border-t pt-4">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                                    ประวัติ PDF สรุป
                                                </p>
                                                <ul className="max-h-44 space-y-1 overflow-y-auto pr-1">
                                                    {currentTest.test_summaries.map((row) => (
                                                        <li key={row.id}>
                                                            <button
                                                                type="button"
                                                                className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/80"
                                                                onClick={() =>
                                                                    window.open(
                                                                        row.test_summary,
                                                                        "_blank",
                                                                        "noopener,noreferrer",
                                                                    )
                                                                }
                                                            >
                                                                <span className="flex w-full items-center gap-2 font-medium">
                                                                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                                                                    <span className="truncate">
                                                                        {formatPdfSummaryTimestamp(
                                                                            row.created_at,
                                                                        )}
                                                                    </span>
                                                                </span>
                                                                <span className="pl-[1.375rem] text-[0.7rem] text-muted-foreground">
                                                                    เปิดรายงาน PDF
                                                                </span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </header>
                        {mode === "code" ? <CodePanel filename="test.js" content={TestScript} />
                            :

                            <ResizablePanelGroup
                                direction="vertical"
                                className="flex relative w-full bg-background"
                            >
                                <ResizablePanel
                                    defaultSize={95}
                                    maxSize={95}
                                    className="flex w-full relative">
                                    {tcStatus === "completed" && TestVideo ? (
                                        <video
                                            key={TestVideo}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            controls
                                            className="min-h-full min-w-full rounded-lg shadow-lg"
                                        >
                                            <source src={TestVideo} />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
                                            {tcStatus === "running" ? (
                                                <>
                                                    <div className="relative">
                                                        <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                                                        <Loader2 className="size-12 text-slate-700 animate-spin relative" />
                                                    </div>
                                                    <div className="text-center space-y-1">
                                                        <p className="text-sm font-medium text-foreground">
                                                            กำลังทดสอบ...
                                                        </p>
                                                        <p className="text-xs text-muted-foreground max-w-xs">
                                                            {TestCase?.testcase_name}
                                                        </p>
                                                    </div>
                                                    {isTestRunning && (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-400/10 border border-slate-400/20">
                                                            <span className="text-xs text-slate-500 font-medium">
                                                                {completedCount} / {totalCount} เสร็จสิ้น
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="size-10 text-muted-foreground/30" />
                                                    <p className="text-sm text-muted-foreground">
                                                        เลือก testcase เพื่อดูผลลัพธ์
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </ResizablePanel>

                                {/* <ResizableHandle />

                        <ResizablePanel 
                        maxSize={80}
                        className="min-w-0 flex-1">
                            <Card className="h-full w-full">
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                auto area
                            </div>
                            </Card>
                        </ResizablePanel> */}
                            </ResizablePanelGroup>
                        }
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </motion.div>
    )
}