import { createClient } from '@/lib/supabase/server'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { RootProvider } from '@/components/providers/root-provider'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`} suppressHydrationWarning>
        <SupabaseProvider initialSession={session?.user ?? null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <RootProvider initialUser={session?.user ?? null}>
              {children}
              <Toaster />
            </RootProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
