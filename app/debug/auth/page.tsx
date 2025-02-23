import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

async function getAuthLogs() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: logs, error } = await supabase
    .from('auth_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching auth logs:', error)
    return []
  }

  return logs
}

export default async function AuthDebugPage() {
  const logs = await getAuthLogs()

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.level === 'ERROR'
                          ? 'destructive'
                          : log.level === 'WARN'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.event}</TableCell>
                  <TableCell>{log.user_id}</TableCell>
                  <TableCell>
                    <pre className="text-xs">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 