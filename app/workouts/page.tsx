import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, Clock, Trophy, Users, CheckCircle, Play } from "lucide-react"
import { Header } from "@/components/homepage/header"
import { Footer } from "@/components/homepage/footer"
import Link from "next/link"

export default function WorkoutsPage() {
  const features = [
    {
      icon: Activity,
      title: "Personalized Workout Plans",
      description: "AI-generated workout routines tailored to your fitness level, goals, and available equipment."
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Workouts that adapt to your schedule - from 10-minute quickies to comprehensive hour-long sessions."
    },
    {
      icon: Trophy,
      title: "Progress Tracking",
      description: "Monitor your improvements with detailed analytics on strength, endurance, and consistency."
    },
    {
      icon: Users,
      title: "Community Challenges",
      description: "Join group challenges and compete with friends to stay motivated and accountable."
    }
  ]

  const workoutTypes = [
    {
      name: "Strength Training",
      description: "Build muscle and increase power with progressive weight training routines.",
      duration: "45-60 min",
      difficulty: "Beginner to Advanced"
    },
    {
      name: "HIIT Cardio",
      description: "High-intensity interval training for maximum calorie burn and cardiovascular health.",
      duration: "20-30 min",
      difficulty: "Intermediate to Advanced"
    },
    {
      name: "Yoga & Flexibility",
      description: "Improve flexibility, balance, and mindfulness with guided yoga sessions.",
      duration: "30-45 min",
      difficulty: "All Levels"
    },
    {
      name: "Quick Workouts",
      description: "Short, effective workouts for busy schedules - no equipment needed.",
      duration: "10-15 min",
      difficulty: "All Levels"
    }
  ]

  const benefits = [
    "Increase strength and muscle mass",
    "Improve cardiovascular health",
    "Boost energy and mood",
    "Better sleep quality",
    "Enhanced mental clarity",
    "Build healthy habits that stick"
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
                Elevate Your <span className="text-primary">Fitness</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Transform your body and mind with personalized workouts designed by AI. 
                From beginner-friendly routines to advanced challenges, we've got your fitness journey covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/auth/signup">Start Your Fitness Journey</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/#features">View Demo Workout</Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Card className="glass-card border-0 p-8">
                <CardContent className="p-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Today's Workout</span>
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">45 min</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Play className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Push-ups</div>
                          <div className="text-xs text-muted-foreground">3 sets × 12 reps</div>
                        </div>
                        <div className="text-green-500 text-sm">✓</div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Play className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Squats</div>
                          <div className="text-xs text-muted-foreground">3 sets × 15 reps</div>
                        </div>
                        <div className="text-green-500 text-sm">✓</div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                          <Play className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Plank Hold</div>
                          <div className="text-xs text-muted-foreground">3 sets × 30 sec</div>
                        </div>
                        <div className="text-sm text-muted-foreground">Current</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border/50">
                      <div className="text-center text-sm text-muted-foreground mb-2">Progress: 2/5 exercises</div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-2/5 bg-primary rounded-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Workout Types Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Choose Your Workout Style</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Whatever your fitness goals or preferences, we have the perfect workout type for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {workoutTypes.map((workout, index) => (
              <Card key={index} className="glass-card border-0 p-6">
                <CardContent className="p-0">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">{workout.name}</h3>
                    <p className="text-muted-foreground mb-4">{workout.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {workout.duration}
                      </span>
                      <span className="text-primary font-medium">{workout.difficulty}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Smart Workout Features</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our advanced fitness tracking tools adapt to your needs and help you achieve better results.
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
            <h2 className="text-4xl font-bold mb-6">Transform Your Health</h2>
            <p className="text-lg text-muted-foreground">
              Experience the life-changing benefits of consistent exercise and proper guidance.
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
            <h2 className="text-4xl font-bold mb-6">Your Fitness Journey, Simplified</h2>
            <p className="text-lg text-muted-foreground">
              Get started with personalized workouts in three easy steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Set Your Goals</h3>
                <p className="text-muted-foreground">
                  Tell us about your fitness level, goals, and preferences to get personalized recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Follow Your Plan</h3>
                <p className="text-muted-foreground">
                  Get guided workouts with video demonstrations and real-time coaching tips.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Track Progress</h3>
                <p className="text-muted-foreground">
                  Monitor your improvements and celebrate milestones as you achieve your fitness goals.
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
              <h2 className="text-3xl font-bold mb-6">Ready to Get Stronger?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of users who have transformed their bodies and minds with our workout programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/auth/signup">Start Working Out Today</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Need Help Getting Started?</Link>
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
