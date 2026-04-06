import type { Metadata } from "next"
import localFont from "next/font/local"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  weight: "100 900",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Cupo — Agendamiento inteligente",
  description: "SaaS de agendamiento de citas multi-tenant",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geist.variable,
          inter.variable
        )}
      >
        {children}
      </body>
    </html>
  )
}
