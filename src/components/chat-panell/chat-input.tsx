'use client'
import { useState, useRef, useCallback } from 'react'
import { PaperclipIcon, XIcon, SendIcon } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@radix-ui/react-dialog'


import { MessagesModel, MessageFileMeta } from '@/types/message'



interface ChatInputProps {
  onSendMessage: (text: string, metas: MessageFileMeta[]) => Promise<void>
}

export function ChatInput({ onSendMessage }: ChatInputProps) {

  const [content, setContent] = useState('')
  const [metas, setMetas] = useState<MessageFileMeta[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((fileList: FileList) => {
    const maxCount = 3
    const slots = maxCount - metas.length
    const incoming = Array.from(fileList).slice(0, slots)

    const newMetas = incoming.map(f => ({
      id: uuid(),
      file: f,
      preview: URL.createObjectURL(f),
    }))

    setMetas(prev => [...prev, ...newMetas])
    fileInputRef.current!.value = ''
  }, [metas])

  const onRemove = (id: string) => {
    setMetas(prev => {
      const toDelete = prev.find(m => m.id === id)!
      URL.revokeObjectURL(toDelete.preview)
      return prev.filter(m => m.id !== id)
    })
  }

  const onPick = () => fileInputRef.current?.click()
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const handleSend = () => {
    onSendMessage(content, metas)
    setContent('')
    setMetas([])
  }



  return (
    <div onDrop={onDrop} onDragOver={e=>e.preventDefault()} className="border-t p-4">
      <div className="flex gap-2 mb-2">
        {metas.map(meta => (
          <div key={meta.id} className="relative">

            <Dialog>
              <DialogTrigger asChild>
                <img src={meta.preview} className="w-16 h-16 object-cover rounded-2xl cursor-pointer" />
              </DialogTrigger>

              <DialogPortal>
                {/* Overlay ครอบเต็มจอ + z-index สูง */}
                <DialogOverlay className="fixed inset-0 bg-black/75 z-50" />

                {/* Content ก็ครอบเต็มจอ แต่อยู่บน overlay */}
                <DialogContent className="fixed inset-0 z-60 flex items-center justify-center p-0 bg-transparent">
                  <DialogTitle className="sr-only">Image Preview</DialogTitle>
                  <img
                    src={meta.preview}
                    alt="Preview"
                    className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                  />
                  <DialogClose asChild>
                    <button className="absolute top-4 right-4 p-2 bg-secondary rounded-full">
                      <XIcon className="h-5 w-5 text-white" />
                    </button>
                  </DialogClose>
                </DialogContent>
              </DialogPortal>
            </Dialog>


            
            <button onClick={() => onRemove(meta.id)}
              className="absolute -top-2 -right-2 bg-primary text-black rounded-full p-0.5 border-3 border-black cursor-pointer"
              >
                <XIcon strokeWidth={4} size={10}/>
            </button>
          </div>
        ))}
      </div>







      <div className="flex items-center gap-2">
        <input
          type="file" accept="image/png,image/jpeg,image/webp"
          multiple className="hidden" ref={fileInputRef}
          onChange={e=>e.target.files&&handleFiles(e.target.files)}
        />
        <Button variant="ghost" size="icon" onClick={onPick}>
          <PaperclipIcon className="h-4 w-4"/>
        </Button>
        <Input
          value={content} onChange={e=>setContent(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1"
          onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),handleSend())}
        />
        <Button onClick={handleSend} disabled={!content && !metas.length} size="icon">
          <SendIcon className="h-4 w-4"/>
        </Button>
      </div>
    </div>
  )
}
