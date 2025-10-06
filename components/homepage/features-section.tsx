"use client"

import { Activity, Brain, Heart, Sparkles } from "lucide-react"
import Link from "next/link"

export function FeaturesSection() {
  const features = [
    {
      number: "01",
      title: "Fitness & Movement",
      description: "Track workouts, monitor progress, and achieve your fitness goals with AI-powered recommendations tailored to your body and lifestyle.",
      icon: Activity,
      gradient: "from-[var(--nature-green)] to-[var(--soft-blue)]"
    },
    {
      number: "02",
      title: "Nutrition Intelligence",
      description: "Smart meal planning and calorie tracking powered by AI. Get personalized nutrition insights that adapt to your changing needs.",
      icon: Heart,
      gradient: "from-[var(--soft-blue)] to-[var(--nature-green)]"
    },
    {
      number: "03",
      title: "Mindfulness & Mental Wellness",
      description: "Guided meditation, stress management, and mood tracking. Build sustainable habits for lasting mental clarity and peace.",
      icon: Brain,
      gradient: "from-[var(--nature-green)] via-[var(--soft-blue)] to-[var(--nature-green)]"
    }
  ]

  return (
    <section id="features" className="py-32 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <div className="glass-orb w-96 h-96 -top-48 -right-48 opacity-20" />
      <div className="glass-orb w-64 h-64 bottom-20 -left-32 opacity-25" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="section-number mb-4">01 — OUR SERVICES</div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Holistic Wellness
            <br />
            <span className="animated-gradient-text">Platform</span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            As a comprehensive wellness platform, we create memorable and transformative health experiences through data-driven insights and personalized coaching.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div 
                key={feature.number}
                className="liquid-glass p-8 md:p-12 hover-lift"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Left side - Number and Title */}
                  <div>
                    <div className="section-number mb-6">{feature.number}</div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-6">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-foreground/70 mb-8">
                      {feature.description}
                    </p>
                    <Link href="/auth/signup">
                      <button className="crystal-ball-button text-sm">
                        Learn More
                      </button>
                    </Link>
                  </div>

                  {/* Right side - Icon with gradient */}
                  <div className="flex justify-center md:justify-end">
                    <div className="relative">
                      {/* Gradient glow background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20 blur-3xl rounded-full`} />
                      
                      {/* Icon container */}
                      <div className="relative liquid-glass p-12 glow-breathe">
                        <Icon className="w-24 h-24 text-foreground/80" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
