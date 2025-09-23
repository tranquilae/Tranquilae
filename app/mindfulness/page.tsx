import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Heart, Smile, Moon, CheckCircle, Play } from "lucide-react"
import Link from "next/link"

export default function MindfulnessPage() {
  const features = [
    {
      icon: Brain,
      title: "Guided Meditations",
      description: "Choose from hundreds of guided meditation sessions for stress relief, focus, and better sleep."
    },
    {
      icon: Heart,
      title: "Mood Tracking",
      description: "Monitor your emotional wellbeing and identify patterns in your daily mood and energy levels."
    },
    {
      icon: Smile,
      title: "Breathing Exercises",
      description: "Simple breathing techniques to reduce anxiety and increase mindfulness throughout your day."
    },
    {
      icon: Moon,
      title: "Sleep Stories",
      description: "Calming bedtime stories and soundscapes designed to help you fall asleep peacefully."
    }
  ]

  const practices = [
    {
      name: "Daily Meditation",
      description: "Short 5-20 minute guided sessions to center your mind and reduce stress.",
      duration: "5-20 min",
      difficulty: "All Levels"
    },
    {
      name: "Breathing Exercises",
      description: "Quick breathing techniques perfect for moments when you need instant calm.",
      duration: "2-10 min",
      difficulty: "Beginner Friendly"
    },
    {
      name: "Body Scan",
      description: "Progressive relaxation sessions to release tension and increase body awareness.",
      duration: "15-30 min",
      difficulty: "All Levels"
    },
    {
      name: "Mindful Movement",
      description: "Gentle yoga and stretching combined with mindfulness for physical and mental wellness.",
      duration: "20-45 min",
      difficulty: "All Levels"
    }
  ]

  const benefits = [
    "Reduce stress and anxiety",
    "Improve focus and concentration",
    "Better emotional regulation",
    "Enhanced sleep quality",
    "Increased self-awareness",
    "Greater sense of calm and peace"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Find Your <span className="text-primary">Inner Peace</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover the power of mindfulness with guided meditations, breathing exercises, 
                and wellness practices designed to reduce stress and enhance your mental clarity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/auth/signup">Start Your Journey</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/#features">Try Free Meditation</Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Card className="glass-card border-0 p-8">
                <CardContent className="p-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Today's Practice</span>
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">10 min</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Play className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Morning Calm</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start your day with clarity and focus
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Streak</span>
                        <span className="font-medium text-primary">7 days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">This Week</span>
                        <span className="font-medium">45 minutes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Sessions</span>
                        <span className="font-medium">23</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border/50">
                      <div className="text-center text-sm text-muted-foreground mb-2">Weekly Goal: 5/5 sessions</div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-full bg-primary rounded-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Types Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Choose Your Practice</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Whether you have 2 minutes or 30 minutes, find the perfect mindfulness practice for your schedule.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {practices.map((practice, index) => (
              <Card key={index} className="glass-card border-0 p-6">
                <CardContent className="p-0">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">{practice.name}</h3>
                    <p className="text-muted-foreground mb-4">{practice.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        <Play className="h-4 w-4 inline mr-1" />
                        {practice.duration}
                      </span>
                      <span className="text-primary font-medium">{practice.difficulty}</span>
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
            <h2 className="text-4xl font-bold mb-6">Mindfulness Made Simple</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive mindfulness tools are designed to fit seamlessly into your daily routine.
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
            <h2 className="text-4xl font-bold mb-6">Transform Your Mind</h2>
            <p className="text-lg text-muted-foreground">
              Experience the scientifically-proven benefits of regular mindfulness practice.
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
            <h2 className="text-4xl font-bold mb-6">Your Path to Mindfulness</h2>
            <p className="text-lg text-muted-foreground">
              Begin your mindfulness journey with these simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Choose Your Practice</h3>
                <p className="text-muted-foreground">
                  Select from meditation, breathing exercises, or body scans based on your current needs.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Find Your Space</h3>
                <p className="text-muted-foreground">
                  Create a quiet, comfortable environment and follow along with guided audio instructions.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Track Your Progress</h3>
                <p className="text-muted-foreground">
                  Monitor your mood, maintain streaks, and watch your mindfulness practice grow over time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card border-0 bg-gradient-to-r from-primary/5 to-secondary/5 p-12 text-center">
            <CardContent className="p-0">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
              </div>
              <blockquote className="text-xl mb-6 italic">
                "The mindfulness practices have completely transformed how I handle stress. 
                I feel more centered and peaceful than I have in years."
              </blockquote>
              <div className="text-muted-foreground">
                <div className="font-medium">Sarah Chen</div>
                <div className="text-sm">Marketing Director, London</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-card border-0 bg-gradient-to-r from-primary/10 to-secondary/10 p-12">
            <CardContent className="p-0">
              <h2 className="text-3xl font-bold mb-6">Ready to Find Your Calm?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start your mindfulness journey today and discover the peace that comes from within.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/auth/signup">Begin Mindfulness Practice</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
