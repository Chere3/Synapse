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
      <nav className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-sm' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold text-orange-500 ${DomineFont.className}`}>Synapse</div>
            <div className="flex items-center space-x-4">
              <Link href="/auth" className="text-orange-500 hover:text-orange-400">
                Sign In
              </Link>
              <Link
                href="/auth"
                className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-400"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
        <div className={`h-[1px] bg-black/10 transition-opacity duration-300 ${scrolled ? 'opacity-0' : 'opacity-100'}`}></div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-b from-white/90 via-gray-100/90 to-gray-200/90 pt-20 backdrop-blur-sm">
        {/* Hero Section */}
        <section className="container relative mx-auto px-6 py-32">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
          <div className="relative mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
              <div className="text-left">
                <h1 className={`mb-8 text-6xl font-bold text-gray-900 ${DomineFont.className}`}>
                  Understand your contracts in minutes.
                </h1>
                <p className="mb-8 text-xl text-gray-600">
                  Transform your legal workflow with intelligent document analysis and insights
                </p>
                <Link
                  href="/auth"
                  className="inline-block rounded-lg bg-orange-500 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-orange-400"
                >
                  Start Now
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-float rounded-xl border border-gray-100 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-gray-700">Key Terms</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Contract Duration</span>
                        <span className="text-sm font-medium">2 Years</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payment Terms</span>
                        <span className="text-sm font-medium">Net 30</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Termination</span>
                        <span className="text-sm font-medium">30 Days</span>
                      </div>
                    </div>
                  </div>
                  <div className="animate-float rounded-xl border border-gray-100 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 [animation-delay:200ms] hover:shadow-xl">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-gray-700">Risk Analysis</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Risk Level</span>
                        <span className="text-sm font-medium text-green-600">Low</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Conflicts</span>
                        <span className="text-sm font-medium">None Found</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Compliance</span>
                        <span className="text-sm font-medium text-green-600">100%</span>
                      </div>
                    </div>
                  </div>
                  <div className="animate-float rounded-xl border border-gray-100 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 [animation-delay:400ms] hover:shadow-xl">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium text-gray-700">Clauses</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Confidentiality</span>
                        <span className="text-sm font-medium">✓</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Indemnification</span>
                        <span className="text-sm font-medium">✓</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Force Majeure</span>
                        <span className="text-sm font-medium">✓</span>
                      </div>
                    </div>
                  </div>
                  <div className="animate-float rounded-xl border border-gray-100 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 [animation-delay:600ms] hover:shadow-xl">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-medium text-gray-700">Summary</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Document Type</span>
                        <span className="text-sm font-medium">NDA</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pages</span>
                        <span className="text-sm font-medium">5</span>
                      </div>
                      <div className="flex items-center justify-between">
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
            <h2 className={`mb-12 text-center text-3xl font-bold text-gray-900 ${DomineFont.className}`}>
              Powerful Features for Legal Professionals
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="mb-4 text-2xl text-orange-500">⚡</div>
                <h3 className="mb-2 text-xl font-semibold">Fast Analysis</h3>
                <p className="text-gray-600">
                  Analyze legal documents in seconds with our advanced AI technology
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="mb-4 text-2xl text-orange-500">🔍</div>
                <h3 className="mb-2 text-xl font-semibold">Deep Insights</h3>
                <p className="text-gray-600">
                  Extract key information and identify important clauses automatically
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-6">
                <div className="mb-4 text-2xl text-orange-500">📊</div>
                <h3 className="mb-2 text-xl font-semibold">Smart Analytics</h3>
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
            <h2 className={`mb-6 text-3xl font-bold text-gray-900 ${DomineFont.className}`}>
              Ready to Transform Your Legal Workflow?
            </h2>
            <p className="mb-8 text-xl text-gray-600">
              Join thousands of legal professionals who trust Synapse
            </p>
            <Link
              href="/auth"
              className="inline-block rounded-lg bg-orange-500 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-orange-400"
            >
              Get Started Now
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 py-12 text-white">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div>
                <h3 className={`mb-4 text-xl font-bold ${DomineFont.className}`}>Synapse</h3>
                <p className="text-gray-400">
                  AI-powered legal document analysis platform
                </p>
              </div>
              <div>
                <h4 className={`mb-4 text-lg font-semibold ${DomineFont.className}`}>Product</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-white">Features</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Pricing</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Security</Link></li>
                </ul>
              </div>
              <div>
                <h4 className={`mb-4 text-lg font-semibold ${DomineFont.className}`}>Company</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-white">About</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Careers</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className={`mb-4 text-lg font-semibold ${DomineFont.className}`}>Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-white">Privacy</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Terms</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-400">
              © {new Date().getFullYear()} Synapse. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
