import type React from "react"
import type { Metadata } from "next"

import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "v0 Chat UI",
  description: "A v0-style chat UI with code editor panel",
}

export default function RootLayout({ children, }: { children: React.ReactNode}) {
  return (
    <main className={inter.className}>
      {children}
    </main>
  )
}