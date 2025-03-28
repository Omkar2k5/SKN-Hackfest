import { Check, Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"

const recommendations = [
  {
    id: "r1",
    title: "Reduce Subscription Services",
    description:
      "You're spending $65 monthly on overlapping streaming services. Consider consolidating to save $30/month.",
    impact: "Save $360/year",
    implemented: false,
  },
  {
    id: "r2",
    title: "Optimize Dining Budget",
    description: "Reducing takeout by 2 meals per week could save approximately $40 weekly.",
    impact: "Save $2,080/year",
    implemented: false,
  },
  {
    id: "r3",
    title: "Energy Efficiency",
    description: "Based on your utility bills, switching to LED bulbs and smart thermostats could reduce costs by 15%.",
    impact: "Save $240/year",
    implemented: true,
  },
]

export function SavingsRecommendations() {
  return (
    <div className="space-y-4">
      {recommendations.map((recommendation) => (
        <div key={recommendation.id} className="flex items-start gap-4 rounded-lg border p-4">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            {recommendation.implemented ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Lightbulb className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{recommendation.title}</h4>
              <span className="text-xs font-medium text-emerald-600">{recommendation.impact}</span>
            </div>
            <p className="text-sm text-muted-foreground">{recommendation.description}</p>
            {!recommendation.implemented && (
              <Button variant="outline" size="sm" className="mt-2">
                Implement
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

