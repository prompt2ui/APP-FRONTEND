// coding-panel.tsx
import { useEffect, useState } from "react"
import FileTreePanel from "./file-tree-panel-group"
import FileSnipDisplay from "./file-snip-panel-display"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "@/components/ui/resizable"


// interface CodingPanelProps {
//   selectedFile: string | null
//   onSelectFile: (file: string) => void
// }

interface FileStructure {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileStructure[]
  content?: string
}



const fileStructure: FileStructure[] = [
  {
    name: "app",
    path: "app",
    type: "folder",
    children: [
      {
        name: "page.tsx",
        path: "app/page.tsx",
        type: "file",
        content: `"use client"

import { ChatMessage } from "./chat-message"
import { ChatSuggestions } from "./chat-suggestions"
import type { Message } from "../types"

interface ChatMessagesProps {
  messages: Message[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.length === 0 ? (
        <ChatSuggestions />
      ) : (
        messages.map((message) => <ChatMessage key={message.id} message={message} />)
      )}
    </div>
  )
}

`,
      },
      {
        name: "layout.tsx",
        path: "app/layout.tsx",
        type: "file",
        content: `// More code here...`,
      },
      {
        name: "components",
        path: "app/components",
        type: "folder",
        children: [
          {
            name: "chat-panel.tsx",
            path: "app/components/chat-panel.tsx",
            type: "file",
            content: `// More code here...`,
          },
          {
            name: "coding-panel.tsx",
            path: "app/components/coding-panel.tsx",
            type: "file",
            content: `// More code here...`,
          },
        ],
      },
    ],
  },
  {
    name: "components",
    path: "components",
    type: "folder",
    children: [
      {
        name: "chat-panel.tsx",
        path: "components/chat-panel.tsx",
        type: "file",
        content: `// More code here...`,
      },
      {
        name: "coding-panel.tsx",
        path: "components/coding-panel.tsx",
        type: "file",
        content: `// More code here...`,
      },
    ],
  },
]

export default function CodingPanel(){
  const [selectedFile, setSelectFile] = useState<string | null>(null)
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (path: string) => {
    setOpenFolders(prev => {
      const updated = new Set(prev)
      updated.has(path) ? updated.delete(path) : updated.add(path)
      return updated
    })
  }

  const findFileContent = (files: FileStructure[], path: string): string | undefined => {
    for (const file of files) {
      if (file.path === path) return file.content
      if (file.children) {
        const content = findFileContent(file.children, path)
        if (content) return content
      }
    }
    return undefined
  }

  const selectedFileContent = selectedFile ? findFileContent(fileStructure, selectedFile) : null

  useEffect(() => {
    if (!selectedFile && fileStructure[0]?.children?.[0]) {
      setSelectFile(fileStructure[0].children[0].path)
    }
  }, [selectedFile])

  return (
    // <div className="flex h-[calc(100vh-3rem)] w-full">
      <ResizablePanelGroup direction="horizontal" className="flex h-[calc(100vh-3rem)] w-full">
          <ResizablePanel className="min-w-20">
              <FileTreePanel
              files={fileStructure}
              selectedFile={selectedFile}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              setSelectFile={setSelectFile}
              />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80} className="min-w-0">
              <FileSnipDisplay content={selectedFileContent} />
          </ResizablePanel>
      </ResizablePanelGroup>
    // </div>
    

  )
}


// // app-frontend/src/components/coding-panel.tsx
// import { useState, useEffect } from "react"
// import { FolderIcon, FileIcon, ChevronRight } from "lucide-react"

// interface CodingPanelProps {
//   activeTab: "preview" | "code"
//   selectedFile: string | null
//   onSelectFile: (file: string) => void
// }

// interface FileStructure {
//   name: string
//   path: string
//   type: "file" | "folder"
//   children?: FileStructure[]
//   content?: string
// }

