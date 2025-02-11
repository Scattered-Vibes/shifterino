import { Inter } from 'next/font/google'
import './globals.css'
import { RootProvider } from './providers/root-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Shifterino - 911 Dispatch Scheduling',
  description: '24/7 scheduling system for 911 dispatch centers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
