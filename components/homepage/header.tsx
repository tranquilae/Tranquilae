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
      <div className={`max-w-7xl mx-auto glass-nav px-6 py-4 transition-all duration-500 ${
        isScrolled ? "scale-100 opacity-100" : "scale-100 opacity-90"
      }`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo href="/" className="h-8 w-auto" />

          {/* Navigation Links - Glass style */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/#features"
              onClick={(e) => handleNavigation('features', e)}
              className="glass-nav-item"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              onClick={(e) => handleNavigation('pricing', e)}
              className="glass-nav-item"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="glass-nav-item"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="glass-nav-item"
            >
              Contact
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <button className="liquid-glass px-6 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform">
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
