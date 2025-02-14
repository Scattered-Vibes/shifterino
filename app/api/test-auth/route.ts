import { createServiceInstance } from '@/lib/supabase/clientInstance';
import { NextResponse } from 'next/server';

// Skip middleware for this route
export const config = {
  skipMiddleware: true
};

export async function GET() {
  try {
    const supabase = createServiceInstance();
    
    // Call our new function
    const { data, error } = await supabase.rpc('get_auth_users');
    
    if (error) {
      console.error('Error fetching auth users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ users: data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 