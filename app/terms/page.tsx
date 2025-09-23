import { Card, CardContent } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            These terms govern your use of Tranquilae and its services. 
            Please read them carefully.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: December 2024
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card border-0 p-8">
            <CardContent className="p-0 prose prose-lg max-w-none">
              <h2>Acceptance of Terms</h2>
              <p>
                By accessing or using Tranquilae's services, you agree to be bound by these Terms of Service 
                and our Privacy Policy. If you do not agree to these terms, you may not use our services.
              </p>

              <h2>Description of Service</h2>
              <p>
                Tranquilae is an AI-powered wellness platform that provides:
              </p>
              <ul>
                <li>Nutrition and calorie tracking tools</li>
                <li>Fitness and exercise guidance</li>
                <li>Mindfulness and meditation features</li>
                <li>Personalized wellness recommendations</li>
                <li>Progress tracking and analytics</li>
              </ul>

              <h2>User Accounts</h2>
              <p>
                To use our services, you must create an account and provide accurate information. 
                You are responsible for:
              </p>
              <ul>
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and up-to-date information</li>
              </ul>

              <h2>Acceptable Use</h2>
              <p>
                You agree to use our services only for lawful purposes and in accordance with these terms. 
                You may not:
              </p>
              <ul>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful or malicious content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the service's operation</li>
                <li>Use the service for commercial purposes without permission</li>
              </ul>

              <h2>Health Information Disclaimer</h2>
              <p>
                <strong>Important:</strong> Tranquilae is not a medical service and should not replace 
                professional medical advice, diagnosis, or treatment. Our recommendations are for 
                informational purposes only.
              </p>
              <ul>
                <li>Always consult healthcare professionals for medical advice</li>
                <li>Do not ignore professional medical advice based on our content</li>
                <li>Seek immediate medical attention for health emergencies</li>
                <li>We are not liable for any health-related decisions based on our service</li>
              </ul>

              <h2>Subscription and Payments</h2>
              <p>
                Some features require a paid subscription:
              </p>
              <ul>
                <li>Subscription fees are billed in advance</li>
                <li>Automatic renewal unless cancelled</li>
                <li>No refunds for partial subscription periods</li>
                <li>We may change subscription prices with notice</li>
                <li>Payment processing is handled securely by Stripe</li>
              </ul>

              <h2>Intellectual Property</h2>
              <p>
                The Tranquilae service and its content are protected by copyright, trademark, 
                and other intellectual property laws:
              </p>
              <ul>
                <li>We own or license all content, features, and functionality</li>
                <li>You may not reproduce, distribute, or create derivative works</li>
                <li>User-generated content remains your property</li>
                <li>You grant us a license to use your content for service operation</li>
              </ul>

              <h2>Privacy and Data</h2>
              <p>
                Your privacy is important to us. Our Privacy Policy explains how we collect, 
                use, and protect your information. By using our service, you consent to our 
                data practices as described in the Privacy Policy.
              </p>

              <h2>Service Availability</h2>
              <p>
                We strive to provide reliable service but cannot guarantee uninterrupted access:
              </p>
              <ul>
                <li>Services may be unavailable due to maintenance or technical issues</li>
                <li>We may modify or discontinue features with notice</li>
                <li>No guarantee of compatibility with all devices or browsers</li>
                <li>Third-party integrations may affect service availability</li>
              </ul>

              <h2>Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Tranquilae and its affiliates shall not be liable for:
              </p>
              <ul>
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>Service interruptions or technical failures</li>
                <li>Actions taken based on our recommendations</li>
              </ul>
              <p>
                Our total liability shall not exceed the amount paid by you in the past 12 months.
              </p>

              <h2>Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Tranquilae from any claims, damages, 
                or expenses arising from your use of the service or violation of these terms.
              </p>

              <h2>Termination</h2>
              <p>
                Either party may terminate your account:
              </p>
              <ul>
                <li>You may cancel your account at any time through settings</li>
                <li>We may suspend or terminate accounts for terms violations</li>
                <li>Upon termination, your right to use the service ends immediately</li>
                <li>We may delete your data according to our retention policy</li>
              </ul>

              <h2>Governing Law</h2>
              <p>
                These terms are governed by the laws of the United Kingdom. 
                Any disputes will be resolved in UK courts.
              </p>

              <h2>Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of the service 
                after changes constitutes acceptance of the new terms. We will notify users 
                of material changes.
              </p>

              <h2>Contact Information</h2>
              <p>
                If you have questions about these terms, please contact us:
              </p>
              <p>
                Email: <a href="mailto:legal@tranquilae.com" className="text-primary hover:text-primary/80">legal@tranquilae.com</a><br />
                Address: London, United Kingdom
              </p>

              <h2>Severability</h2>
              <p>
                If any provision of these terms is found to be unenforceable, 
                the remaining provisions will continue in full force and effect.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
