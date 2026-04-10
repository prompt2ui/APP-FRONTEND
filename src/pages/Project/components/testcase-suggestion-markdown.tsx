"use client"

import { useMemo } from "react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/** Renders evaluator `testcase_suggestion` (GFM Markdown) in the test detail panel. */
export function TestcaseSuggestionMarkdown({ markdown }: { markdown: string }) {
  const components = useMemo((): Partial<Components> => {
    const linkClass =
      "font-medium text-sky-400 underline underline-offset-2 hover:opacity-90 break-words"
    return {
      h2: ({ children }) => (
        <h2 className="mt-3 mb-1.5 text-sm font-semibold text-foreground first:mt-0">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mt-2.5 mb-1 text-sm font-semibold text-foreground first:mt-0">
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className="mb-2 last:mb-0 text-sm leading-relaxed text-foreground/95 empty:hidden">
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="mb-2 list-disc space-y-1 pl-5 text-sm last:mb-0">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm last:mb-0">{children}</ol>
      ),
      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {children}
        </a>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
      ),
      code: ({ className, children }) => {
        const inline = !className
        if (inline) {
          return (
            <code className="rounded px-1 py-0.5 font-mono text-[0.82em] bg-zinc-800/90 text-zinc-100 ring-1 ring-zinc-600/50">
              {children}
            </code>
          )
        }
        return (
          <code className={className}>
            {children}
          </code>
        )
      },
      pre: ({ children }) => (
        <pre className="mb-2 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100 ring-1 ring-zinc-700/60 last:mb-0">
          {children}
        </pre>
      ),
      blockquote: ({ children }) => (
        <blockquote className="my-2 border-l-2 border-zinc-500 pl-3 text-sm italic text-muted-foreground">
          {children}
        </blockquote>
      ),
    }
  }, [])

  return (
    <div className="testcase-suggestion-md min-w-0 max-w-full break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
