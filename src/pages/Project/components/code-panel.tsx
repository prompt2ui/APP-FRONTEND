"use client"

import { useEffect, useState } from "react"
import { CopyIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
// monokaiSublime

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"




interface CodingPanelProps {
  content: string | undefined | null
  filename?: string
}
export default function CodingPanel({ content, filename = "snippet.tsx" }: CodingPanelProps) {
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
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center text-muted-foreground">
        <p>No code to display</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] w-full flex-col overflow-hidden border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs text-muted-foreground bg-secondary">
        <div className="flex items-center gap-1 font-medium text-gray-300">
          {/* <h3 className="font-medium text-xs text-gray-300 whitespace-nowrap">
            <span>test </span>{filename}
          </h3> */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                    <span>test </span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="text-foreground">
                    {filename}
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
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

      {/* Code */}
      <div className="relative flex-1 w-full bg-secondary overflow-y-auto p-3">
        <SyntaxHighlighter
            className="!bg-secondary !w-full !text-[13px] !p-0 !m-0 !px-3"
            language="javascript"
            style={coldarkDark}
            showLineNumbers
            wrapLines
            codeTagProps={{
                style: { whiteSpace: "pre-wrap" },
            }}
            lineNumberStyle={{
                color: "414851",
                // background: "#101010",
                textAlign: "right",
                paddingLeft: "10px",
                paddingRight: "30px",
            }}
            lineNumberContainerStyle={{
                color: "#414851",
            }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
