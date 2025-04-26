// components/coding-panel/file-snip-panel-display.tsx
// "use client"

import { CopyIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

// coding-panel-hightlighter
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"


interface Props {
  content: string | undefined | null
  filename?: string
}

export default function FileSnipDisplay({ content, filename = "snippet.tsx"}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
    }
  }

  const handleDownload = () => {
    if (content) {
      const blob = new Blob([content], { type: "text/plain" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
    }
  }

  if (!content) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p>Select a file to view code</p>
      </div>
    )
  }

  return (
    <div id="file-tree-panel-right" className="flex h-full flex-col overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 font-medium text-gray-300">
          <h3 className="mb-2 font-medium text-xs text-gray-300 whitespace-nowrap">{filename}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            <CopyIcon className="mr-1 h-4 w-4" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={handleDownload}
          >
            <DownloadIcon className="mr-1 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* // Code block */}
      <div className="relative flex-1 w-full bg-background p-0 m-3">
        <SyntaxHighlighter
          className="!bg-transparent !w-full !text-[13px] !p-0 !m-0"
          language="tsx"
          style={vscDarkPlus}
          showLineNumbers
          wrapLines
          // wrapLongLines
          codeTagProps={{
            style: {
              whiteSpace: "pre-wrap", 
              // wordBreak: "break-word", 
            },
          }}
          lineNumberStyle={{
            color: "#6B7280",
            textAlign: "right",
            paddingLeft: "10px",
            paddingRight: "30px",
          }}
        >
          {content}
        </SyntaxHighlighter>

      </div>
      
      {/* <div className="relative flex-1 overflow-auto"> */}
          {/* <SyntaxHighlighter
            language="tsx"
            style={vscDarkPlus}
            showLineNumbers
            wrapLines
            wrapLongLines
            className="!bg-transparent w-full max-w-full overflow-x-auto text-[13px] whitespace-pre-wrap"
            lineNumberStyle={{
              color: "#6B7280",
              textAlign: "right",
              paddingLeft: "10px",
              paddingRight: "30px",
            }}
          >
            {content}
          </SyntaxHighlighter> */}
      {/* </div> */}
    </div>
  )
}


      {/* <div className="flex-1 w-full max-w-full overflow-auto px-0 py-0">
        <SyntaxHighlighter
          language="tsx"
          style={vscDarkPlus}
          showLineNumbers={true}
          wrapLines={true}
          // lineProps={(lineNumber: number) => ({
          //   style: {
          //     display: "block",
          //     padding: "0 10px",
          //     backgroundColor: lineNumber % 2 === 0 ? "#1e1e1e" : "#252526",
          //   },
          // })}
          wrapLongLines={true}
          customStyle={{ 
            fontSize: "13px",
            paddingTop: "0px",
            background: "transparent",
            width: "100%",
            maxWidth: "100%",      // 🔥 สำคัญ
            overflowX: "auto",     // 🔥 ป้องกันการ overflow แนวนอน
            whiteSpace: "pre-wrap" // 🔧 ช่วยให้บรรทัดไม่หลุด

        }}
          lineNumberStyle={{ 
            color: "#6B7280",
            textAlign: "right",
            justifyItems: "end",
            paddingLeft: "10px",
            paddingRight: "30px" 
        
        }}
        >
          {content}
        </SyntaxHighlighter>
      </div> */}