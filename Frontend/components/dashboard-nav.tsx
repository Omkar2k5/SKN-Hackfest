import Link from "next/link"
import { BarChart3, CreditCard, Home, LineChart, PiggyBank, User, TrendingUp, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DashboardNavProps {
  className?: string
  [key: string]: any
}

export function DashboardNav({ className, ...props }: DashboardNavProps) {
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Expenses",
      href: "/expenses",
      icon: CreditCard,
    },
    {
      title: "Budgeting",
      href: "/budgeting",
      icon: PiggyBank,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: LineChart,
    },
    {
      title: "Portfolio",
      href: "/portfolio",
      icon: TrendingUp,
    },
    {
      title: "Update Transactions",
      href: "/dashboard/update",
      icon: Upload,
    },
  ]

  return (
    <div className={cn("flex flex-col gap-2 p-4", className || "")} {...props}>
      <div className="py-2">
        <h2 className="px-4 text-lg font-semibold tracking-tight">Navigation</h2>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <Button key={item.href} variant="ghost" asChild className="flex justify-start gap-2">
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}

