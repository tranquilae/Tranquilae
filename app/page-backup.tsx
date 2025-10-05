// Backup of original page
import { Header } from "@/components/homepage/header"
import { HeroSection } from "@/components/homepage/hero-section"
import { FeaturesSection } from "@/components/homepage/features-section"
import { AdditionalFeaturesSection } from "@/components/homepage/additional-features-section"
import { PricingSection } from "@/components/homepage/pricing-section"
import { TestimonialHeroSection } from "@/components/homepage/testimonial-hero-section"
import { FAQSection } from "@/components/homepage/faq-section"
import { TestimonialsSection } from "@/components/homepage/testimonials-section"
import { Footer } from "@/components/homepage/footer"
import { Diagnostics } from "@/components/diagnostics"
import AccessibilityControls from "@/components/ui/accessibility-controls"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream relative">
      {/* Liquid Glass Background - Subtle nature gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-nature-50/30 via-transparent to-softblue-50/20 pointer-events-none" />
      
      <Header />
      <main className="relative">
        <HeroSection />
        <FeaturesSection />
        <AdditionalFeaturesSection />
        <PricingSection />
        <TestimonialHeroSection />
        <FAQSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <Diagnostics />
      <AccessibilityControls />
    </div>
  )
}
