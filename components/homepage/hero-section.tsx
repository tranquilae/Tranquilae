"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Reveal animation on mount
    if (heroRef.current) {
      const elements = heroRef.current.querySelectorAll('.reveal-on-scroll')
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('revealed')
        }, index * 150)
      })
    }
  }, [])

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 py-32 overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 gradient-mesh" />
      
      {/* Floating Glass Orbs */}
      <div className="glass-orb w-96 h-96 top-20 -left-48 float opacity-30" style={{animationDelay: '0s'}} />
      <div className="glass-orb w-64 h-64 top-1/3 right-10 float opacity-40" style={{animationDelay: '2s'}} />
      <div className="glass-orb w-80 h-80 bottom-10 left-1/4 float opacity-25" style={{animationDelay: '4s'}} />
      
      {/* Smaller floating orbs */}
      <div className="glass-orb w-32 h-32 top-40 right-1/4 float opacity-20" style={{animationDelay: '1s'}} />
      <div className="glass-orb w-40 h-40 bottom-40 right-20 float opacity-30" style={{animationDelay: '3s'}} />

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        {/* Small badge */}
        <div className="reveal-on-scroll inline-flex items-center gap-2 px-6 py-3 rounded-full liquid-glass mb-8">
          <span className="w-2 h-2 bg-gradient-to-r from-[var(--nature-green)] to-[var(--soft-blue)] rounded-full animate-pulse" />
          <span className="text-sm font-semibold tracking-wider text-foreground/90">AI-POWERED WELLNESS PLATFORM</span>
        </div>

        {/* Main Heading - awsmd.com style */}
        <h1 className="reveal-on-scroll display-xl mb-8 px-4">
          We create <span className="animated-gradient-text">Tranquil</span>
          <br />
          Wellness Experiences
        </h1>

        {/* Subheading */}
        <p className="reveal-on-scroll text-xl md:text-2xl text-foreground/70 mb-12 max-w-3xl mx-auto leading-relaxed px-4">
          Data driven • User focused • Value based
        </p>

        {/* Crystal Ball Buttons */}
        <div className="reveal-on-scroll flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Link href="/auth/signup">
            <button className="crystal-ball-button flex items-center gap-2 px-8 py-4">
              <span>Start Your Journey</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
          
          <Link href="#features">
            <button className="liquid-glass px-8 py-4 rounded-full font-semibold text-foreground/90 hover:scale-105 transition-transform duration-300">
              Explore Features
            </button>
          </Link>
        </div>

        {/* Stats - awsmd.com style */}
        <div className="reveal-on-scroll flex flex-col sm:flex-row gap-8 justify-center items-center">
          <div className="text-center">
            <div className="text-4xl font-bold animated-gradient-text mb-2">4.9</div>
            <div className="text-sm text-foreground/60">User Rating</div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-foreground/20" />
          <div className="text-center">
            <div className="text-4xl font-bold animated-gradient-text mb-2">10k+</div>
            <div className="text-sm text-foreground/60">Active Users</div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-foreground/20" />
          <div className="text-center">
            <div className="text-4xl font-bold animated-gradient-text mb-2">100%</div>
            <div className="text-sm text-foreground/60">Personalized</div>
          </div>
        </div>
      </div>
    </section>
  )
}
