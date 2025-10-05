import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          🌿 Tranquilae
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          Your Personal Wellness Journey Companion
        </p>
        <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
          Transform your health and mindfulness with AI-powered coaching, nutrition tracking, and personalized wellness plans.
        </p>
        
        <div className="flex gap-4 justify-center mb-12">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-lg font-medium"
          >
            Log In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold mb-2">Holistic Health</h3>
            <p className="text-gray-600">Track nutrition, fitness, and mindfulness in one place</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Personal Goals</h3>
            <p className="text-gray-600">Set and achieve your wellness objectives</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">AI Insights</h3>
            <p className="text-gray-600">Get personalized recommendations</p>
          </div>
        </div>

        <div className="mt-16 text-sm text-gray-500">
          <p>Free 14-day trial • No credit card required</p>
        </div>
      </div>
    </div>
  )
}
