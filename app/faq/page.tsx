"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ArrowLeft } from "lucide-react"

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "What is Tranquilae?",
          a: "Tranquilae is a comprehensive wellness platform that combines fitness tracking, nutrition planning, and mindfulness practices. Our AI-powered system provides personalized recommendations to help you achieve your health goals."
        },
        {
          q: "How do I sign up?",
          a: "Click the 'Get Started' button on our homepage or navigation bar. You can create an account using your email address or sign in with Google, Apple, or Facebook. We offer a 14-day free trial with no credit card required."
        },
        {
          q: "Is there a mobile app?",
          a: "Yes! Tranquilae is available as a progressive web app (PWA) that works seamlessly on both iOS and Android devices. Simply visit our website on your mobile browser and add it to your home screen for an app-like experience."
        }
      ]
    },
    {
      category: "Pricing & Plans",
      questions: [
        {
          q: "What's included in the free Explorer plan?",
          a: "The Explorer plan includes unlimited wellness tracking, basic analytics dashboard, community access, goal mapping, and a mindfulness calendar. It's perfect for getting started with your wellness journey."
        },
        {
          q: "What are the benefits of the Pathfinder plan?",
          a: "The Pathfinder plan (£10.99/month) includes everything in Explorer plus advanced performance metrics, personalized coaching plans, meal analysis, recovery recommendations, unlimited workout types, and data export capabilities."
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: "Yes, you can cancel your subscription at any time with no penalties. Your access will continue until the end of your billing period, and you can downgrade to the free Explorer plan."
        },
        {
          q: "Do you offer student or family discounts?",
          a: "Yes! We offer a 25% discount for verified students and a family plan that covers up to 5 members at a discounted rate. Contact our support team to learn more."
        }
      ]
    },
    {
      category: "Features & Functionality",
      questions: [
        {
          q: "How does the AI coaching work?",
          a: "Our AI analyzes your activity patterns, nutrition data, and wellness goals to provide personalized recommendations. It learns from your progress and adapts suggestions based on your unique needs and preferences."
        },
        {
          q: "Can I track custom workouts?",
          a: "Absolutely! You can create and track custom workouts, including exercises, sets, reps, and rest periods. Our exercise library includes hundreds of movements with instructional videos."
        },
        {
          q: "Does Tranquilae integrate with other fitness apps?",
          a: "Yes, we integrate with popular fitness trackers and apps including Apple Health, Google Fit, Fitbit, Strava, and MyFitnessPal. This allows seamless data synchronization across your wellness ecosystem."
        },
        {
          q: "How accurate is the calorie tracking?",
          a: "Our nutrition database includes over 1 million foods with verified nutritional information. You can also scan barcodes or add custom foods. We use scientifically validated formulas to calculate calorie burn based on your personal metrics."
        }
      ]
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          q: "How is my data protected?",
          a: "We use bank-level encryption (AES-256) to protect your data at rest and in transit. All personal information is stored securely and we never sell your data to third parties. Read our Privacy Policy for full details."
        },
        {
          q: "Can I export my data?",
          a: "Yes, Pathfinder plan members can export all their data in CSV or JSON format at any time. This includes workout history, nutrition logs, and progress metrics."
        },
        {
          q: "Who can see my wellness data?",
          a: "Your data is private by default. You control exactly what information is shared and with whom. You can choose to share progress with friends, join community challenges, or keep everything completely private."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "What if I encounter a bug or issue?",
          a: "Please contact our support team through the in-app chat, email at support@tranquilae.com, or use the contact form on our website. We typically respond within 24 hours on business days."
        },
        {
          q: "Do you offer video tutorials?",
          a: "Yes! We have a comprehensive help center with video tutorials, written guides, and FAQs covering all features of the platform. Access it from the Help menu in your dashboard."
        },
        {
          q: "What browsers and devices are supported?",
          a: "Tranquilae works best on modern browsers including Chrome, Safari, Firefox, and Edge. We support iOS 13+, Android 8+, and all desktop operating systems."
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="glass-orb w-96 h-96 -top-48 -right-48 opacity-20" />
      <div className="glass-orb w-64 h-64 bottom-20 -left-32 opacity-25" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="display-xl mb-6">
            Frequently Asked <span className="animated-gradient-text">Questions</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Everything you need to know about Tranquilae. Can't find what you're looking for?{" "}
            <Link href="/contact" className="text-[var(--nature-green)] hover:underline">
              Contact us
            </Link>
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="section-number mb-6">
                {String(categoryIndex + 1).padStart(2, '0')} — {category.category.toUpperCase()}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 100 + faqIndex
                  const isOpen = openIndex === globalIndex

                  return (
                    <div key={faqIndex} className="liquid-glass overflow-hidden">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-foreground/5 transition-colors"
                      >
                        <span className="text-lg font-semibold text-foreground">
                          {faq.q}
                        </span>
                        <ChevronDown 
                          className={`w-5 h-5 text-foreground/60 flex-shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      <div 
                        className={`transition-all duration-300 ease-in-out ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-6 pb-6 text-foreground/80 leading-relaxed">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center liquid-glass p-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Still have questions?</h2>
          <p className="text-lg text-foreground/70 mb-8">
            Our support team is here to help you with anything you need
          </p>
          <Link href="/contact">
            <button className="crystal-ball-button px-8 py-4">
              Contact Support
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
