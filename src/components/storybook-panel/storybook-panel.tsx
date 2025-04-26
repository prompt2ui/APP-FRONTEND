// coding-panel.tsx
import { useEffect, useState } from "react"
import FileTreePanel from "./component-tree-panel-group"
import FileSnipDisplay from "./component-snip-panel-display"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "@/components/ui/resizable"


  // Storybook
  import { Sandpack } from '@codesandbox/sandpack-react';

// interface StoryBookPanelProps {
//   selectedFile: string | null
//   setSelectFile: (file: string) => void
// }

interface FileStructure {
  name: string
  path: string
  type: string
  children?: FileStructure[]
  content?: string
}

const fileStructure: FileStructure[] = [
  {
    name: "ProductCard",
    path: "src/components/ProductCard",
    type: "folder",
    children: [
      {
        name: "Documentation",
        path: "src/components/ProductCard/ProductCard.docs.mdx",
        type: "document",
        content: "document"
      },
      {
        name: "Default",
        path: "src/components/ProductCard/ProductCard.stories.tsx#Default",
        type: "story",
        content: "storyA"
      },
      {
        name: "Expanded",
        path: "src/components/ProductCard/ProductCard.stories.tsx#Expanded",
        type: "story",
        content: "storyB"
      },
      {
        name: "Added to cart",
        path: "src/components/ProductCard/ProductCard.stories.tsx#AddedToCart",
        type: "story",
        content: "storyC"
      },
    ],
  },
];

export default function StoryBookPanel() {
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
    <Sandpack
      template="react"
      files={{
        '/App.jsx': { code: 'export default () => <Button>click</Button>' },
      }}
      options={{ 
        layout: 'preview', 
        autorun: true, 
        initMode: 'lazy', 
        editorHeight: "100%"
      }}
    />
    // <ResizablePanelGroup direction="horizontal" className="flex h-[calc(100vh-3rem)] w-full bg-black">
    //   {/* Left */}
    //   <ResizablePanel
    //     defaultSize={20}    // เริ่มต้น 20%
    //     minSize={10}        // ย่อสุด 10%
    //     maxSize={40}        // ขยายสุด 40%
    //     className="overflow-auto"
    //   >
    //     <FileTreePanel
    //       files={fileStructure}
    //       selectedFile={selectedFile}
    //       openFolders={openFolders}
    //       toggleFolder={toggleFolder}
    //       setSelectFile={setSelectFile}
    //     />
    //   </ResizablePanel>
    //   <ResizableHandle withHandle />

    //   {/* Middle */}
    //   <ResizablePanel
    //     defaultSize={60}    // เริ่มต้น 60%
    //     minSize={40}        // กลางต้องใหญ่พอเห็น preview
    //     className="overflow-auto"
    //   >
    //   </ResizablePanel>
    //   <ResizableHandle withHandle />

    //   {/* Right */}
    //   <ResizablePanel
    //     defaultSize={20}
    //     minSize={10}
    //     maxSize={40}
    //     className="overflow-auto"
    //   >
    //     <FileSnipDisplay content={selectedFileContent} />
    //   </ResizablePanel>
    // </ResizablePanelGroup>
    

  )
}