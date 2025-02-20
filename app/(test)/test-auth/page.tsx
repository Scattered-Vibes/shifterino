'use server'

import { createTestUsers } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function TestAuth() {
  const { data, error } = await createTestUsers()

  if (error) {
    console.error('Failed to create test users:', error)
    return {
      error: {
        message: 'Failed to create test users',
        details: error.message
      }
    }
  }

  console.log('Created test users successfully')
  redirect('/')
}

export function TestPage() {
  return (
    <div>
      <h1>Test Page</h1>
      <p>If you can see this, basic routing is working</p>
    </div>
  )
} 