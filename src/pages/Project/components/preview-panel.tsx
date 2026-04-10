"use client"

import { useEffect, useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import {
  Card
} from "@/components/ui/card"
import { se } from "date-fns/locale"


interface PreviewPanelProps {
  content: string | undefined | null
}

export default function PreviewPanel({ content }: PreviewPanelProps) {
    const BASE_MINIO_URL = "http://localhost:9000"
    // console.log(test_video)
    const [test_video, setTest_video] = useState<string>("")

    useEffect(() => {
        const test_video = `${BASE_MINIO_URL}/app-storage/testing/${content}.webm`
        setTest_video(test_video)
    }, [content])
return (
    <ResizablePanelGroup
      direction="vertical"
      className="flex relative w-full bg-background"
    >
      <ResizablePanel 
      defaultSize={95} 
      maxSize={95}
      className="flex w-full relative">
        <video
            autoPlay
            loop
            muted
            playsInline
            controls
            className="min-h-full min-w-full rounded-lg shadow-lg"
            >
            <source src={test_video}/>
            Your browser does not support the video tag.
            </video>

      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel 
      maxSize={80}
      className="min-w-0 flex-1">
        <Card className="h-full w-full">
        <div className="flex items-center justify-center h-full text-muted-foreground">
            auto area
        </div>
        </Card>
    </ResizablePanel>
    </ResizablePanelGroup>
)
}

// public/video.mp4