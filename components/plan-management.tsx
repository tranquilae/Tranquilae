"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Crown, Check, X, CreditCard, Calendar } from "lucide-react"
import { useState } from "react"

export function PlanManagement() {
  const [currentPlan, setCurrentPlan] = useState("pathfinder")
  const [billingCycle, setBillingCycle] = useState("monthly")

  const plans = [
    {
      id: "explorer",
      name: "Explorer",
      price: "Free",
      description: "Perfect for getting started with wellness tracking",
      features: [
        "Basic calorie tracking",
        "Simple workout logging",
        "Daily mindfulness reminders",
        "Basic goal setting",
        "Community access",
      ],
      limitations: ["Limited AI coach interactions", "No advanced analytics", "No meal planning", "No integrations"],
    },
    {
      id: "pathfinder",
      name: "Pathfinder",
      price: billingCycle === "monthly" ? "£10/month" : "£100/year",
      description: "Complete wellness companion with AI coaching",
      features: [
        "Everything in Explorer",
        "Unlimited AI coach access",
        "Advanced nutrition tracking",
        "Personalized meal plans",
        "Workout plan generation",
        "Advanced analytics & insights",
        "Health app integrations",
        "Priority support",
        "Custom goal templates",
        "Export data",
      ],
      limitations: [],
    },
  ]

  const currentPlanData = plans.find((p) => p.id === currentPlan)

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Subscription Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Status */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Crown className="h-3 w-3" />
                {currentPlanData?.name}
              </Badge>
              <span className="text-sm font-medium">{currentPlanData?.price}</span>
            </div>
            {currentPlan === "pathfinder" && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Next billing</p>
                <p className="text-sm font-medium">Jan 22, 2025</p>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{currentPlanData?.description}</p>
        </div>

        {/* Billing Cycle Toggle (for Pathfinder) */}
        {currentPlan === "pathfinder" && (
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
            <div>
              <h4 className="font-medium text-sm">Annual Billing</h4>
              <p className="text-xs text-muted-foreground">Save 17% with yearly subscription</p>
            </div>
            <Switch
              checked={billingCycle === "yearly"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
            />
          </div>
        )}

        {/* Plan Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-lg border transition-all ${
                currentPlan === plan.id ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-lg font-bold text-primary">{plan.price}</p>
                </div>
                {currentPlan === plan.id ? (
                  <Badge variant="default">Current</Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setCurrentPlan(plan.id)}
                    variant={plan.id === "pathfinder" ? "default" : "outline"}
                  >
                    {plan.id === "pathfinder" ? "Upgrade" : "Downgrade"}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {plan.features.slice(0, 5).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.limitations.slice(0, 2).map((limitation, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-3 w-3 text-red-500" />
                    <span>{limitation}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Billing Actions */}
        {currentPlan === "pathfinder" && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent">
              <CreditCard className="h-4 w-4" />
              Update Payment
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Calendar className="h-4 w-4" />
              Billing History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
