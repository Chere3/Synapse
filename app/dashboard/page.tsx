'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DocumentUpload from '@/components/document-upload'
import DocumentList from '@/components/document-list'
import { Domine } from 'next/font/google'
import { Database } from '@/types/supabase'
import AnalysisResults from '@/components/analysis-results'
import { RiskAnalysis } from '@/utils/analysis'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ChatInterface from '@/components/chat-interface'

const domine = Domine({preload: true, subsets: ['latin']})

type Analysis = Database['public']['Tables']['analysis']['Row'] & {
  analysis: RiskAnalysis[]
}

export default function DashboardPage() {
  const { user, loading, supabaseClient } = useAuth()
  const router = useRouter()
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)
  const [currentAnalysis, setCurrentAnalysis] = useState<RiskAnalysis[] | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNewAnalysis = (analysis: RiskAnalysis[]) => {
    setCurrentAnalysis(analysis)
    setSelectedAnalysis(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className={`fixed inset-x-0 top-0 z-50 bg-gray-100 transition-all duration-300${isScrolled ? 'bg-gray-100/80 backdrop-blur-md' : ''}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold text-orange-500 ${domine.className}`}>Synapse Legal</div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={async () => {
                  await supabaseClient.auth.signOut()
                  router.push('/auth')
                }}
                className="text-orange-500 hover:text-orange-400"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex h-[calc(100vh-73px)] pt-[73px]">
        {/* Sidebar */}
        <div className={`bg-white transition-all duration-300 ${isSidebarOpen ? 'w-96' : 'w-16'}`}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-4">
              <h2 className={`text-lg font-semibold ${!isSidebarOpen && 'hidden'}`}>Your Documents</h2>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="rounded-lg p-2 hover:bg-gray-50"
              >
                {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            </div>
            <div className="scrollbar-hide flex-1 overflow-y-auto px-4">
              <DocumentList onAnalysisSelect={setSelectedAnalysis} isCollapsed={!isSidebarOpen} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="scrollbar-hide flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="flex gap-8">
              {/* Left Column: Analysis Results */}
              <div className="flex-1">
                <h2 className={`mb-4 text-2xl font-semibold ${domine.className}`}>
                  {selectedAnalysis ? 'Selected Analysis' : (currentAnalysis ? 'Current Document Analysis' : 'Analysis Results')}
                </h2>
                <div className="rounded-lg bg-white p-6">
                  {selectedAnalysis ? (
                    <AnalysisResults analysis={selectedAnalysis.analysis} />
                  ) : (currentAnalysis ? (
                    <AnalysisResults analysis={currentAnalysis} />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-center text-gray-500">No document selected</p>
                      <p className="text-center text-sm text-gray-400">
                        Select a document from the sidebar or upload a new one to view its analysis
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Upload and Chat */}
              <div className="w-96 space-y-8">
                {/* Upload Section */}
                <div>
                  <h2 className={`mb-4 text-2xl font-semibold ${domine.className}`}>Upload New Document</h2>
                  <div className="rounded-lg bg-white p-6">
                    <DocumentUpload onAnalysisComplete={handleNewAnalysis} />
                  </div>
                </div>

                {/* Chat Section */}
                <div>
                  <h2 className={`mb-4 text-2xl font-semibold ${domine.className}`}>Chat with Analysis</h2>
                  <div className="h-[400px] rounded-lg bg-white p-6">
                    <ChatInterface 
                      analysisText={JSON.stringify(selectedAnalysis?.analysis ?? currentAnalysis ?? [])} 
                      documentId={selectedAnalysis?.id ?? ""} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 