import { SupabaseClient } from '@supabase/supabase-js'

interface ServerComponentProps {
  supabase: SupabaseClient
}

export default async function ServerComponent({ supabase }: ServerComponentProps) {
  const { data, error } = await supabase.from('test').select('*')
  
  if (error) {
    throw error
  }
  
  return (
    <div data-testid="server-component">
      {JSON.stringify(data)}
    </div>
  )
} 