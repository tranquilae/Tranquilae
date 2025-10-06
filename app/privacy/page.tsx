"use client"

import { Header } from "@/components/homepage/header"
import { Footer } from "@/components/homepage/footer"
import Link from "next/link"
import { ArrowLeft, Lock, Eye, Shield } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="glass-orb w-96 h-96 -top-48 -left-48 opacity-20" />
      <div className="glass-orb w-64 h-64 bottom-20 -right-32 opacity-25" />

      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full liquid-glass mb-6">
              <Lock className="w-5 h-5 text-[var(--soft-blue)]" />
              <span className="text-sm font-semibold tracking-wider">YOUR PRIVACY MATTERS</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              Privacy <span className="animated-gradient-text">Policy</span>
            </h1>
            <p className="text-xl text-foreground/70 mb-4 max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, 
              use, and protect your personal information.
            </p>
            <p className="text-sm text-foreground/50">
              Last updated: December 2024
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-12 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="liquid-glass p-8 md:p-12">
            <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-li:text-foreground/80 prose-strong:text-foreground">
              <h2>Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, 
                update your profile, track your wellness metrics, or contact us for support.
              </p>
              
              <h3>Personal Information</h3>
              <ul>
                <li>Name and contact information (email address)</li>
                <li>Health and fitness data you choose to track</li>
                <li>Profile information and preferences</li>
                <li>Communications with our support team</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <ul>
                <li>Usage information and app interactions</li>
                <li>Device information and identifiers</li>
                <li>Log data and analytics</li>
              </ul>

              <h2>How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <ul>
                <li>Provide personalized wellness recommendations</li>
                <li>Track your progress and generate insights</li>
                <li>Send you updates and notifications</li>
                <li>Provide customer support</li>
                <li>Improve our services and develop new features</li>
              </ul>

              <h2>Information Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. 
                We may share your information only in the following circumstances:
              </p>
              <ul>
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>In connection with a business transaction (merger, acquisition)</li>
              </ul>

              <h2>Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure data storage with Supabase</li>
              </ul>

              <h2>Your Rights</h2>
              <p>
                You have certain rights regarding your personal information:
              </p>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Export your data in a common format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>

              <h2>Data Retention</h2>
              <p>
                We retain your personal information only for as long as necessary to provide 
                our services or as required by law. You can request deletion of your account 
                and associated data at any time.
              </p>

              <h2>Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to improve your experience:
              </p>
              <ul>
                <li>Essential cookies for app functionality</li>
                <li>Analytics cookies to understand usage patterns</li>
                <li>Preference cookies to remember your settings</li>
              </ul>

              <h2>Third-Party Services</h2>
              <p>
                Our app may integrate with third-party services with their own privacy policies:
              </p>
              <ul>
                <li>Supabase (database and authentication)</li>
                <li>Stripe (payment processing)</li>
                <li>Analytics providers</li>
              </ul>

              <h2>Children's Privacy</h2>
              <p>
                Our services are not intended for children under 13. We do not knowingly 
                collect personal information from children under 13. If we become aware 
                that we have collected such information, we will take steps to delete it promptly.
              </p>

              <h2>International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than 
                your own. We ensure appropriate safeguards are in place to protect your data.
              </p>

              <h2>Updates to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of 
                any material changes by posting the new policy on this page and updating 
                the "Last updated" date.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our data practices, 
                please contact us at:
              </p>
              <p>
                Email: <a href="mailto:privacy@tranquilae.com" className="text-primary hover:text-primary/80">privacy@tranquilae.com</a><br />
                Address: London, United Kingdom
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
