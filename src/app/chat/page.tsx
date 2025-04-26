"use client"

import { useRef, useEffect, useState } from "react"
import { Code2Icon, EyeIcon, ChevronRight } from "lucide-react"
import { ChatPanel } from "@/components/chat-panell/chat-panel"
import DisplayPanel from "@/components/display-panel/display-panel"
import { ThemeProvider } from "@/components/theme-provider"
import { ChatSidebarNav } from "@/components/chat-panell/chat-sidebar-nav"

import PlaygroundSwitch from "@/components/playground-panel/playground-switch"
import StoryBookPanel from "@/components/storybook-panel/storybook-panel"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { PlaygroundMode } from "@/components/playground-panel/types"



export default function Home() {
  const [mode, setMode] = useState<PlaygroundMode>("storybooks")

  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)


  const [isChatExpanded, setIsChatExpanded] = useState(true)
  const [isResizingWithMouse, setIsResizingWithMouse] = useState(false)
  const chatPanelRef = useRef<any>(null)


  const toggleChatPanel = () => {
    if (!chatPanelRef.current) return
  
    const currentChatPanelSize = chatPanelRef.current.getSize()
  
    if (currentChatPanelSize > 30) {
      chatPanelRef.current.resize(20)      
      setIsChatExpanded(false)
    } else {
      chatPanelRef.current.resize(85)
      setTimeout(() => {
        chatPanelRef.current?.resize(99)
      }, 100)
      setTimeout(() => {
        chatPanelRef.current?.resize(100)
      }, 100)
      setIsChatExpanded(true)
    }
  }
  

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <main className="flex h-screen w-full overflow-hidden bg-background">
        <ChatSidebarNav isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <ResizablePanelGroup 
          direction="horizontal" 
          className="flex h-[calc(100vh-3rem)] w-full">
        
          <ResizablePanel
              ref={chatPanelRef}
              defaultSize={100}
              className={`
                z-15
                ${isResizingWithMouse
                  ? "duration-0"
                  : "transition-all duration-300"}
              `}
            >
              <ChatPanel isChatExpanded={isChatExpanded} onToggleExpand={toggleChatPanel} />
          </ResizablePanel>


          <ResizableHandle withHandle onDragging={(isDragging) => 
            setIsResizingWithMouse(isDragging)}
          />


          {/* {!isChatExpanded && ( */}
          <ResizablePanel defaultSize={0} className="flex-1 border-l border-border bg-background z-10">
            <div className="flex h-12 items-center border-b border-border px-5 gap-1">
              <PlaygroundSwitch
                checked={mode === "overview"}
                onCheckedChange={(checked) =>
                setMode(checked ? "overview" : "storybooks")
                }
                mode={mode}
              />
              {/* <Breadcrumb>
                <BreadcrumbList className="flex items-center space-x-2">
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => {}}>
                      Projects
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <BreadcrumbPage className="cursor-pointer">
                          {activePage === "storybooks" ? "Storybooks" : "Overview"}
                        </BreadcrumbPage>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {options.map((opt) => (
                          <DropdownMenuItem
                            key={opt}
                            onClick={() => setActivePage(opt)}
                          >
                            {opt === "storybooks" ? "Storybooks" : "Overview"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb> */}
              {mode === "overview" && (
                <>
                  <ChevronRight className="mx-3 w-4 h-4 text-primary/40"/>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`
                      flex w-24 justify-center items-center px-3 py-1.5 rounded-lg text-xs transition 
                      ${activeTab === "preview"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted-foreground/6"}
                    `}
                  >
                    <span>Preview</span>
                    <EyeIcon className="ml-2 h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("code")}
                    className={`
                      flex w-24 justify-center items-center px-3 py-1.5 rounded-lg text-xs transition 
                      ${activeTab === "code"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted-foreground/6"}
                    `}
                  >
                    <span>Code</span>
                    <Code2Icon className="ml-2 h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            {mode === "overview" && (
              <DisplayPanel activeTab={activeTab} />
            )}
            {mode === "storybooks" && (
              <StoryBookPanel/>
            )}

            
          </ResizablePanel>
          {/* )} */}
        </ResizablePanelGroup>
      </main>
    </ThemeProvider>
  )
}
