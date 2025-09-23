"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Logo } from "@/components/logo"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/5" : "bg-transparent"
      }`}
    >
      <div className="mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo href="/" className="h-8 w-auto drop-shadow-sm" />

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/features"
              className="text-foreground/90 hover:text-foreground transition-colors duration-200 drop-shadow-sm"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-foreground/90 hover:text-foreground transition-colors duration-200 drop-shadow-sm"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-foreground/90 hover:text-foreground transition-colors duration-200 drop-shadow-sm"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-foreground/90 hover:text-foreground transition-colors duration-200 drop-shadow-sm"
            >
              Contact
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              asChild
              className="text-foreground/90 hover:text-foreground hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105"
            >
              <Link href="/auth/login">Log In</Link>
            </Button>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm hover:scale-105 transform"
            >
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-foreground/90 hover:text-foreground hover:bg-white/20 backdrop-blur-sm border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </div>
    </header>
  )
}
