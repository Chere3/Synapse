'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-900">Synapse Legal</div>
          <div className="flex items-center space-x-4">
            <Link href="/auth" className="text-blue-900 hover:text-blue-700">
              Sign In
            </Link>
            <Link
              href="/auth"
              className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Legal Document Analysis
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your legal workflow with intelligent document analysis and insights
          </p>
          <Link
            href="/auth"
            className="bg-blue-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-800 transition-colors inline-block"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features for Legal Professionals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gray-50">
              <div className="text-blue-900 text-2xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Fast Analysis</h3>
              <p className="text-gray-600">
                Analyze legal documents in seconds with our advanced AI technology
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50">
              <div className="text-blue-900 text-2xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Deep Insights</h3>
              <p className="text-gray-600">
                Extract key information and identify important clauses automatically
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50">
              <div className="text-blue-900 text-2xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
              <p className="text-gray-600">
                Get comprehensive analytics and reports on your legal documents
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Legal Workflow?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of legal professionals who trust Synapse Legal
          </p>
          <Link
            href="/auth"
            className="bg-blue-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-800 transition-colors inline-block"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Synapse Legal</h3>
              <p className="text-gray-400">
                AI-powered legal document analysis platform
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Careers</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
        </div>
        <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Terms</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            © {new Date().getFullYear()} Synapse Legal. All rights reserved.
          </div>
        </div>
      </footer>
      </div>
  )
}
