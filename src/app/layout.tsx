import type { Metadata } from 'next'
import '../index.css'

export const metadata: Metadata = {
  title: 'App IDE',
  description: 'LLM System App IDE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
