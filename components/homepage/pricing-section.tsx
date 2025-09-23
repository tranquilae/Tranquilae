import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Sparkles, Crown } from "lucide-react"
import Link from "next/link"

export function PricingSection() {
  const plans = [
    {
      name: "Explorer",
      price: "Free",
      period: "",
      description: "Essential tracking for casual wellness",
      icon: Sparkles,
      features: [
        "Unlimited wellness tracking",
        "Basic analytics dashboard",
        "Community access",
        "Goal mapping",
        "Mindfulness calendar",
      ],
      cta: "Let's get started!",
      href: "/auth/signup?plan=explorer",
    },
    {
      name: "Pathfinder",
      price: "£10.99",
      period: "/month",
      description: "Advanced analytics for serious wellness",
      icon: Crown,
      features: [
        "All Explorer features",
        "Advanced performance metrics",
        "Personalized coaching plans",
        "Meal analysis",
        "Recovery recommendations",
        "Unlimited workout types",
        "Export data to other platforms",
      ],
      cta: "Try 14 days for free",
      href: "/auth/signup?plan=pathfinder",
    },
  ]

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance mb-6">Choose Your Path</h2>
          <p className="text-lg text-muted-foreground">The first 14 days is on us, no credit card required</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center rounded-full bg-muted p-1">
            <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              Monthly
            </button>
            <button className="px-6 py-2 rounded-full text-sm font-medium text-muted-foreground">
              Yearly (save 17%)
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className="glass-card border-0 p-8">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-lg font-normal text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <Link href={plan.href} className="block mb-8">
                  <Button className="w-full text-lg py-6 rounded-2xl bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-xl transform">{plan.cta}</Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="glass-card border-0 bg-gradient-to-r from-primary/10 to-secondary/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-8">
                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-2">Sarah Mitchell</div>
                    <div className="text-xs text-muted-foreground">from London City Marathon Club</div>
                  </div>

                  <div className="text-6xl font-bold text-primary/20 mb-4">99</div>

                  <blockquote className="text-lg mb-6">
                    "The advanced metrics in the Pathfinder plan helped me qualify for London. The recovery
                    recommendations are game-changing."
                  </blockquote>

                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-primary" />
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-1/3 relative min-h-[200px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                      <Crown className="h-16 w-16 text-primary/50" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
