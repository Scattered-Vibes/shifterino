import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock, Users, Calendar, Shield, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: '911 Dispatch Scheduling System',
  description: 'Advanced scheduling system for 911 dispatch centers providing 24/7 coverage management, time-off requests, and compliance monitoring.',
  keywords: '911 dispatch, scheduling, emergency services, shift management, dispatch center',
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center space-y-10 px-4 py-24 text-center md:py-32">
        <div className="container mx-auto max-w-[800px] space-y-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Streamlined Scheduling for
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {' '}911 Dispatch Centers
            </span>
          </h1>
          <p className="mx-auto max-w-[600px] text-gray-500 dark:text-gray-400 md:text-xl">
            Optimize your dispatch center operations with our comprehensive scheduling solution. 
            Ensure 24/7 coverage, manage time-off requests, and maintain compliance effortlessly.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4 rounded-lg border p-6">
            <Clock className="h-10 w-10 text-blue-600" />
            <h3 className="text-xl font-bold">24/7 Coverage</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Ensure round-the-clock staffing with intelligent scheduling that meets minimum requirements.
            </p>
          </div>
          <div className="space-y-4 rounded-lg border p-6">
            <Users className="h-10 w-10 text-blue-600" />
            <h3 className="text-xl font-bold">Staff Management</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Efficiently manage dispatcher and supervisor schedules while maintaining optimal coverage.
            </p>
          </div>
          <div className="space-y-4 rounded-lg border p-6">
            <Calendar className="h-10 w-10 text-blue-600" />
            <h3 className="text-xl font-bold">Time-Off Management</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Streamline time-off requests and approvals while ensuring adequate staffing levels.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-[800px] space-y-4 text-center">
            <h2 className="text-3xl font-bold">Trusted by Emergency Services</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Our scheduling system helps dispatch centers maintain critical operations 24/7/365.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-4 rounded-lg border bg-white p-4 dark:bg-gray-800">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <h4 className="font-semibold">Compliance Ready</h4>
                  <p className="text-sm text-gray-500">Meets industry standards</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 rounded-lg border bg-white p-4 dark:bg-gray-800">
                <CheckCircle className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <h4 className="font-semibold">Always Available</h4>
                  <p className="text-sm text-gray-500">99.9% uptime guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex items-center space-x-4">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Dispatch Scheduling System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
