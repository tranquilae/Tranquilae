import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Fitness Enthusiast",
      content:
        "Tranquilae has completely transformed my approach to wellness. The AI coaching feels personal and the tracking is effortless.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Busy Professional",
      content:
        "Finally, a health app that understands my lifestyle. The mindfulness features help me stay centered during hectic days.",
      rating: 5,
    },
    {
      name: "Emma Williams",
      role: "Wellness Coach",
      content:
        "I recommend Tranquilae to all my clients. The integration with wearables and comprehensive tracking is unmatched.",
      rating: 5,
    },
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance mb-6">Loved by wellness enthusiasts</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Join thousands who have transformed their health journey with Tranquilae.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="glass-card border-0">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 text-pretty">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
