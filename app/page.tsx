'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Domine } from 'next/font/google'

const DomineFont = Domine({ subsets: ['latin'], preload: true})

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Navigation */}
      <nav className={`fixed w-full top-0 left-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-sm' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold text-orange-500 ${DomineFont.className}`}>Synapse Legal</div>
            <div className="flex items-center space-x-4">
              <Link href="/auth" className="text-orange-500 hover:text-orange-400">
                Sign In
              </Link>
              <Link
                href="/auth"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-400 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
        <div className={`h-[1px] bg-black/10 transition-opacity duration-300 ${scrolled ? 'opacity-0' : 'opacity-100'}`}></div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-b from-white/90 via-gray-100/90 to-gray-200/90 backdrop-blur-sm pt-20">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-32 relative">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
          <div className="max-w-7xl mx-auto relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h1 className={`text-6xl font-bold text-gray-900 mb-8 ${DomineFont.className}`}>
                  Understand your contracts in minutes.
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Transform your legal workflow with intelligent document analysis and insights
                </p>
                <Link
                  href="/auth"
                  className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-400 transition-colors inline-block"
                >
                  Start Now
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-float">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-gray-700">Key Terms</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Contract Duration</span>
                        <span className="text-sm font-medium">2 Years</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Payment Terms</span>
                        <span className="text-sm font-medium">Net 30</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Termination</span>
                        <span className="text-sm font-medium">30 Days</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-float [animation-delay:200ms]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-gray-700">Risk Analysis</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Risk Level</span>
                        <span className="text-sm font-medium text-green-600">Low</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Conflicts</span>
                        <span className="text-sm font-medium">None Found</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Compliance</span>
                        <span className="text-sm font-medium text-green-600">100%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-float [animation-delay:400ms]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium text-gray-700">Clauses</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Confidentiality</span>
                        <span className="text-sm font-medium">✓</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Indemnification</span>
                        <span className="text-sm font-medium">✓</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Force Majeure</span>
                        <span className="text-sm font-medium">✓</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-float [animation-delay:600ms]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-medium text-gray-700">Summary</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Document Type</span>
                        <span className="text-sm font-medium">NDA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pages</span>
                        <span className="text-sm font-medium">5</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Analysis Time</span>
                        <span className="text-sm font-medium">2s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-6">
            <h2 className={`text-3xl font-bold text-center text-gray-900 mb-12 ${DomineFont.className}`}>
              Powerful Features for Legal Professionals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-gray-50">
                <div className="text-orange-500 text-2xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2">Fast Analysis</h3>
                <p className="text-gray-600">
                  Analyze legal documents in seconds with our advanced AI technology
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gray-50">
                <div className="text-orange-500 text-2xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">Deep Insights</h3>
                <p className="text-gray-600">
                  Extract key information and identify important clauses automatically
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gray-50">
                <div className="text-orange-500 text-2xl mb-4">📊</div>
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
            <h2 className={`text-3xl font-bold text-gray-900 mb-6 ${DomineFont.className}`}>
              Ready to Transform Your Legal Workflow?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of legal professionals who trust Synapse Legal
            </p>
            <Link
              href="/auth"
              className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-400 transition-colors inline-block"
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
                <h3 className={`text-xl font-bold mb-4 ${DomineFont.className}`}>Synapse Legal</h3>
                <p className="text-gray-400">
                  AI-powered legal document analysis platform
                </p>
              </div>
              <div>
                <h4 className={`text-lg font-semibold mb-4 ${DomineFont.className}`}>Product</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-white">Features</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Pricing</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Security</Link></li>
                </ul>
              </div>
              <div>
                <h4 className={`text-lg font-semibold mb-4 ${DomineFont.className}`}>Company</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-white">About</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Careers</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className={`text-lg font-semibold mb-4 ${DomineFont.className}`}>Legal</h4>
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
      </main>
    </>
  )
}
