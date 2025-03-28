"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Progress } from "@/components/ui/progress"

const data = [
  { name: "Score", value: 78, color: "#3b82f6" },
  { name: "Remaining", value: 22, color: "#e5e7eb" },
]

const scoreDetails = [
  { name: "Savings Rate", score: 85, description: "You're saving 20% of your income" },
  { name: "Debt Management", score: 70, description: "Your debt-to-income ratio is good" },
  { name: "Spending Habits", score: 75, description: "You stay within budget most months" },
  { name: "Emergency Fund", score: 60, description: "Your emergency fund covers 3 months" },
]

export function FinancialHealthScore() {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
      <div className="flex flex-col items-center justify-center">
        <div className="h-[200px] w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold"
                fill="#000000"
              >
                78/100
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center">
          <p className="text-lg font-medium">Good</p>
          <p className="text-sm text-muted-foreground">Your financial health is on track</p>
        </div>
      </div>

      <div className="space-y-4">
        {scoreDetails.map((detail) => (
          <div key={detail.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{detail.name}</span>
              <span className="text-sm font-medium">{detail.score}/100</span>
            </div>
            <Progress value={detail.score} className="h-2" />
            <p className="text-xs text-muted-foreground">{detail.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

