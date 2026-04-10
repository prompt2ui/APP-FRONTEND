"use client"


import { useEffect, useState, Fragment } from "react"
import { useParams } from "react-router-dom"
import { useStore, useStoreActions } from "@/api/storage"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

import { ChevronRight, CircleX, Sparkles } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Edit2, Loader2, CheckCircle2, Clock, Slash } from "lucide-react"
import { Button } from "@/components/ui/button"


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartAreaStacked } from "./components/chart-area"
import { ChartBarStacked } from "./components/chart-bar"
import { toast } from "sonner"

import type { Project, Test, Testcase } from "@/api/types"
import { getProjectDetail, deleteTestByID } from "@/api/project"
import { mergeProjectSnapshotPreserveInFlight } from "@/lib/mergeProjectSnapshot"
import {
  categoryBadgeClass,
  formatCategoryLabel,
  normalizeCategoryKey,
} from "@/lib/testcase-category"

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openTestIds, setOpenTestIds] = useState<number[]>([])


  async function TestDeleteHandle(test_id: number) {
    if (pendingDeleteIds.includes(test_id)) return

    setPendingDeleteIds((prev) => [...prev, test_id])

    try {
      await deleteTestByID(test_id)
      let nextProject: Project | null = null
      setProject((prev) => {
        if (!prev) return prev
        nextProject = {
          ...prev,
          tests: prev.tests.filter((t) => t.test_id !== test_id),
        }
        return nextProject
      })
      if (nextProject) {
        useStoreActions.project.set(nextProject)
      }
    } catch {
      toast.error("Failed to delete test")
    } finally {
      setPendingDeleteIds((prev) => prev.filter((id) => id !== test_id))
    }
  }

  useEffect(() => {
    if (!id) return
    const pidNum = Number(id)
    const snap = useStore.getState().currentProject
    const warmCache =
      Number.isFinite(pidNum) &&
      snap?.project_id === pidNum &&
      Array.isArray(snap.tests)

    if (warmCache) {
      setProject(snap)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    getProjectDetail(id)
      .then((res) => {
        const fresh: Project = {
          ...res.project,
          tests: res.tests || [],
        }
        const prevSnap = useStore.getState().currentProject
        const prev =
          prevSnap?.project_id === fresh.project_id ? prevSnap : null
        const project_detail = mergeProjectSnapshotPreserveInFlight(prev, fresh)

        setProject(project_detail)
        useStoreActions.project.set(project_detail)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [id])
  if (!project) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลโปรเจกต์...</p>
      </div>
    )
  }

  const visibleTests = project.tests.filter(
    (test) => !pendingDeleteIds.includes(test.test_id)
  )

  function TestDetailHandle(test: Test) {
    if (!id) return
    navigate(`/project/${id}/testing/${test.test_id}`)
  }

  return (
    <div className="bg-background text-foreground relative space-y-6 p-6">
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">กำลังอัปเดตข้อมูลล่าสุด...</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ภาพรวมการทดสอบของโปรเจกต์</h1>
          <p className="text-muted-foreground">{project.project_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Edit2 className="w-4 h-4 mr-2" /> แก้ไขข้อมูลโปรเจกต์
          </Button>
        </div>
      </div>

      
      {visibleTests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 md:col-span-2 py-12 text-center border border-border rounded-lg bg-muted/20">
          <Sparkles className="h-10 w-10 text-primary" />
          <p className="text-sm font-medium">ไม่มี Test สำหรับโปรเจกต์นี้</p>
          <p className="text-sm text-muted-foreground">กรุณาสร้าง test ก่อน</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <ChartAreaStacked tests={visibleTests} />
          <ChartBarStacked tests={visibleTests} />
        </div>
      )}

      
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <div className="flex items-center gap-3">
          <Select>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="pass">ผ่าน</SelectItem>
              <SelectItem value="fail">ไม่ผ่าน</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort: วันที่สร้าง" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">วันที่สร้าง</SelectItem>
              <SelectItem value="name">ชื่อ Test</SelectItem>
              <SelectItem value="status">สถานะ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Input placeholder="ค้นหา..." className="w-[220px]" />
          <Link
            to={`/project/${id}/testing`}
            className="group flex flex-col overflow-hidden rounded-lg"
          >
            <Button className="bg-sidebar-primary hover:bg-primary/70 text-white cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> สร้างการทดสอบใหม่
            </Button>
          </Link>
        </div>
      </div>

      
      <Card>
        <CardContent className="px-6">
          {visibleTests.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <p>ยังไม่มี Test Case สำหรับโปรเจกต์นี้ เริ่มสร้างการทดสอบเลยไหม?</p>
                <Link
                  to={`/project/${id}/testing`}
                  className="group flex flex-col overflow-hidden rounded-lg"
                >
                  <Button className="bg-sidebar-primary hover:bg-primary/70 text-white cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" /> สร้างการทดสอบใหม่
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="!border-0 bg-[#212129]">
                  <TableHead className="rounded-tl-lg px-5 w-[40px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead className="text-gray-500 text-xs">ชื่อ Test</TableHead>
                  <TableHead className="text-gray-500 text-xs">สถานะ</TableHead>
                  <TableHead className="rounded-tr-lg" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleTests.map((test: Test) => {
                  const isOpen = openTestIds.includes(test.test_id)

                  const toggleOpen = () => {
                    setOpenTestIds((prev) =>
                      prev.includes(test.test_id)
                        ? prev.filter((id) => id !== test.test_id)
                        : [...prev, test.test_id],
                    )
                  }

                  return (
                    <Fragment key={test.test_id}>
                      {/* ────────────── Row Trigger ────────────── */}
                      <TableRow
                        className="hover:bg-transparent hover:scale-101 transition-all duration-200 cursor-pointer data-[state=open]:border-0"
                        data-state={isOpen ? "open" : "closed"}
                        onClick={toggleOpen}
                      >
                        <TableCell id="arrow" className="px-5">
                          <ChevronRight
                            className={`size-4 shrink-0 transition-transform duration-200 ${
                              isOpen ? "rotate-90" : ""
                            }`}
                          />
                        </TableCell>

                        <TableCell className="font-medium w-[20rem]">
                          {test.test_name}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium border ${
                              test.test_status === "completed"
                                ? "bg-[#498D52]/10 text-[#498D52] border-[#498D52]/40"
                                : test.test_status === "running" || test.test_status === "Running"
                                ? "bg-[#9FA83F]/10 text-[#9FA83F] border-[#9FA83F]/40"
                                : "bg-[#A84446]/10 text-[#A84446] border-[#A84446]/40"
                            }`}
                          >
                            {(test.test_status === "completed") && (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {(test.test_status === "running" || test.test_status === "Running") && (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                            {test.test_status !== "completed" &&
                              test.test_status !== "running" &&
                              test.test_status !== "Running" && (
                                <Slash className="h-3.5 w-3.5" />
                            )}
                            <span className="capitalize">{test.test_status}</span>
                          </span>
                        </TableCell>

                        <TableCell className="text-right text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                              event.stopPropagation()
                              void TestDeleteHandle(test.test_id)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* ────────────── Row Content ────────────── */}
                      {isOpen && (
                        <TableRow className="border-0">
                          <TableCell
                            colSpan={12}
                            className="bg-muted/30 rounded-lg transition-all pl-14"
                            onClick={() => TestDetailHandle(test)}
                          >
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-gray-500 text-xs">
                                    ชื่อ Test Case
                                  </TableHead>
                                  <TableHead className="text-gray-500 text-xs">
                                    สถานะการทดสอบ
                                  </TableHead>

                                  <TableHead className="text-gray-500 text-xs">
                                    ผลลัพธ์การทดสอบ
                                  </TableHead>
                                  <TableHead className="text-gray-500 text-xs">
                                    หมวดหมู่
                                  </TableHead>
                                  <TableHead className="text-gray-500 text-xs">
                                    ความสำคัญ
                                  </TableHead>
                                  <TableHead className="text-gray-500 text-xs">
                                    เวลาที่รันล่าสุด
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {test.testcases.map((tc: Testcase) => (
                                  <TableRow key={tc.testcase_id}>
                                    <TableCell className="font-medium w-[20rem]">
                                      {tc.testcase_name}
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium border ${
                                          tc.testcase_status === "completed"
                                            ? "bg-[#498D52]/10 text-[#498D52] border-[#498D52]/40"
                                            : tc.testcase_status === "running"
                                            ? "bg-[#9FA83F]/10 text-[#9FA83F] border-[#9FA83F]/40"
                                            : "bg-[#A84446]/10 text-[#A84446] border-[#A84446]/40"
                                        }`}
                                      >
                                        {tc.testcase_status === "completed" && (
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                        )}
                                        {tc.testcase_status === "running" && (
                                          <Clock className="h-3.5 w-3.5" />
                                        )}
                                        {tc.testcase_status !== "completed" &&
                                          tc.testcase_status !== "running" && (
                                            <Slash className="h-3.5 w-3.5" />
                                        )}
                                        <span className="capitalize">{tc.testcase_status}</span>
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {(() => {
                                        const raw = tc.testcase_result?.trim()
                                        const lower = raw?.toLowerCase() ?? ""
                                        const isPass = lower === "pass" || lower === "success"
                                        const isFail = lower === "fail"
                                        const isRunning = !raw || lower === "running"
                                        const label = isRunning ? "running" : raw!

                                        const badgeClass = isPass
                                          ? "bg-[#498D52]/10 text-[#498D52] border-[#498D52]/40"
                                          : isFail
                                            ? "bg-[#A84446]/10 text-[#A84446] border-[#A84446]/40"
                                            : isRunning
                                              ? "bg-muted text-muted-foreground border-border"
                                              : "bg-[#9FA83F]/10 text-[#9FA83F] border-[#9FA83F]/40"

                                        return (
                                          <span
                                            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium ${badgeClass}`}
                                          >
                                            {isPass && <CheckCircle2 className="h-3.5 w-3.5" />}
                                            {isFail && <CircleX className="h-3.5 w-3.5" />}
                                            {!isPass && !isFail && (
                                              <Clock className="h-3.5 w-3.5" />
                                            )}
                                            <span className="capitalize">{label}</span>
                                          </span>
                                        )
                                      })()}
                                    </TableCell>
                                    <TableCell>
                                      {(() => {
                                        const fromCategory = (tc.testcase_category ?? "").trim()
                                        const fromType = (tc.testcase_type ?? "").trim()
                                        const raw = fromCategory || fromType
                                        if (!raw) return "-"
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
                                    </TableCell>
                                    <TableCell>
                                      {tc.testcase_piority ? (
                                        (() => {
                                          const p = tc.testcase_piority?.toLowerCase()
                                          const cls =
                                            p === "high"
                                              ? "bg-[#A84446]/10 text-[#A84446] border border-[#A84446]/40"
                                              : p === "medium"
                                                ? "bg-[#9FA83F]/10 text-[#9FA83F] border border-[#9FA83F]/40"
                                                : "bg-[#498D52]/10 text-[#498D52] border border-[#498D52]/40"
                                          return (
                                            <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium ${cls}`}>
                                              {tc.testcase_piority}
                                            </span>
                                          )
                                        })()
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {tc.created_at
                                        ? new Date(tc.created_at).toLocaleString("th-TH")
                                        : "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



