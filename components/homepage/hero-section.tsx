import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10" />
      <div className="absolute inset-0 bg-[url('/calm-nature-background-with-soft-leaves.jpg')] bg-cover bg-center opacity-10" />

      <div className="absolute top-20 left-10 w-24 h-24 rounded-full overflow-hidden opacity-20 blur-sm">
        <img src="/woman-preparing-healthy-smoothie-bowl.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-40 right-16 w-32 h-32 rounded-full overflow-hidden opacity-15 blur-sm">
        <img src="/group-doing-outdoor-yoga-class.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-32 left-20 w-28 h-28 rounded-full overflow-hidden opacity-20 blur-sm">
        <img src="/person-running-on-scenic-trail.jpg" alt="" className="w-full h-full object-cover" />
      </div>

      {/* Decorative elements inspired by Farway's pink clouds */}
      <div className="absolute top-20 left-10 w-32 h-16 bg-primary/20 rounded-full blur-xl opacity-60" />
      <div className="absolute top-32 right-20 w-24 h-12 bg-secondary/30 rounded-full blur-lg opacity-50" />
      <div className="absolute bottom-40 right-10 w-40 h-20 bg-primary/15 rounded-full blur-2xl opacity-40" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">AI-POWERED WELLNESS</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-balance mb-6 text-foreground">
          Transform Your Wellness Journey
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Personalized nutrition, fitness, and mindfulness coaching powered by AI for balanced living.
        </p>

        <p className="text-xl md:text-2xl text-foreground text-pretty mb-12 max-w-3xl mx-auto leading-relaxed">
          Tranquilae® combines cutting-edge AI with holistic wellness principles to create your perfect health companion. Track calories, plan workouts, practice mindfulness, and receive personalized insights that adapt to your unique lifestyle. Whether you're starting your wellness journey or optimizing your routine, our intelligent platform guides you toward sustainable, lasting change.
        </p>

        <Link href="/auth/signup">
          <Button size="lg" className="text-lg px-8 py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl transform group">
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
