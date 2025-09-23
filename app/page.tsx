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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <Header />
      <div>
        <HeroSection />
        <FeaturesSection />
        <AdditionalFeaturesSection />
        <PricingSection />
        <TestimonialHeroSection />
        <FAQSection />
        <TestimonialsSection />
        <Footer />
      </div>
      <Diagnostics />
    </div>
  )
}
