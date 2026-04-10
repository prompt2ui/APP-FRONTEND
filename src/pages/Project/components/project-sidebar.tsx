"use client"

import * as React from "react"
import { Link, useParams } from "react-router-dom"
import {
  Key,
  LayoutDashboard,
  ListChecks,
  PlayCircle,
  SquareTerminal,
} from "lucide-react"

import { useStore } from "@/api/storage"
import { UserDetail } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

/** ใช้กับ `SidebarProvider` และ mobile sheet — โทนม่วง #7E60DD */
export const PROJECT_SIDEBAR_THEME_CLASS = "project-sidebar-theme"

const nav = {
  overview: [
    { title: "หน้าหลัก", path: "home", icon: SquareTerminal },
    { title: "ภาพรวมโปรเจกต์", path: "overview", icon: LayoutDashboard },
  ],
  testing: [
    { title: "สร้างการทดสอบ", path: "testing", icon: PlayCircle },
    { title: "การทดสอบทั้งหมด", path: "overview", icon: ListChecks },
  ],
  settings: [
    {
      title: "API KEY",
      url: "/project/settings/api-key",
      icon: Key,
    },
  ],
}

const sidebarUser = {
  name: UserDetail.user_name,
  email: UserDetail.user_email,
  avatar: "/porject_image.avif",
}

export function ProjectSidebar({
  className,
  ...rest
}: React.ComponentProps<typeof Sidebar>) {
  const { id: paramId } = useParams()
  const { currentProject } = useStore()
  const projectId =
    paramId ??
    (currentProject?.project_id != null ? String(currentProject.project_id) : undefined)

  const getUrl = (path: string) => {
    if (path === "home") return "/project"
    if (path === "testing")
      return projectId ? `/project/${projectId}/testing` : "#"
    if (path === "overview" && projectId) return `/project/${projectId}`
    return "#"
  }

  return (
    <Sidebar
      collapsible="icon"
      themeClassName={PROJECT_SIDEBAR_THEME_CLASS}
      {...rest}
      className={cn("border-sidebar-border", className)}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/project">
                <div className="flex size-8 aspect-square items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">แดชบอร์ดทดสอบ</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    โปรเจกต์ของคุณ
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarGroupLabel>ภาพรวม</SidebarGroupLabel>
            <SidebarMenu>
              {nav.overview.map((item) => (
                <SidebarMenuItem key={item.path + item.title}>
                  <SidebarMenuButton asChild className="h-8 flex items-center">
                    <Link to={getUrl(item.path)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>

          <SidebarGroupContent className="py-5">
            <Separator />
          </SidebarGroupContent>

          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarGroupLabel>การทดสอบ</SidebarGroupLabel>
            <SidebarMenu>
              {nav.testing.map((item) => (
                <SidebarMenuItem key={item.path + item.title}>
                  <SidebarMenuButton asChild className="h-8 flex items-center">
                    <Link to={getUrl(item.path)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>

          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarGroupLabel>การตั้งค่า</SidebarGroupLabel>
            <SidebarMenu>
              {nav.settings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-8 flex items-center">
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
