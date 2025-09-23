import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Users, Target, Shield } from "lucide-react"
import { Header } from "@/components/homepage/header"
import { Footer } from "@/components/homepage/footer"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <Header />
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About Tranquilae®
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We're on a mission to make wellness accessible, enjoyable, and sustainable for everyone. 
            Through the power of AI and personalized insights, we're transforming how people approach their health journey.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Link href="/auth/signup">Join Our Community</Link>
          </Button>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              To empower individuals with intelligent, personalized wellness tools that make healthy living 
              simple, sustainable, and rewarding.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="glass-card border-0 p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Health First</h3>
                <p className="text-muted-foreground text-sm">
                  Your health and wellbeing are our top priority in everything we build.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community</h3>
                <p className="text-muted-foreground text-sm">
                  We believe in the power of community support and shared wellness journeys.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Personalized</h3>
                <p className="text-muted-foreground text-sm">
                  Every recommendation is tailored to your unique goals and lifestyle.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Privacy</h3>
                <p className="text-muted-foreground text-sm">
                  Your data is secure and private. We never share your personal information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Our Story</h2>
          </div>

          <div className="prose prose-lg mx-auto text-muted-foreground">
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-card border-0 bg-gradient-to-r from-primary/10 to-secondary/10 p-12">
            <CardContent className="p-0">
              <h2 className="text-3xl font-bold mb-6">Ready to Start Your Wellness Journey?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of others who have transformed their health with Tranquilae.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/auth/signup">Get Started Free</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/#features">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  )
}
