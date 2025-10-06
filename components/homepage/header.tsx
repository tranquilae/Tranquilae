"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Logo } from "@/components/logo"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavigation = (anchor: string, e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      const element = document.getElementById(anchor)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      router.push(`/#${anchor}`)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-6">
      <div className={`max-w-7xl mx-auto px-6 py-4 transition-all duration-500 ${
        isScrolled 
          ? "glass-nav shadow-lg" 
          : "bg-background/5 backdrop-blur-sm border border-foreground/5 rounded-[20px]"
      }`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo href="/" className="h-8 w-auto" />

          {/* Navigation Links - Glass style */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/#features"
              onClick={(e) => handleNavigation('features', e)}
              className="px-4 py-2 text-foreground/80 hover:text-foreground font-medium transition-all duration-300 hover:bg-foreground/5 rounded-xl"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              onClick={(e) => handleNavigation('pricing', e)}
              className="px-4 py-2 text-foreground/80 hover:text-foreground font-medium transition-all duration-300 hover:bg-foreground/5 rounded-xl"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 text-foreground/80 hover:text-foreground font-medium transition-all duration-300 hover:bg-foreground/5 rounded-xl"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 text-foreground/80 hover:text-foreground font-medium transition-all duration-300 hover:bg-foreground/5 rounded-xl"
            >
              Contact
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <button className="px-6 py-2 rounded-full text-sm font-semibold text-foreground/80 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 transition-all duration-300 hover:scale-105">
                Log In
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="crystal-ball-button text-sm px-6 py-2">
                Get Started
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden liquid-glass p-3 rounded-full hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
