import GlassCard, { GlassCardContent } from "@/components/ui/glass-card"
import GlassButton from "@/components/ui/glass-button"
import { Heart, Users, Target, Shield, Sparkles } from "lucide-react"
import { Header } from "@/components/homepage/header"
import { Footer } from "@/components/homepage/footer"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream relative">
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-nature-50/20 via-transparent to-softblue-50/15 pointer-events-none" />
      
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        {/* Floating glass elements */}
        <div className="absolute top-20 left-20 w-16 h-16 glass-card rounded-full opacity-30" />
        <div className="absolute bottom-10 right-20 w-24 h-24 glass-card rounded-full opacity-25" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <GlassCard className="p-12 glass-tint" withTint>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-secondary border border-nature-green/20 mb-8">
              <Sparkles className="h-4 w-4 text-nature-green" />
              <span className="text-sm font-medium text-nature-700">OUR STORY</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-text-900">
              About 
              <span className="bg-gradient-to-r from-nature-600 to-softblue-600 bg-clip-text text-transparent">
                Tranquilae®
              </span>
            </h1>
            
            <p className="text-xl text-text-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to make wellness accessible, enjoyable, and sustainable for everyone. 
              Through the power of AI and personalized insights, we're transforming how people approach their health journey.
            </p>
            
            <Link href="/auth/signup">
              <GlassButton variant="primary" size="lg" className="transform hover:scale-105 transition-all duration-200">
                Join Our Community
              </GlassButton>
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 relative">
        {/* Background elements */}
        <div className="absolute top-40 right-10 w-32 h-32 bg-softblue-500/5 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-text-900">
              Our 
              <span className="bg-gradient-to-r from-nature-600 to-softblue-600 bg-clip-text text-transparent">
                Mission
              </span>
            </h2>
            <p className="text-lg text-text-600 max-w-3xl mx-auto">
              To empower individuals with intelligent, personalized wellness tools that make healthy living 
              simple, sustainable, and rewarding.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <GlassCard className="p-6 text-center hover:scale-105 transition-all duration-300">
              <GlassCardContent className="p-0">
                <div className="w-16 h-16 rounded-full glass-card-secondary flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-nature-green" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-text-900">Health First</h3>
                <p className="text-text-600 text-sm">
                  Your health and wellbeing are our top priority in everything we build.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard className="p-6 text-center hover:scale-105 transition-all duration-300">
              <GlassCardContent className="p-0">
                <div className="w-16 h-16 rounded-full glass-card-secondary flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-softblue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-text-900">Community</h3>
                <p className="text-text-600 text-sm">
                  We believe in the power of community support and shared wellness journeys.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard className="p-6 text-center hover:scale-105 transition-all duration-300">
              <GlassCardContent className="p-0">
                <div className="w-16 h-16 rounded-full glass-card-secondary flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-nature-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-text-900">Personalized</h3>
                <p className="text-text-600 text-sm">
                  Every recommendation is tailored to your unique goals and lifestyle.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard className="p-6 text-center hover:scale-105 transition-all duration-300">
              <GlassCardContent className="p-0">
                <div className="w-16 h-16 rounded-full glass-card-secondary flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-softblue-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-text-900">Privacy</h3>
                <p className="text-text-600 text-sm">
                  Your data is secure and private. We never share your personal information.
                </p>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 relative">
        {/* Background elements */}
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-nature-green/5 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-text-900">
              Our 
              <span className="bg-gradient-to-r from-nature-600 to-softblue-600 bg-clip-text text-transparent">
                Story
              </span>
            </h2>
          </div>

          <GlassCard className="p-12">
            <GlassCardContent className="p-0">
              <div className="space-y-6 text-text-700 text-lg leading-relaxed">
                <p>
                  Tranquilae was born from a simple observation: wellness shouldn't be complicated. 
                  Our founders, frustrated by confusing apps and one-size-fits-all solutions, set out 
                  to create something different.
                </p>
                <p>
                  We believe that everyone deserves access to personalized wellness guidance, 
                  whether you're just starting your journey or you're an experienced health enthusiast. 
                  By combining artificial intelligence with human-centered design, we've created 
                  a platform that adapts to you, not the other way around.
                </p>
                <p>
                  Today, Tranquilae serves thousands of users worldwide, helping them track their 
                  nutrition, stay active, practice mindfulness, and achieve their wellness goals 
                  with confidence and joy.
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard className="p-12 glass-tint" withTint>
            <GlassCardContent className="p-0">
              <h2 className="text-3xl font-bold mb-6 text-text-900">Ready to Start Your Wellness Journey?</h2>
              <p className="text-lg text-text-600 mb-8">
                Join thousands of others who have transformed their health with Tranquilae.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <GlassButton variant="primary" size="lg" className="transform hover:scale-105 transition-all duration-200">
                    Get Started Free
                  </GlassButton>
                </Link>
                <Link href="/#features">
                  <GlassButton variant="secondary" size="lg" className="transform hover:scale-105 transition-all duration-200">
                    Learn More
                  </GlassButton>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </section>
      <Footer />
    </div>
  )
}
