import { Heart, Twitter, Instagram, Linkedin, Mail } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="py-16 px-4 border-t border-border/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Logo className="h-6 w-auto" />
            </div>
            <p className="text-muted-foreground text-pretty max-w-md">
              Your AI-powered wellness companion for balanced living. Track nutrition, fitness, and mindfulness with personalized insights.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/calories" className="hover:text-foreground transition-colors">
                  Calorie Tracking
                </Link>
              </li>
              <li>
                <Link href="/workouts" className="hover:text-foreground transition-colors">
                  Workouts
                </Link>
              </li>
              <li>
                <Link href="/mindfulness" className="hover:text-foreground transition-colors">
                  Mindfulness
                </Link>
              </li>
              <li>
                <Link href="/ai-coach" className="hover:text-foreground transition-colors">
                  AI Coach
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">© 2024 Tranquilae. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="https://instagram.com"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="https://linkedin.com" className="text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:hello@tranquilae.com"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
