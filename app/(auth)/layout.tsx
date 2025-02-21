import { ReactNode } from "react"
import { BaseLayout } from "@/components/layouts/BaseLayout"

export const metadata = {
  title: "Authentication - Shifterino",
  description: "Authentication pages for Shifterino dispatch scheduling system",
}

export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <BaseLayout 
      showNav={false}
      className="flex min-h-screen flex-col items-center justify-center"
    >
      <div className="relative w-full max-w-md space-y-4 px-4 py-8">
        {children}
      </div>
    </BaseLayout>
  )
} 