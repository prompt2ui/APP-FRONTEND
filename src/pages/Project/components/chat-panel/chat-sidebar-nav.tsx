"use client"

import type React from "react"
import { BookOpenIcon, FolderIcon, HomeIcon, MenuIcon, PanelLeftIcon, PlusIcon, UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatSidebarNavProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function ChatSidebarNav({ isCollapsed, onToggle }: ChatSidebarNavProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col h-full border-r border-border transition-all duration-300",
        isCollapsed ? "w-[50px] min-w-[50px]" : "w-[210px] min-w-[210px]",
      )}
    >
      <div className="flex items-center p-2 relative">
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <a href="/">
              <HomeIcon className="size-5" />
            </a>
          </Button>
        </div>
        <div className="flex-1" />
        <div
          className={cn(
            "absolute z-10 transition-all duration-300",
            isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100 right-2",
          )}
        >
          <Button variant="ghost" size="icon" className="size-8" onClick={onToggle}>
            <PanelLeftIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid w-full min-w-0 p-2">
        <div className="flex w-full min-w-0 flex-col gap-2">
          <NavItem variant="outline" icon={<PlusIcon className="size-4" />} label="New Chat" isCollapsed={isCollapsed} />
          <NavItem variant="ghost" icon={<UsersIcon className="size-4" />} label="Community" isCollapsed={isCollapsed} />
          <NavItem variant="ghost" icon={<BookOpenIcon className="size-4" />} label="Library" isCollapsed={isCollapsed} />
          <NavItem variant="ghost" icon={<FolderIcon className="size-4" />} label="Projects" isCollapsed={isCollapsed} />
        </div>
      </div>

      <div className="h-[1px] mx-2 border-b border-dashed my-2" />

      <div className="flex-1 overflow-auto">
        {!isCollapsed && (
          <div className="p-2">
            <div className="h-9 px-2 text-sm font-normal text-gray-500">Recent Chats</div>
            <div className="flex flex-col gap-1">
              <RecentChatItem label="Chat 1" isCollapsed={isCollapsed} />
              <RecentChatItem label="Chat 2" isCollapsed={isCollapsed} />
              <RecentChatItem label="Chat 3" isCollapsed={isCollapsed} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto p-1">
        {isCollapsed ? (
          <Button variant="ghost" size="icon" className="size-10" onClick={onToggle}>
            <MenuIcon className="size-4" />
          </Button>
        ) : (
          <Button variant="ghost" className="h-10 w-full justify-between p-[3px]">
            <div className="flex items-center gap-3">
              <span className="flex shrink-0 items-center justify-center size-8 rounded-lg bg-gray-100">U</span>
              <div className="flex flex-col items-start">
                <div className="text-sm font-medium">Username</div>
                <span className="text-xs text-gray-500">Free</span>
              </div>
            </div>
          </Button>
        )}
      </div>
    </aside>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  variant: "ghost" | "outline"
  isCollapsed: boolean
}

function NavItem({ variant, icon, label, isCollapsed }: NavItemProps) {
  return (
    <Button
      variant={variant}
      className={cn("justify-start gap-2 h-8 relative overflow-hidden", isCollapsed && "w-8 px-2")}
    >
      <span
        className={cn(
          "absolute inset-2 flex w-fit items-center justify-center gap-2 whitespace-nowrap",
          isCollapsed && "left-2",
        )}
      >
        {icon}
        {!isCollapsed && <span>{label}</span>}
      </span>
    </Button>
  )
}

interface RecentChatItemProps {
  label: string
  isCollapsed: boolean
}

function RecentChatItem({ label, isCollapsed }: RecentChatItemProps) {
  return (
    <Button variant="ghost" className={cn("justify-start h-8 relative overflow-hidden", isCollapsed && "w-8 px-2")}>
      <span
        className={cn(
          "absolute inset-2 flex w-fit items-center justify-center gap-2 whitespace-nowrap",
          isCollapsed && "left-2",
        )}
      >
        <span className="truncate">{label}</span>
      </span>
    </Button>
  )
}
