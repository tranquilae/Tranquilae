'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, Lightbulb, TrendingUp, MessageCircle, CheckCircle, Sparkles } from "lucide-react"
import { Header } from "@/components/homepage/header"
import { Footer } from "@/components/homepage/footer"
import Link from "next/link"

export default function AICoachPage() {
  const features = [
    {
      icon: Bot,
      title: "Personalized Recommendations",
      description: "Get tailored advice based on your goals, preferences, and progress patterns."
    },
    {
      icon: Lightbulb,
      title: "Smart Insights",
      description: "Discover patterns in your wellness data and receive actionable insights to improve your health."
    },
    {
      icon: TrendingUp,
      title: "Progress Optimization",
      description: "AI analyzes your data to suggest the most effective strategies for reaching your goals faster."
    },
    {
      icon: MessageCircle,
      title: "24/7 Support",
      description: "Ask questions anytime and get instant, personalized responses from your AI wellness coach."
    }
  ]

  const coachingAreas = [
    {
      name: "Nutrition Guidance",
      description: "Personalized meal suggestions, macro balancing, and healthy eating habits.",
      icon: "🥗"
    },
    {
      name: "Fitness Planning",
      description: "Custom workout routines adapted to your fitness level and available time.",
      icon: "💪"
    },
    {
      name: "Recovery & Sleep",
      description: "Optimize your rest and recovery for better performance and wellbeing.",
      icon: "😴"
    },
    {
      name: "Stress Management",
      description: "Techniques and strategies to manage stress and improve mental health.",
      icon: "🧘‍♀️"
    },
    {
      name: "Goal Setting",
      description: "Smart goal creation and milestone tracking to keep you motivated.",
      icon: "🎯"
    },
    {
      name: "Habit Building",
      description: "Science-based approaches to building lasting healthy habits.",
      icon: "🔄"
    }
  ]

  const benefits = [
    "Get personalized advice 24/7",
    "Receive data-driven insights",
    "Accelerate your progress",
    "Stay motivated with smart feedback",
    "Learn from your patterns",
    "Adapt plans based on your lifestyle"
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
                Your Personal <span className="text-primary">AI Coach</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Meet your intelligent wellness companion. Get personalized guidance, 
                smart insights, and 24/7 support to help you achieve your health goals faster than ever.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/auth/signup">Meet Your AI Coach</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/#features">See How It Works</Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Card className="glass-card border-0 p-8">
                <CardContent className="p-0">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">Your AI Coach</div>
                        <div className="text-sm text-green-500">Online</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-primary/5 rounded-lg p-3 ml-8">
                        <p className="text-sm">
                          Great job on completing your workout yesterday! 🎉 
                          I noticed you've been consistent for 5 days now.
                        </p>
                      </div>
                      
                      <div className="bg-primary/5 rounded-lg p-3 ml-8">
                        <p className="text-sm">
                          Based on your sleep data, I recommend having your last meal 
                          2 hours earlier. This could improve your sleep quality by 15%.
                        </p>
                      </div>
                      
                      <div className="bg-primary/10 rounded-lg p-3 mr-8">
                        <p className="text-sm text-right">
                          Can you suggest a quick breakfast for tomorrow?
                        </p>
                      </div>
                      
                      <div className="bg-primary/5 rounded-lg p-3 ml-8">
                        <p className="text-sm">
                          Perfect timing! Based on your protein goals and schedule, 
                          try Greek yogurt with berries and granola. It's 280 calories 
                          with 20g protein. Want the recipe? ✨
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <Sparkles className="h-3 w-3" />
                      <span>AI is typing...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Coaching Areas Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Complete Wellness Coaching</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Your AI coach provides expert guidance across all aspects of your wellness journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coachingAreas.map((area, index) => (
              <Card key={index} className="glass-card border-0 p-6 text-center">
                <CardContent className="p-0">
                  <div className="text-4xl mb-4">{area.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{area.name}</h3>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
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
            <h2 className="text-4xl font-bold mb-6">Intelligent Coaching Features</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Experience the power of AI-driven personalization in your wellness journey.
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
            <h2 className="text-4xl font-bold mb-6">Why Choose AI Coaching?</h2>
            <p className="text-lg text-muted-foreground">
              Experience the advantages of having a smart, always-available wellness coach.
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
            <h2 className="text-4xl font-bold mb-6">How Your AI Coach Works</h2>
            <p className="text-lg text-muted-foreground">
              Advanced AI technology meets personalized wellness coaching.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Learn Your Patterns</h3>
                <p className="text-muted-foreground">
                  Your AI coach analyzes your habits, preferences, and progress to understand what works best for you.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Provide Smart Guidance</h3>
                <p className="text-muted-foreground">
                  Receive personalized recommendations, tips, and adjustments based on your unique data and goals.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Adapt & Improve</h3>
                <p className="text-muted-foreground">
                  Your coach continuously learns from your feedback and results to provide increasingly better advice.
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
                  <Bot className="h-8 w-8 text-primary" />
                </div>
              </div>
              <blockquote className="text-xl mb-6 italic">
                "It's like having a personal trainer, nutritionist, and therapist all rolled into one. 
                The AI coach knows exactly what I need when I need it."
              </blockquote>
              <div className="text-muted-foreground">
                <div className="font-medium">Michael Rodriguez</div>
                <div className="text-sm">Software Engineer, Manchester</div>
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
              <h2 className="text-3xl font-bold mb-6">Ready to Meet Your AI Coach?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start your personalized wellness journey today with intelligent coaching that adapts to you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/auth/signup">Start Free Coaching</Link>
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
