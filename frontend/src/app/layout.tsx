// app/layout.tsx
import "./globals.css"
import { Inter } from "next/font/google"
import { ClientWalletProvider } from "./providers"
import { ThemeProvider } from "./theme-provider"
import { DarkModeToggle } from "../components/DarkModeToggle"
import type React from "react"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

// public 폴더에서 favicon 파일들을 불러오도록 설정
const FAVICON_ICO = "/favicon.ico"
const FAVICON_16 = "/favicon-16x16.png"
const FAVICON_32 = "/favicon-32x32.png"
const APPLE_ICON = "/apple-icon.png"

// Next.js 메타데이터 설정
export const metadata: Metadata = {
  title: "Solana 24",
  description: "Whatever you choose 0.1 sol",
  icons: {
    // 일반 파비콘(ICO) + PNG 아이콘(16, 32) 각각 지정
    icon: [
      {
        url: FAVICON_ICO,
        sizes: "any",
      },
      {
        url: FAVICON_16,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: FAVICON_32,
        sizes: "32x32",
        type: "image/png",
      },
    ],
    // 애플
    apple: [
      {
        url: APPLE_ICON,
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClientWalletProvider>
            <div className="fixed z-50 top-4 left-4">
              <DarkModeToggle />
            </div>
            {children}
          </ClientWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
