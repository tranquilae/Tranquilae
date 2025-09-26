import GlassCard, { GlassCardContent } from "@/components/ui/glass-card"
import GlassButton from "@/components/ui/glass-button"
import { Check, Sparkles, Crown, Star } from "lucide-react"
import Link from "next/link"

export function PricingSection() {
  const plans = [
    {
      name: "Explorer",
      price: "Free",
      period: "",
      description: "Essential tracking for casual wellness",
      icon: Sparkles,
      features: [
        "Unlimited wellness tracking",
        "Basic analytics dashboard",
        "Community access",
        "Goal mapping",
        "Mindfulness calendar",
      ],
      cta: "Let's get started!",
      href: "/auth/signup?plan=explorer",
    },
    {
      name: "Pathfinder",
      price: "£10.99",
      period: "/month",
      description: "Advanced analytics for serious wellness",
      icon: Crown,
      features: [
        "All Explorer features",
        "Advanced performance metrics",
        "Personalized coaching plans",
        "Meal analysis",
        "Recovery recommendations",
        "Unlimited workout types",
        "Export data to other platforms",
      ],
      cta: "Try 14 days for free",
      href: "/auth/signup?plan=pathfinder",
    },
  ]

  return (
    <section id="pricing" className="py-20 px-4 relative">
      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-nature-green/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-softblue-500/5 rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance mb-6 text-text-900">
            Choose Your 
            <span className="bg-gradient-to-r from-nature-600 to-softblue-600 bg-clip-text text-transparent">
              Wellness Path
            </span>
          </h2>
          <p className="text-lg text-text-600">Start your journey with a free 14-day trial • No credit card required</p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <GlassCard className="p-1 inline-flex items-center" variant="secondary">
            <button className="px-6 py-2 rounded-full bg-nature-green text-white text-sm font-medium transition-all">
              Monthly
            </button>
            <button className="px-6 py-2 rounded-full text-sm font-medium text-text-600 hover:text-text-900 transition-colors">
              Yearly (save 17%)
            </button>
          </GlassCard>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const isPopular = plan.name === 'Pathfinder';
            const IconComponent = plan.icon;
            
            return (
              <GlassCard 
                key={index} 
                className={`p-8 relative transition-all duration-300 hover:scale-105 ${
                  isPopular ? 'ring-2 ring-nature-green/20' : ''
                }`}
                withTint={isPopular}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-nature-green text-white px-4 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <GlassCardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl glass-card-secondary flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-nature-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-text-900">{plan.name}</h3>
                      <p className="text-sm text-text-600">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-text-900">
                      {plan.price}
                      <span className="text-lg font-normal text-text-600">{plan.period}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link href={plan.href} className="block mb-8">
                    <GlassButton 
                      variant={isPopular ? "primary" : "secondary"} 
                      size="lg" 
                      className="w-full text-base py-3 transform hover:scale-105 transition-all duration-200"
                    >
                      {plan.cta}
                    </GlassButton>
                  </Link>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-nature-green flex-shrink-0" />
                        <span className="text-sm text-text-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCardContent>
              </GlassCard>
            )}
          )}
        </div>

        {/* Testimonial Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <GlassCard className="overflow-hidden glass-tint" withTint>
            <GlassCardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-8">
                  <div className="mb-4">
                    <div className="text-sm text-nature-700 mb-2 font-medium">Sarah Mitchell</div>
                    <div className="text-xs text-text-600">London City Marathon Club</div>
                  </div>

                  <div className="text-6xl font-bold text-nature-green/20 mb-4">״</div>

                  <blockquote className="text-lg mb-6 text-text-800 leading-relaxed">
                    "The advanced metrics in the Pathfinder plan helped me qualify for London. The recovery
                    recommendations are game-changing."
                  </blockquote>

                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-nature-green text-nature-green" />
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-1/3 relative min-h-[200px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-nature-green/10 to-softblue-500/10 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full glass-card-secondary flex items-center justify-center">
                      <Crown className="h-16 w-16 text-nature-green/60" />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
