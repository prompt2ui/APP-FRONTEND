
export interface MessageFileMeta {
    id: string
    file: File
    preview: string
  }
  
  
export interface MessagesModel {
    id: string
    project_id: string
    content: string
    sender: "user" | "assistant"
    attachments?: string[]
  }
  
  