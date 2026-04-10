import { Link, Outlet, useLocation, useParams } from "react-router-dom"
import {
  ProjectSidebar,
  PROJECT_SIDEBAR_THEME_CLASS,
} from "@/pages/Project/components/project-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useStore } from "@/api/storage"

function ProjectHeaderBreadcrumbs() {
  const { pathname } = useLocation()
  const params = useParams<{
    id?: string
    currentTestId?: string
  }>()
  const { currentProject } = useStore()

  const projectIdParam = params.id
  const pid = projectIdParam ? Number(projectIdParam) : NaN
  const projectAligned =
    Number.isFinite(pid) &&
    currentProject != null &&
    currentProject.project_id === pid
  const projectLabel = projectAligned
    ? currentProject.project_name
    : projectIdParam
      ? `โปรเจกต์ #${projectIdParam}`
      : null

  const testIdRaw = params.currentTestId
  const testIdNum = testIdRaw ? Number(testIdRaw) : NaN
  const currentTest =
    projectAligned && Number.isFinite(testIdNum)
      ? currentProject.tests?.find((t) => t.test_id === testIdNum)
      : undefined
  const testPageLabel =
    currentTest?.test_name?.trim() || "รายละเอียดการทดสอบ"

  if (pathname.startsWith("/project/settings/api-key")) {
    return (
      <Breadcrumb className="min-w-0 text-sidebar-foreground/85">
        <BreadcrumbList className="text-sidebar-foreground/80 [&_a]:hover:text-sidebar-foreground flex-nowrap">
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink asChild>
              <Link to="/project">โปรเจกต์ของฉัน</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:block text-sidebar-foreground/50" />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-medium text-sidebar-foreground">
              API KEY
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  if (!projectIdParam) {
    return (
      <Breadcrumb className="min-w-0 text-sidebar-foreground/85">
        <BreadcrumbList className="text-sidebar-foreground/80 [&_a]:hover:text-sidebar-foreground">
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-sidebar-foreground">
              โปรเจกต์ของฉัน
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const projectBase = `/project/${projectIdParam}`
  const onTestingRoute = pathname.includes("/testing")
  const onTestDetail =
    onTestingRoute &&
    Boolean(params.currentTestId) &&
    pathname !== `${projectBase}/testing`

  return (
    <Breadcrumb className="min-w-0 text-sidebar-foreground/20">
      <BreadcrumbList className="text-sidebar-foreground/80 [&_a]:hover:text-sidebar-foreground flex-nowrap gap-1.5 sm:gap-2.5">
        <BreadcrumbItem className="hidden md:inline-flex shrink-0">
          <BreadcrumbLink asChild>
            <Link to="/project">โปรเจกต์ของฉัน</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block text-sidebar-foreground/50 shrink-0" />

        <BreadcrumbItem className="min-w-0 max-w-[40vw] sm:max-w-[220px] md:max-w-[280px]">
          {onTestingRoute ? (
            <BreadcrumbLink asChild className="block truncate">
              <Link to={projectBase}>{projectLabel}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="truncate font-medium text-sidebar-foreground">
              รายการทดสอบ {projectLabel}
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {onTestingRoute && (
          <>
            <BreadcrumbSeparator className="text-sidebar-foreground/50 shrink-0" />
            <BreadcrumbItem className="min-w-0 max-w-[36vw] sm:max-w-[200px]">
              {onTestDetail ? (
                <BreadcrumbLink asChild className="block truncate">
                  <Link to={`${projectBase}/testing`}>สร้างการทดสอบ</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate font-medium text-sidebar-foreground">
                  สร้างการทดสอบ
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {onTestDetail && (
          <>
            <BreadcrumbSeparator className="text-sidebar-foreground/50 shrink-0" />
            <BreadcrumbItem className="min-w-0 max-w-[42vw] sm:max-w-[240px]">
              <BreadcrumbPage className="truncate font-medium text-sidebar-foreground">
                {testPageLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default function ProjectLayout() {
  return (
    <SidebarProvider className={PROJECT_SIDEBAR_THEME_CLASS}>
      <ProjectSidebar />
      <SidebarInset className="min-h-0">
        <header className="bg-muted text-sidebar-foreground flex h-16 shrink-0 items-center gap-2 border-b border-muted-foreground/30 sticky top-0 z-30 px-2 transition-[width,height] ease-linear md:px-4">
          <SidebarTrigger className="-ml-0.5 cursor-pointer md:-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 h-4 bg-muted-foreground/30 md:mr-2"
          />
          <div className="min-w-0 flex-1 pr-2">
            <ProjectHeaderBreadcrumbs />
          </div>
        </header>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden py-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
