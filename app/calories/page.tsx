import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Apple, BarChart3, Target, Zap, CheckCircle } from "lucide-react"
import { Header } from "@/components/homepage/header"
import { Footer } from "@/components/homepage/footer"
import Link from "next/link"

export default function CaloriesPage() {
  const features = [
    {
      icon: Apple,
      title: "Smart Food Recognition",
      description: "Take a photo of your meal and our AI will automatically identify foods and estimate calories."
    },
    {
      icon: BarChart3,
      title: "Detailed Nutrition Breakdown",
      description: "Track macros, vitamins, and minerals with comprehensive nutritional analysis."
    },
    {
      icon: Target,
      title: "Personalized Goals",
      description: "Set custom calorie and macro targets based on your fitness goals and lifestyle."
    },
    {
      icon: Zap,
      title: "Quick Logging",
      description: "Log meals in seconds with our extensive food database and barcode scanner."
    }
  ]

  const benefits = [
    "Achieve your weight goals faster",
    "Improve energy levels throughout the day",
    "Better understand your eating patterns",
    "Make informed food choices",
    "Track progress with visual charts",
    "Stay accountable to your nutrition goals"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <Header />
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Master Your <span className="text-primary">Nutrition</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Take control of your health with intelligent calorie and nutrition tracking. 
                Our AI-powered tools make it easy to understand what you're eating and reach your goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/auth/signup">Start Tracking Free</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/#features">Learn More</Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Card className="glass-card border-0 p-8">
                <CardContent className="p-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Today's Calories</span>
                      <span className="text-2xl font-bold text-primary">1,836</span>
                    </div>
                    <div className="space-y-3">
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
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-400" />
                          Fat
                        </span>
                        <span className="text-sm font-medium">320 cal</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <div className="text-center text-sm text-muted-foreground mb-2">Goal: 2,200 cal</div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-4/5 bg-primary rounded-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Powerful Tracking Features</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our advanced nutrition tracking tools make it easier than ever to monitor your food intake and reach your goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card border-0 p-6">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Why Track Your Calories?</h2>
            <p className="text-lg text-muted-foreground">
              Discover the benefits of mindful eating and nutrition awareness.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Start tracking your nutrition in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Log Your Meals</h3>
                <p className="text-muted-foreground">
                  Take photos, scan barcodes, or search our extensive food database to log your meals.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Track Progress</h3>
                <p className="text-muted-foreground">
                  Monitor your daily intake and see detailed breakdowns of calories, macros, and nutrients.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Reach Your Goals</h3>
                <p className="text-muted-foreground">
                  Get personalized insights and recommendations to help you achieve your nutrition goals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-card border-0 bg-gradient-to-r from-primary/10 to-secondary/10 p-12">
            <CardContent className="p-0">
              <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Nutrition?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of users who have improved their health with smart calorie tracking.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/auth/signup">Start Free Trial</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Have Questions?</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  )
}
