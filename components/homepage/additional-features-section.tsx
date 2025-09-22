import { Card, CardContent } from "@/components/ui/card"
import { Activity, Users, Mountain } from "lucide-react"

export function AdditionalFeaturesSection() {
  const features = [
    {
      title: "Wellness Excellence",
      description:
        "Precision tracking of nutrition, exercise, and mindfulness. Get personalized coaching to improve overall wellbeing and vitality.",
      icon: Activity,
      image: "/person-doing-yoga-in-nature.jpg",
    },
    {
      title: "Complete Health Integration",
      description:
        "Integrate nutrition, fitness, and mental wellness. Monitor all aspects to optimize your health performance.",
      icon: Users,
      image: "/healthy-meal-prep-and-workout-equipment.jpg",
    },
    {
      title: "Mindful Living",
      description: "Discover balance, track meditation, and share wellness journeys with the Tranquilae community.",
      icon: Mountain,
      image: "/peaceful-mountain-landscape-meditation.jpg",
    },
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance mb-6">
            Elevate every step, from data to discovery.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're training for wellness goals or enjoying mindful living, Tranquilae adapts to your unique
            health journey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glass-card border-0 overflow-hidden group hover:scale-105 transition-transform duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={feature.image || "/placeholder.svg"}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <h3 className="text-2xl md:text-3xl font-bold">Elevate every step, from data to discovery.</h3>
        </div>
      </div>
    </section>
  )
}