// export default function CodingPanel({ activeTab, selectedFile, onSelectFile }: CodingPanelProps) {
//   const fileStructure: FileStructure[] = [
//     {
//       name: "app",
//       path: "app",
//       type: "folder",
//       children: [
//         {
//           name: "page.tsx",
//           path: "app/page.tsx",
//           type: "file",
//           content: `// More code here...`,
//         },
//         {
//           name: "layout.tsx",
//           path: "app/layout.tsx",
//           type: "file",
//           content: `// More code here...`,
//         },
//         {
//           name: "components",
//           path: "app/components",
//           type: "folder",
//           children: [
//             {
//               name: "chat-panel.tsx",
//               path: "app/components/chat-panel.tsx",
//               type: "file",
//               content: `// More code here...`,
//             },
//             {
//               name: "coding-panel.tsx",
//               path: "app/components/coding-panel.tsx",
//               type: "file",
//               content: `// More code here...`,
//             },
//           ],
//         },
//       ],
//     },
//     {
//       name: "components",
//       path: "components",
//       type: "folder",
//       children: [
//         {
//           name: "chat-panel.tsx",
//           path: "components/chat-panel.tsx",
//           type: "file",
//           content: `// More code here...`,
//         },
//         {
//           name: "coding-panel.tsx",
//           path: "components/coding-panel.tsx",
//           type: "file",
//           content: `// More code here...`,
//         },
//       ],
//     },
//   ]

//   const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())

//   const toggleFolder = (path: string) => {
//     setOpenFolders((prev) => {
//       const updated = new Set(prev)
//       updated.has(path) ? updated.delete(path) : updated.add(path)
//       return updated
//     })
//   }

//   const findFileContent = (files: FileStructure[], path: string): string | undefined => {
//     for (const file of files) {
//       if (file.path === path) return file.content
//       if (file.children) {
//         const content = findFileContent(file.children, path)
//         if (content) return content
//       }
//     }
//     return undefined
//   }

//   const selectedFileContent = selectedFile ? findFileContent(fileStructure, selectedFile) : null

//   useEffect(() => {
//     if (!selectedFile && fileStructure[0]?.children?.[0]) {
//       onSelectFile(fileStructure[0].children[0].path)
//     }
//   }, [selectedFile, fileStructure, onSelectFile])

//   const renderFileTree = (files: FileStructure[], level = 0) => {
//     return (
//       <ul className={`${level > 0 ? "ml-3 border-l border-border pl-2" : ""} flex flex-col gap-1`}>
//         {files.map((file) => {
//           const isOpen = openFolders.has(file.path)
//           const isFolder = file.type === "folder"

//           return (
//             <li key={file.path}>
//               <button
//                 onClick={() => isFolder ? toggleFolder(file.path) : onSelectFile(file.path)}
//                 className={`group flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm transition-all ${
//                   selectedFile === file.path ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-gray-200"
//                 }`}
//               >
//                 {isFolder ? (
//                   <ChevronRight
//                     className={`h-4 w-4 transition-transform text-gray-400 group-hover:text-white ${
//                       isOpen ? "rotate-90" : ""
//                     }`}
//                   />
//                 ) : (
//                   <FileIcon className="h-4 w-4 text-blue-400" />
//                 )}
//                 <span className="truncate">{file.name}</span>
//               </button>

//               {file.children && isOpen && renderFileTree(file.children, level + 1)}
//             </li>
//           )
//         })}
//       </ul>
//     )
//   }

//   if (activeTab === "preview") {
//     return (
//       <div className="flex h-[calc(100vh-3rem)] items-center justify-center bg-background p-4">
//         <div className="rounded-lg border border-border p-8 text-center">
//           <h2 className="text-xl font-semibold">Preview</h2>
//           <p className="mt-2 text-muted-foreground">Your generated UI will appear here</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="flex h-[calc(100vh-3rem)] bg-background">
//       <div id="file-tree-panel-left" className="w-64 overflow-y-auto border-r border-border p-3">
//         <h3 className="mb-2 font-medium text-sm text-gray-300">File Explorer</h3>
//         {renderFileTree(fileStructure)}
//       </div>
      
//       <div id="file-tree-panel-right" className="flex-1 overflow-auto p-4">
//         {selectedFileContent ? (
//           <pre className="rounded-lg bg-muted p-4 text-sm text-white">
//             <code>{selectedFileContent}</code>
//           </pre>
//         ) : (
//           <div className="flex h-full items-center justify-center text-muted-foreground">
//             <p>Select a file to view code</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

