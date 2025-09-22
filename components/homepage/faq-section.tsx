"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, X } from "lucide-react"
import { useState } from "react"

export function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)

  const faqs = [
    {
      question: "What features does the app offer?",
      answer:
        "Our app provides wellness tracking, nutrition logging, goal setting, progress visualization, mindfulness reminders, and social sharing to help you achieve your health goals.",
    },
    {
      question: "Is the app suitable for beginners?",
      answer:
        "Tranquilae is designed for users of all levels, from wellness beginners to health enthusiasts, with intuitive features and guided onboarding.",
    },
    {
      question: "How does the app track my activities?",
      answer:
        "We integrate with popular wearables and health apps, plus offer manual logging options for comprehensive activity and nutrition tracking.",
    },
    {
      question: "Can I set personalized wellness goals?",
      answer:
        "Yes! Set custom goals for nutrition, exercise, mindfulness, and overall wellness. Our AI coaching adapts to help you achieve them.",
    },
    {
      question: "Is my data safe and private?",
      answer:
        "Your privacy is our priority. We use enterprise-grade encryption and never share your personal health data with third parties.",
    },
    {
      question: "Can I share my progress with friends?",
      answer:
        "Yes! Connect with friends, share achievements, and join our supportive wellness community for motivation and accountability.",
    },
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-balance mb-6">Because Every Step Deserves a Question!</h2>
          <p className="text-lg text-muted-foreground">
            From wellness tips to privacy policies, we're here to answer it all with a smile.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="glass-card border-0">
              <CardContent className="p-0">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  {openFAQ === index ? (
                    <X className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
