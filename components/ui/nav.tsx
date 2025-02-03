'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarItem, useSidebar } from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Settings,
  type LucideIcon
} from "lucide-react"
import type { EmployeeRole } from "@/app/_types/database"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavProps {
  role?: EmployeeRole
}

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  roles?: EmployeeRole[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Schedule",
    href: "/schedule",
    icon: Calendar,
  },
  {
    title: "Manage",
    href: "/manage",
    icon: Users,
    roles: ["manager", "supervisor"],
  },
  {
    title: "Time Off",
    href: "/time-off",
    icon: Clock,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Nav({ role }: NavProps) {
  const pathname = usePathname()
  const { collapsed } = useSidebar()

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar className="pt-4">
        {navItems.map((item) => {
          // Skip items that require specific roles if user doesn't have access
          if (item.roles && (!role || !item.roles.includes(role))) {
            return null
          }

          const Icon = item.icon
          const sidebarContent = (
            <SidebarItem
              className={cn(
                "transition-all duration-200",
                pathname === item.href && "bg-accent text-accent-foreground"
              )}
            >
              <Icon size={20} className={cn(collapsed && "mx-auto")} />
              <span 
                className={cn(
                  "transition-all duration-200",
                  collapsed && "hidden w-0 scale-0 opacity-0"
                )}
              >
                {item.title}
              </span>
            </SidebarItem>
          )

          return (
            <Link key={item.href} href={item.href}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {sidebarContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={20}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              ) : (
                sidebarContent
              )}
            </Link>
          )
        })}
      </Sidebar>
    </TooltipProvider>
  )
} 