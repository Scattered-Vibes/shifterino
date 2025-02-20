import { signOut } from '@/lib/auth/server'
import { NextResponse } from 'next/server'
import { handleError } from '@/lib/utils/error-handler'

export async function POST(request: Request) {
  try {
    await signOut()
    
    return NextResponse.json({
      message: 'Signed out successfully'
    })
  } catch (error) {
    const appError = handleError(error)
    return NextResponse.json(
      { error: appError.message },
      { status: 500 }
    )
  }
}

// Only allow POST and OPTIONS
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_DOMAIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 