'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type EmployeeRole } from "@/app/_types/database"
import { useState } from "react"

interface NavProps {
  role?: EmployeeRole
}

interface NavItem {
  title: string
  href: string
  icon: string
  roles?: EmployeeRole[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "📊",
  },
  {
    title: "Schedule",
    href: "/schedule",
    icon: "📅",
  },
  {
    title: "Manage",
    href: "/manage",
    icon: "👥",
    roles: ["manager", "supervisor"],
  },
  {
    title: "Time Off",
    href: "/time-off",
    icon: "⏰",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "⚙️",
  },
]

export function Nav({ role }: NavProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <nav className={`flex h-full flex-col border-r bg-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex h-14 items-center justify-end border-b px-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 rounded-md hover:bg-gray-100 flex items-center justify-center"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      <div className="flex-1 overflow-auto pt-4">
        {navItems.map((item) => {
          // Skip items that require specific roles if user doesn't have access
          if (item.roles && (!role || !item.roles.includes(role))) {
            return null
          }

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`
                  flex items-center gap-4 px-3 py-2.5 cursor-pointer
                  hover:bg-gray-100 transition-colors
                  ${pathname === item.href ? 'bg-gray-100' : ''}
                  ${collapsed ? 'justify-center px-2' : 'px-4'}
                `}
                title={collapsed ? item.title : undefined}
              >
                <span className="text-xl">{item.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium">
                    {item.title}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
} 