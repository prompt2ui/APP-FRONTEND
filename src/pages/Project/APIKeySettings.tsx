"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Loader2,
} from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/api/storage"
import { listUserProviders, upsertUserProvider } from "@/api/agent"
import type { ProviderTypeId } from "@/api/agent"
import {
  INTEGRATION_CONNECTORS,
  type IntegrationConnector,
} from "./integration-connectors"
import { UserDetail, cn } from "@/lib/utils"
import { toast } from "sonner"

/** Normalize to `owner/repo` from `owner/name` or a github.com URL (matches backend). */
function parseGithubRepoInput(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  try {
    if (s.toLowerCase().includes("github.com")) {
      const u = new URL(s.startsWith("http") ? s : `https://${s}`)
      const parts = u.pathname.split("/").filter(Boolean)
      if (parts.length >= 2) return `${parts[0]}/${parts[1].replace(/\.git$/i, "")}`
      return null
    }
    const slash = s.indexOf("/")
    if (slash <= 0) return null
    const owner = s.slice(0, slash).trim()
    const repo = s
      .slice(slash + 1)
      .split("/")[0]
      .replace(/\.git$/i, "")
      .trim()
    if (!owner || !repo) return null
    return `${owner}/${repo}`
  } catch {
    return null
  }
}

/** Parse Jira Cloud project board URL → hostname + project key (same idea as backend). */
function parseJiraProjectUrlInput(raw: string): { hostname: string; projectKey: string } | null {
  const s = raw.trim()
  if (!s) return null
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`)
    const m = u.pathname.match(/\/projects\/([^/]+)/i)
    if (!m) return null
    return { hostname: u.hostname, projectKey: m[1].toUpperCase() }
  } catch {
    return null
  }
}

type ConnectorId = ProviderTypeId

function ConnectorCatalog({
  connectors,
  onSelect,
  isActive,
}: {
  connectors: IntegrationConnector[]
  onSelect: (id: ConnectorId) => void
  isActive: (id: ConnectorId) => boolean
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 mx-auto max-w-6xl">
      {connectors.map((connector) => {
        const active = isActive(connector.id)
        return (
          <Card
            key={connector.id}
            className={cn(
              "group cursor-pointer overflow-hidden border bg-card transition-all hover:border-primary/40 py-0",
              active
                ? "border-emerald-500/50 ring-2 ring-emerald-500/25 shadow-sm shadow-emerald-500/10"
                : "border-border/60",
            )}
            onClick={() => onSelect(connector.id)}
          >
            <div
              className={cn(
                "relative flex h-44 items-center justify-center border-b bg-white",
                active ? "border-emerald-500/30" : "border-border/50",
              )}
            >
              {active && (
                <div
                  className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-700 shadow-sm dark:border-emerald-400/40 dark:bg-emerald-500 dark:text-emerald-400"
                  title="เชื่อมต่อแล้ว — มี API key บันทึกไว้"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white" aria-hidden />
                  <span className="text-xs font-semibold tracking-wide text-white">Active</span>
                </div>
              )}
              <div className="flex w-20 h-20 bg-white items-center justify-center rounded-2xl border border-muted-foreground/30 shadow-lg">
                <img
                  src={connector.logoUrl}
                  alt={connector.name}
                  className={`${connector.logoSizeClass ?? "size-8"} object-contain`}
                />
              </div>
            </div>
            <CardContent className="space-y-3 p-5 w-2xl">
              <CardTitle className="text-xl font-normal my-0">{connector.name}</CardTitle>
              <CardDescription className="text-foreground/50 text-xs leading-7 min-h-14">
                {connector.summary}
              </CardDescription>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ClickUpForm({
  listUrl,
  apiToken,
  setListUrl,
  setApiToken,
  hasSecret,
  savedListUrl,
  saving,
  onSave,
}: {
  listUrl: string
  apiToken: string
  setListUrl: (v: string) => void
  setApiToken: (v: string) => void
  hasSecret: boolean
  savedListUrl?: string
  saving: boolean
  onSave: () => void
}) {
  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyToken = async () => {
    if (!apiToken) return
    try {
      await navigator.clipboard.writeText(apiToken)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Card className="bg-card/60 border-border">
      <CardHeader>
        <CardTitle>ClickUp</CardTitle>
        <CardDescription>
          {hasSecret
            ? "API token ถูกบันทึกแล้ว — กรอกใหม่เฉพาะเมื่อต้องการเปลี่ยน"
            : "วาง List URL จาก ClickUp — backend จะดึง List ID ให้อัตโนมัติ"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3">
          <Label htmlFor="clickup-token" className="text-muted-foreground col-span-1">
            API Token
          </Label>
          <div className="flex items-center gap-2 col-span-2">
            <Input
              id="clickup-token"
              type={showToken ? "text" : "password"}
              placeholder={hasSecret ? "•••••••• (กรอกใหม่เพื่อเปลี่ยน)" : "pk_..."}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => setShowToken((prev) => !prev)}
              aria-label={showToken ? "Hide token" : "Show token"}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 shrink-0"
              onClick={handleCopyToken}
              disabled={!apiToken}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3">
          <Label htmlFor="clickup-list-url" className="text-muted-foreground col-span-1">
            List URL
          </Label>
          <Input
            className="col-span-2"
            id="clickup-list-url"
            placeholder="https://app.clickup.com/.../v/li/901816867059 หรือพิมพ์แค่ List ID"
            value={listUrl}
            onChange={(e) => setListUrl(e.target.value)}
          />
        </div>
      </CardContent>

      <CardFooter>
        <div className="w-full flex justify-end">
          <Button size="lg" className="gap-2 justify-end w-fit pr-9!" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>บันทึก</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function GithubForm({
  token,
  repo,
  setToken,
  setRepo,
  hasSecret,
  saving,
  onSave,
}: {
  token: string
  repo: string
  setToken: (v: string) => void
  setRepo: (v: string) => void
  hasSecret: boolean
  saving: boolean
  onSave: () => void
}) {
  const [showToken, setShowToken] = useState(false)
  const parsedRepo = useMemo(() => parseGithubRepoInput(repo), [repo])

  return (
    <Card className="bg-card/60 border-border">
      <CardHeader>
        <CardTitle>GitHub</CardTitle>
        <CardDescription>
          {hasSecret
            ? "Token ถูกบันทึกแล้ว — กรอกใหม่เฉพาะเมื่อต้องการเปลี่ยน"
            : "ระบุ Personal Access Token (PAT) และ Repository ปลายทาง"}
          {" · "}
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline inline-flex items-center gap-0.5"
          >
            สร้าง Token <ExternalLink className="h-3 w-3 inline" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 items-start">
          <Label htmlFor="github-token" className="text-muted-foreground col-span-1 mt-3">
            Personal Access Token
          </Label>
          <div className="col-span-2 space-y-1">
            <div className="flex items-center gap-2">
              <Input
                id="github-token"
                type={showToken ? "text" : "password"}
                placeholder={hasSecret ? "•••••••• (กรอกใหม่เพื่อเปลี่ยน)" : "ghp_..."}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowToken((v) => !v)} aria-label="Toggle token">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Classic: ต้องมี scope repo / public_repo · Fine-grained: ต้องมีสิทธิ์ Issues (Read & write)</p>
          </div>
        </div>

        <div className="grid grid-cols-3 items-start">
          <Label htmlFor="github-repo" className="text-muted-foreground col-span-1 mt-3">
            Repository
          </Label>
          <div className="col-span-2 space-y-1">
            <Input
              id="github-repo"
              placeholder="owner/repository หรือวาง URL ของ repository"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
            {parsedRepo ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                ตรวจพบ repo: <span className="font-mono">{parsedRepo}</span>
              </p>
            ) : repo.trim() ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">ยัง parse ไม่ได้ — ต้องเป็น owner/repo หรือ URL</p>
            ) : null}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="w-full flex justify-end">
          <Button size="lg" className="gap-2 w-fit pr-9!" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>บันทึก</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function JiraForm({
  email,
  token,
  projectUrl,
  setEmail,
  setToken,
  setProjectUrl,
  hasSecret,
  saving,
  onSave,
}: {
  email: string
  token: string
  projectUrl: string
  setEmail: (v: string) => void
  setToken: (v: string) => void
  setProjectUrl: (v: string) => void
  hasSecret: boolean
  saving: boolean
  onSave: () => void
}) {
  const [showToken, setShowToken] = useState(false)
  const parsed = useMemo(() => parseJiraProjectUrlInput(projectUrl), [projectUrl])

  return (
    <Card className="bg-card/60 border-border">
      <CardHeader>
        <CardTitle>Jira Cloud</CardTitle>
        <CardDescription>
          {hasSecret
            ? "API token ถูกบันทึกแล้ว — กรอกใหม่เฉพาะเมื่อต้องการเปลี่ยน"
            : "ระบุอีเมล, API token และ Project URL"}
          {" · "}
          <a
            href="https://id.atlassian.com/manage-profile/security/api-tokens"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline inline-flex items-center gap-0.5"
          >
            สร้าง Token <ExternalLink className="h-3 w-3 inline" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 items-center">
          <Label htmlFor="jira-email" className="text-muted-foreground col-span-1">
            Atlassian Email
          </Label>
          <Input
            id="jira-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com (อีเมลที่ล็อกอิน)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="col-span-2"
          />
        </div>

        <div className="grid grid-cols-3 items-center">
          <Label htmlFor="jira-token" className="text-muted-foreground col-span-1">
            Jira API Token
          </Label>
          <div className="flex items-center gap-2 col-span-2">
            <Input
              id="jira-token"
              type={showToken ? "text" : "password"}
              placeholder={hasSecret ? "•••••••• (กรอกใหม่เพื่อเปลี่ยน)" : "ATATT..."}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => setShowToken((v) => !v)}
              aria-label="Toggle token"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 items-start">
          <Label htmlFor="jira-project-url" className="text-muted-foreground col-span-1 mt-3">
            Project URL
          </Label>
          <div className="col-span-2 space-y-1">
            <Input
              id="jira-project-url"
              placeholder="https://site.atlassian.net/jira/software/projects/KEY/list"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
            />
            {parsed ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                ตรวจพบ: site <span className="font-mono">{parsed.hostname}</span> · project key{" "}
                <span className="font-mono">{parsed.projectKey}</span>
              </p>
            ) : projectUrl.trim() ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ยัง parse ไม่ได้ — ต้องมี url path แบบ <span className="font-mono">/projects/YOURKEY/</span>
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="w-full flex justify-end">
          <Button size="lg" className="gap-2 justify-end w-fit pr-9!" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>บันทึก</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function APIKeySettings() {
  const { currentProject } = useStore()
  const userId = currentProject?.user_id ?? UserDetail.user_id

  const [selectedConnectorId, setSelectedConnectorId] = useState<ConnectorId | null>(null)
  const [providerRows, setProviderRows] = useState<
    Array<{ provider_type: string; has_secret: boolean; provider_config: Record<string, unknown> }>
  >([])
  const [loadingList, setLoadingList] = useState(true)
  const [saving, setSaving] = useState(false)

  const [clickupToken, setClickupToken] = useState("")
  const [clickupListUrl, setClickupListUrl] = useState("")
  const [ghToken, setGhToken] = useState("")
  const [ghRepo, setGhRepo] = useState("")
  const [jiraEmail, setJiraEmail] = useState("")
  const [jiraToken, setJiraToken] = useState("")
  const [jiraProjectUrl, setJiraProjectUrl] = useState("")

  const selectedConnector = useMemo(
    () =>
      INTEGRATION_CONNECTORS.find((c) => c.id === selectedConnectorId) ?? null,
    [selectedConnectorId],
  )

  const refreshProviders = async () => {
    setLoadingList(true)
    try {
      const rows = await listUserProviders(userId)
      setProviderRows(rows)
    } catch (e) {
      console.error(e)
      toast.error("โหลดการตั้งค่า provider ไม่สำเร็จ")
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    void refreshProviders()
  }, [userId])

  const getRow = (ptype: ConnectorId) => providerRows.find((r) => r.provider_type === ptype)

  /** Saved API key in DB → show green “Active” on catalog cards. */
  const isProviderActive = (id: ConnectorId) => !!getRow(id)?.has_secret

  useEffect(() => {
    if (!selectedConnectorId) return
    const row = getRow(selectedConnectorId)
    const cfg = (row?.provider_config || {}) as Record<string, string>
    if (selectedConnectorId === "clickup") {
      setClickupListUrl((cfg.list_url || cfg.list_id || "") as string)
      setClickupToken("")
    }
    if (selectedConnectorId === "github") {
      setGhRepo(cfg.repo || "")
      setGhToken("")
    }
    if (selectedConnectorId === "jira") {
      setJiraEmail((cfg.email as string) || "")
      const savedProjectUrl =
        (typeof cfg.project_url === "string" && cfg.project_url) ||
        (cfg.site_hostname && cfg.project_key
          ? `https://${cfg.site_hostname}/jira/software/projects/${String(cfg.project_key)}/`
          : typeof cfg.site_url === "string" && cfg.project_key
            ? `${String(cfg.site_url).replace(/\/$/, "")}/jira/software/projects/${String(cfg.project_key)}/`
            : "")
      setJiraProjectUrl(savedProjectUrl)
      setJiraToken("")
    }
  }, [selectedConnectorId, providerRows])

  const saveClickup = async () => {
    if (!clickupListUrl.trim()) {
      toast.error("กรุณาวาง List URL หรือกรอก List ID")
      return
    }
    setSaving(true)
    try {
      await upsertUserProvider({
        user_id: userId,
        provider_type: "clickup",
        provider_api_key: clickupToken.trim() || null,
        provider_config: { list_url: clickupListUrl.trim() },
      })
      toast.success("บันทึก ClickUp แล้ว")
      await refreshProviders()
    } catch (e: unknown) {
      console.error(e)
      const ax = e as { response?: { data?: { detail?: unknown } } }
      const d = ax?.response?.data?.detail
      const msg =
        typeof d === "string" ? d : d != null ? JSON.stringify(d) : "บันทึกไม่สำเร็จ"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const saveGithub = async () => {
    if (!ghRepo.trim()) {
      toast.error("กรุณากรอก owner/repository หรือวาง URL ของ repo")
      return
    }
    if (!parseGithubRepoInput(ghRepo)) {
      toast.error("รูปแบบ repo ไม่ถูกต้อง — ใช้ owner/repository หรือ URL จาก github.com")
      return
    }
    const row = getRow("github")
    if (!ghToken.trim() && !row?.has_secret) {
      toast.error("กรุณากรอก Personal Access Token")
      return
    }
    setSaving(true)
    try {
      await upsertUserProvider({
        user_id: userId,
        provider_type: "github",
        provider_api_key: ghToken.trim() || null,
        provider_config: { repo: ghRepo.trim() },
      })
      toast.success("บันทึก GitHub แล้ว")
      await refreshProviders()
    } catch (e: unknown) {
      console.error(e)
      const ax = e as { response?: { data?: { detail?: unknown } } }
      const d = ax?.response?.data?.detail
      const msg =
        typeof d === "string" ? d : d != null ? JSON.stringify(d) : "บันทึกไม่สำเร็จ"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const saveJira = async () => {
    if (!jiraEmail.trim() || !jiraProjectUrl.trim()) {
      toast.error("กรุณากรอก Atlassian email และ Project URL")
      return
    }
    if (!parseJiraProjectUrlInput(jiraProjectUrl)) {
      toast.error("Project URL ไม่ถูกต้อง — วาง URL จากหน้าโปรเจกต์ Jira (ต้องมี /projects/KEY/ ใน path)")
      return
    }
    const row = getRow("jira")
    if (!jiraToken.trim() && !row?.has_secret) {
      toast.error("กรุณากรอก Jira API token")
      return
    }
    setSaving(true)
    try {
      await upsertUserProvider({
        user_id: userId,
        provider_type: "jira",
        provider_api_key: jiraToken.trim() || null,
        provider_config: {
          email: jiraEmail.trim(),
          project_url: jiraProjectUrl.trim(),
        },
      })
      toast.success("บันทึก Jira แล้ว")
      await refreshProviders()
    } catch (e) {
      console.error(e)
      toast.error("บันทึกไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  const renderConnectorForm = () => {
    if (!selectedConnector) return null
    if (selectedConnector.id === "clickup") {
      const row = getRow("clickup")
      const cfg = (row?.provider_config || {}) as Record<string, unknown>
      const savedListUrl =
        (typeof cfg.list_url === "string" && cfg.list_url) ||
        (typeof cfg.list_id === "string" && cfg.list_id) ||
        ""
      return (
        <ClickUpForm
          listUrl={clickupListUrl}
          apiToken={clickupToken}
          setListUrl={setClickupListUrl}
          setApiToken={setClickupToken}
          hasSecret={!!row?.has_secret}
          savedListUrl={savedListUrl}
          saving={saving}
          onSave={saveClickup}
        />
      )
    }
    if (selectedConnector.id === "github") {
      const row = getRow("github")
      return (
        <GithubForm
          token={ghToken}
          repo={ghRepo}
          setToken={setGhToken}
          setRepo={setGhRepo}
          hasSecret={!!row?.has_secret}
          saving={saving}
          onSave={saveGithub}
        />
      )
    }
    const row = getRow("jira")
    return (
      <JiraForm
        email={jiraEmail}
        token={jiraToken}
        projectUrl={jiraProjectUrl}
        setEmail={setJiraEmail}
        setToken={setJiraToken}
        setProjectUrl={setJiraProjectUrl}
        hasSecret={!!row?.has_secret}
        saving={saving}
        onSave={saveJira}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-8 pt-24 pb-10 space-y-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {selectedConnector ? (
          <Button variant="outline" className="gap-2" size="lg" onClick={() => setSelectedConnectorId(null)}>
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </Button>
        ) : (
          <div className="max-w-6xl w-full mx-auto justify-start">
            <h1 className="text-3xl font-bold">API Key Settings</h1>
            <p className="text-sm text-muted-foreground">
              เลือก Connector ที่ต้องการเชื่อมต่อก่อน
            </p>
            {loadingList && <p className="text-xs text-muted-foreground mt-1">กำลังโหลดสถานะการเชื่อมต่อ...</p>}
          </div>
        )}
      </div>

      {!selectedConnector ? (
        <ConnectorCatalog
          connectors={INTEGRATION_CONNECTORS}
          onSelect={setSelectedConnectorId}
          isActive={isProviderActive}
        />
      ) : (
        <div className="space-y-4">
          {(() => {
            const row = getRow(selectedConnector.id)
            const cfg = (row?.provider_config || {}) as Record<string, unknown>
            const hasConfig = Object.keys(cfg).length > 0
            const isSaved = !!row?.has_secret || hasConfig
            return (
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl">API key overview</h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "py-1 text-xs",
                    isSaved
                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-muted-foreground/30 text-muted-foreground",
                  )}
                >
                  {isSaved ? "Saved configuration" : "Not saved yet"}
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs border-muted-foreground/30 py-1">
                  <a
                    href={selectedConnector.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                  >
                    Integration docs <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Badge>
              </div>
            )
          })()}
          {renderConnectorForm()}
        </div>
      )}
    </motion.div>
  )
}
