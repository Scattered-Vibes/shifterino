import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ShiftOptionsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shift Options</h1>
          <p className="text-muted-foreground">
            Manage shift types and their time blocks.
          </p>
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shift Options</CardTitle>
        </CardHeader>
        <CardContent>
          <ShiftOptionsTableSkeleton />
        </CardContent>
      </Card>
    </div>
  )
}
