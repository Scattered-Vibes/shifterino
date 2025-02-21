import { Loading } from "@/components/ui/loading"

export default function DashboardLoading() {
  return (
    <Loading 
      message="Loading dashboard..." 
      variant="fullscreen"
      size="lg"
    />
  )
}
