import { Providers } from './providers/providers'
import { ReactNode } from 'react'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Shifterino - 911 Dispatch Scheduling',
  description: '24/7 scheduling system for 911 dispatch centers',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-background antialiased ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
