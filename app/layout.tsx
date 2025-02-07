import { type Metadata } from 'next'
import { Inter } from 'next/font/google'

import { createClient } from '@/lib/supabase/server'
import { Toaster } from '@/components/ui/sonner'
import { RootProvider } from '@/components/providers/root-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Shifterino - 911 Dispatch Scheduling',
  description:
    'Streamline your 911 dispatch center scheduling with our comprehensive solution.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Get the initial session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RootProvider initialUser={user}>
            {children}
            <Toaster />
          </RootProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
