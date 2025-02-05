import { forceSignOut } from '@/app/actions/auth'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await forceSignOut()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Force sign out error:', error)
    return NextResponse.json(
      { error: 'Failed to force sign out' },
      { status: 500 }
    )
  }
} 