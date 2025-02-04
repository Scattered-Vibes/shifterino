import './globals.css'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/toaster'
import SupabaseProvider from '@/components/providers/supabase-provider'
import type { Metadata } from 'next'

// Initialize the Inter font family with the latin subset.
const inter = Inter({ subsets: ['latin'] })

// Application metadata used by Next.js.
export const metadata: Metadata = {
  title: '911 Dispatch Scheduler',
  description: '24/7 Scheduling System for 911 Dispatch Center',
}

async function refreshSession() {
  try {
    // Get the host from headers
    const headersList = headers()
    const host = headersList.get('host')
    const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    
    // Construct absolute URL
    const url = `${proto}://${host}/auth/refresh-session`
    
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    })
    
    if (!response.ok && response.status !== 401) {
      // Only log errors that aren't authentication related
      console.error('Failed to refresh session:', await response.text())
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to parse URL')) {
      console.error('Invalid refresh session URL configuration')
    } else {
      console.error('Error refreshing session:', error)
    }
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
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  )
}
