import GlassCard from "@/components/ui/glass-card"
import GlassButton from "@/components/ui/glass-button"
import { ArrowRight, Sparkles, Heart, Target, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Liquid Glass Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-nature-100/40 via-transparent to-softblue-100/30" />
      <div className="absolute inset-0 bg-[url('/calm-nature-background-with-soft-leaves.jpg')] bg-cover bg-center opacity-5" />

      {/* Floating Glass Elements - iOS 26 inspired */}
      <div className="absolute top-20 left-10 glass-card p-4 w-20 h-20 flex items-center justify-center opacity-60">
        <Heart className="h-8 w-8 text-nature-green" />
      </div>
      <div className="absolute top-40 right-16 glass-card p-4 w-24 h-24 flex items-center justify-center opacity-50">
        <Target className="h-10 w-10 text-softblue-600" />
      </div>
      <div className="absolute bottom-32 left-20 glass-card p-4 w-16 h-16 flex items-center justify-center opacity-70">
        <Zap className="h-6 w-6 text-nature-600" />
      </div>

      {/* Subtle blur orbs for depth */}
      <div className="absolute top-32 left-1/4 w-32 h-32 bg-nature-green/10 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-40 right-1/4 w-40 h-40 bg-softblue-500/8 rounded-full blur-3xl opacity-50" />

      {/* Central Glass Hero Card */}
      <div className="relative z-10 max-w-5xl mx-auto">
        <GlassCard className="p-8 md:p-12 text-center glass-tint" withTint>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-secondary border border-nature-green/20 mb-8">
            <Sparkles className="h-4 w-4 text-nature-green" />
            <span className="text-sm font-medium text-nature-700">AI-POWERED WELLNESS</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6 text-text-900 leading-tight">
            Transform Your 
            <span className="bg-gradient-to-r from-nature-600 to-softblue-600 bg-clip-text text-transparent">
              Wellness Journey
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-text-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Personalized nutrition, fitness, and mindfulness coaching powered by AI for balanced living.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
            <div className="glass-card-secondary p-4 rounded-lg">
              <Heart className="h-6 w-6 text-nature-green mx-auto mb-2" />
              <p className="text-sm text-text-700 font-medium">Holistic Health</p>
            </div>
            <div className="glass-card-secondary p-4 rounded-lg">
              <Target className="h-6 w-6 text-softblue-600 mx-auto mb-2" />
              <p className="text-sm text-text-700 font-medium">Personal Goals</p>
            </div>
            <div className="glass-card-secondary p-4 rounded-lg">
              <Zap className="h-6 w-6 text-nature-600 mx-auto mb-2" />
              <p className="text-sm text-text-700 font-medium">AI Insights</p>
            </div>
          </div>

          {/* CTA */}
          <Link href="/auth/signup">
            <GlassButton 
              variant="primary" 
              size="lg" 
              className="text-lg px-8 py-4 group transform hover:scale-105 transition-all duration-200"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </GlassButton>
          </Link>

          <p className="text-sm text-text-500 mt-4">Free 14-day trial • No credit card required</p>
        </GlassCard>
      </div>
    </section>
  )
}
