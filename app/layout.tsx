import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/server'
import { SupabaseAuthProvider } from '@/components/providers/supabase-auth-provider'
import type { Metadata } from 'next'

// Initialize the Inter font family with the latin subset.
const inter = Inter({ subsets: ['latin'] })

// Application metadata used by Next.js.
export const metadata: Metadata = {
  title: '911 Dispatch Scheduler',
  description: 'A comprehensive scheduling system for 911 dispatch centers',
}

async function getSession() {
  const supabase = createClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * RootLayout Component
 *
 * This is the root layout for the application. It sets up global CSS, fonts,
 * and initializes server-side authentication using Supabase.
 * It attempts to retrieve the authenticated user before rendering the layout.
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
  const session = await getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseAuthProvider session={session}>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
