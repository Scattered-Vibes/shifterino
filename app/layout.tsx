import { Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { type Metadata } from 'next'
import { SuspenseBoundary } from '@/components/ui/loading'
import './globals.css'

// Initialize the Inter font family with the latin subset.
const inter = Inter({ subsets: ['latin'] })

// Application metadata used by Next.js.
export const metadata: Metadata = {
  title: '911 Dispatch Scheduler',
  description: 'Scheduling system for 911 dispatch center',
}

/**
 * RootLayout Component
 *
 * This is the root layout for the application. It sets up global CSS, fonts,
 * and initializes server-side authentication using Supabase.
 * It attempts to retrieve the authenticated session before rendering the layout.
 * If authentication fails, the error is logged and the layout is rendered regardless.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - The child elements to render within the layout.
 * @returns {Promise<JSX.Element>} The HTML structure encompassing the application layout.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null

  try {
    const supabase = createClient()
    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting initial user:', error)
    } else if (authUser) {
      user = authUser
    }
  } catch (error) {
    console.error('Error in root layout:', error)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider initialUser={user}>
          <TooltipProvider>
            <SuspenseBoundary>
              {children}
            </SuspenseBoundary>
          </TooltipProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
