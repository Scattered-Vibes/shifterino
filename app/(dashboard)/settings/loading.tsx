import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid gap-6">
        <div className="rounded-lg border p-4">
          <Skeleton className="mb-4 h-6 w-36" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
    </div>
  )
}
