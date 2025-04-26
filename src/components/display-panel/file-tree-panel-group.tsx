// file-tree-panel-group.tsx
import { ChevronRight, FileIcon } from "lucide-react"

interface FileStructure {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileStructure[]
}

interface Props {
  files: FileStructure[]
  selectedFile: string | null
  openFolders: Set<string>
  toggleFolder: (path: string) => void
  setSelectFile: (file: string) => void
}

export default function FileTreePanel({ files, selectedFile, openFolders, toggleFolder, setSelectFile }: Props) {
  const renderTree = (nodes: FileStructure[], level = 0) => (
    <ul className={`${level > 0 ? "ml-3 border-l border-border pl-2" : ""} flex flex-col gap-1`}>
      {nodes.map((file) => {
        const isOpen = openFolders.has(file.path)
        const isFolder = file.type === "folder"
        return (
          <li key={file.path}>
            <button
              onClick={() => isFolder ? toggleFolder(file.path) : setSelectFile(file.path)}
              className={`group flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs transition-all ${
                selectedFile === file.path ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-gray-200"
              }`}
            >
              {isFolder ? (
                <ChevronRight className={`h-3 w-3 transition-transform text-gray-400 group-hover:text-white ${isOpen ? "rotate-90" : ""}`} />
              ) : (
                <FileIcon className="h-3 w-3 text-blue-400" />
              )}
              <span className="truncate">{file.name}</span>
            </button>
            {file.children && isOpen && renderTree(file.children, level + 1)}
          </li>
        )
      })}
    </ul>
  )

  return (
    <div id="file-tree-panel-left" className="min-w-64 max-w-64 overflow-y-auto p-3 h-full">
      <h3 className="mb-2 font-medium text-xs text-gray-300">File Explorer</h3>
      {renderTree(files)}
    </div>
  )
}
