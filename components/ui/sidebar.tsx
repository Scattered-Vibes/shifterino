import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultCollapsed?: boolean
}

const SidebarContext = React.createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}>({
  collapsed: false,
  setCollapsed: () => {},
})

export function Sidebar({
  defaultCollapsed = false,
  className,
  children,
  ...props
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div
        className={cn(
          "flex h-full flex-col border-r bg-background transition-all duration-300 overflow-hidden",
          collapsed ? "w-16" : "w-64",
          className
        )}
        {...props}
      >
        <div className="flex h-14 items-center justify-end border-b px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SidebarContext.Provider>
  )
}

export function SidebarItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { collapsed } = React.useContext(SidebarContext)

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-3 py-2.5 cursor-pointer relative",
        "transition-all duration-200 ease-in-out overflow-hidden",
        "hover:bg-accent hover:text-accent-foreground",
        collapsed ? "justify-center px-2 w-16" : "px-4 w-64",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
} 