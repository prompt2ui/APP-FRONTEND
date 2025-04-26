// component-preview-panel.tsx

export default function PreviewPanel() {
  return (
    <div className="flex h-[calc(100vh-3rem)] items-center justify-center bg-background p-4">
      <div className="rounded-lg border border-border p-8 text-center">
        <h2 className="text-xl font-semibold">Preview</h2>
        <p className="mt-2 text-muted-foreground">Your generated UI will appear here</p>
      </div>
    </div>
  )
}
