// app/(dashboard)/layout.tsx (should be correct already)
import { ReactNode } from "react"
import { BaseLayout } from "@/components/layouts/BaseLayout"

export const metadata = {
  title: "Dashboard - Shifterino",
  description: "Dispatch scheduling system dashboard",
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <BaseLayout className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {children}
      </div>
    </BaseLayout>
  )
}