import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export function TestimonialHeroSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance mb-6">Break Through Your Barriers</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Traditional tracking methods fall short. Tranquilae solves the challenges that hold wellness enthusiasts
            back.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <Card className="glass-card border-0 bg-gradient-to-br from-primary/10 to-secondary/20 p-8">
            <CardContent className="p-0">
              <blockquote className="text-xl md:text-2xl font-medium mb-6 leading-relaxed">
                "Before Tranquilae, I was stuck in the same routine with minimal progress. Now I'm achieving wellness
                goals I never thought possible, with less stress and more enjoyment."
              </blockquote>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Our intelligent algorithms identify patterns in your wellness behavior that you can't see on your own,
                helping you make meaningful adjustments that lead to breakthrough results.
              </p>

              <Button variant="outline" className="group bg-transparent">
                Read more
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden">
              <Image src="/confident-person-in-workout-clothes-outdoors.jpg" alt="Success story" width={400} height={400} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
              <span className="font-medium">Emma Chen, 34 years old</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
