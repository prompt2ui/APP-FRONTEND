"use client"

import { useMemo } from "react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Bot, User } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

import type { MessagesModel } from "@/api/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: MessagesModel
}

export function AssistantChatAvatar({ className }: { className?: string }) {
  return (
    <Avatar className={cn("size-8 shrink-0", className)} aria-label="Assistant">
      <AvatarFallback className="bg-primary/15 text-primary">
        <Bot className="size-4" aria-hidden />
      </AvatarFallback>
    </Avatar>
  )
}

function UserChatAvatar({ className }: { className?: string }) {
  return (
    <Avatar className={cn("size-8 shrink-0", className)} aria-label="You">
      <AvatarFallback className="bg-primary text-primary-foreground">
        <User className="size-4" aria-hidden />
      </AvatarFallback>
    </Avatar>
  )
}

function ChatMarkdownBody({
  content,
  variant,
}: {
  content: string
  variant: "user" | "assistant"
}) {
  const isUser = variant === "user"

  const components = useMemo((): Partial<Components> => {
    const linkClass = isUser
      ? "font-medium text-primary-foreground underline underline-offset-2 hover:opacity-90"
      : "font-medium text-foreground underline underline-offset-2 hover:opacity-90"

    const inlineCodeClass = isUser
      ? "rounded px-1 py-0.5 font-mono text-[0.85em] bg-primary-foreground/20 text-primary-foreground"
      : "rounded px-1 py-0.5 font-mono text-[0.85em] bg-background/70 text-foreground ring-1 ring-border/60"

    return {
      h2: ({ children }) => (
        <h2
          className={`mt-3 mb-1.5 text-base font-semibold first:mt-0 ${
            isUser ? "" : "text-foreground"
          }`}
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3
          className={`mt-2.5 mb-1 text-sm font-semibold first:mt-0 ${
            isUser ? "" : "text-foreground"
          }`}
        >
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4
          className={`mt-2 mb-1 text-sm font-medium first:mt-0 ${
            isUser ? "" : "text-foreground"
          }`}
        >
          {children}
        </h4>
      ),
      p: ({ children }) => (
        <p className="mb-2 last:mb-0 leading-relaxed empty:hidden">{children}</p>
      ),
      ul: ({ children }) => (
        <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
      ),
      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      blockquote: ({ children }) => (
        <blockquote
          className={
            isUser
              ? "my-2 border-l-2 border-primary-foreground/40 pl-3 italic opacity-95"
              : "my-2 border-l-2 border-border pl-3 text-muted-foreground italic"
          }
        >
          {children}
        </blockquote>
      ),
      hr: () => (
        <hr
          className={
            isUser
              ? "my-3 border-primary-foreground/25"
              : "my-3 border-border"
          }
        />
      ),
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {children}
        </a>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold">{children}</strong>
      ),
      table: ({ children }) => (
        <div className="my-2 max-w-full overflow-x-auto rounded-md ring-1 ring-border/50">
          <table className="w-full border-collapse text-left text-sm">{children}</table>
        </div>
      ),
      thead: ({ children }) => (
        <thead
          className={
            isUser ? "bg-primary-foreground/10" : "bg-muted/80"
          }
        >
          {children}
        </thead>
      ),
      th: ({ children }) => (
        <th className="border border-border/60 px-2 py-1.5 font-semibold">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="border border-border/50 px-2 py-1.5 align-top">
          {children}
        </td>
      ),
      tr: ({ children }) => <tr className={isUser ? "" : "even:bg-muted/30"}>{children}</tr>,
      code: ({ className, children }) => {
        const match = /language-(\w+)/.exec(className ?? "")
        const codeText = String(children).replace(/\n$/, "")
        const isBlock = Boolean(match)

        if (!isBlock) {
          return <code className={inlineCodeClass}>{children}</code>
        }

        const language = match ? match[1] : "text"
        return (
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            PreTag="div"
            customStyle={{
              margin: "0.5rem 0",
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
              lineHeight: 1.5,
            }}
          >
            {codeText}
          </SyntaxHighlighter>
        )
      },
      pre: ({ children }) => <>{children}</>,
    }
  }, [isUser])

  return (
    <div
      className={
        isUser
          ? "[&_.prose]:text-primary-foreground"
          : "[&_strong]:text-foreground [&_ul]:text-muted-foreground [&_ol]:text-muted-foreground [&_li]:text-inherit"
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user"
  const variant = isUser ? "user" : "assistant"

  const bubble = (
    <div
      className={`min-w-0 max-w-[80%] rounded-lg p-3 space-y-2 text-sm ${
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {message.attachments?.length ? (
        <div className="flex flex-wrap gap-2">
          {message.attachments.slice(0, 3).map((url, i) => (
            <div
              key={i}
              className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0"
            >
              <img
                src={url}
                alt={`attachment-${i}`}
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      ) : null}

      <ChatMarkdownBody content={message.content} variant={variant} />
    </div>
  )

  return (
    <div
      className={`flex mb-4 items-start gap-2.5 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser ? (
        <>
          <AssistantChatAvatar className="mt-0.5" />
          {bubble}
        </>
      ) : (
        <>
          {bubble}
          <UserChatAvatar className="mt-0.5" />
        </>
      )}
    </div>
  )
}
