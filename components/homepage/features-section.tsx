import { Card, CardContent } from "@/components/ui/card"
import { Activity, BarChart3, Target, Apple } from "lucide-react"

export function FeaturesSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance mb-6">Elevate Your Wellness Experience</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover how Tranquilae transforms more than just your health metrics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="glass-card border-0 p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full overflow-hidden opacity-20">
              <img src="/person-running-on-scenic-trail.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-0 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Track Your Steps, Calories & Nutrition</h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Monitor daily activity and stay aware of your wellness progress at all times.
              </p>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/20"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-primary"
                      strokeDasharray="314"
                      strokeDashoffset="125"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm text-muted-foreground">Goals</span>
                    <span className="text-2xl font-bold">73%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full overflow-hidden opacity-20">
              <img src="/group-doing-outdoor-yoga-class.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-0 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">See Your Progress with Simple Graphs</h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Visualize your wellness journey with easy-to-read trends and insights.
              </p>
              <div className="flex items-end justify-center gap-2 h-24">
                {[40, 60, 45, 70, 55, 80, 65].map((height, i) => (
                  <div
                    key={i}
                    className={`w-6 rounded-t ${i === 5 ? "bg-primary" : "bg-primary/30"}`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="text-right mt-2">
                <span className="text-sm text-muted-foreground">2406 cal</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full overflow-hidden opacity-20">
              <img src="/healthy-meal-planning-and-prep.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-0 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Set Daily & Weekly Goals That Motivate</h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Create wellness and nutrition goals to achieve a healthier lifestyle.
              </p>
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">This week</span>
                  <div className="text-3xl font-bold">2.1kg</div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0km</span>
                  <span>5km</span>
                  <span>10km</span>
                  <span>15km</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-3/5 bg-primary rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full overflow-hidden opacity-20">
              <img src="/woman-preparing-healthy-smoothie-bowl.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-0 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Apple className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Log Calories & Macros with Ease</h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Track your meals and balance macros for healthier eating habits.
              </p>
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">Daily Calories</span>
                  <div className="text-3xl font-bold">1,836</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      Protein
                    </span>
                    <span className="text-sm font-medium">285 cal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      Carbs
                    </span>
                    <span className="text-sm font-medium">485 cal</span>
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
