// app/(dashboard)/layout.tsx (should be correct already)
import { ReactNode } from "react"
import { DashboardClientLayout } from './DashboardClientLayout'

export const metadata = {
  title: "Dashboard - Shifterino",
  description: "Dispatch scheduling system dashboard",
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}