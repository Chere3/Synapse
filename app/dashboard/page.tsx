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

const domine = Domine({preload: true, subsets: ['latin']})

type Analysis = Database['public']['Tables']['analysis']['Row'] & {
  analysis: RiskAnalysis[]
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold text-orange-500 ${domine.className}`}>Synapse Legal</div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={() => router.push('/auth')}
                className="text-orange-500 hover:text-orange-400"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <h1 className={`text-5xl font-bold text-gray-900 ${domine.className} mb-8`}>Dashboard</h1>
        
        <div className="flex flex-col space-y-8">
          {/* Analysis Results Section - Full Width */}
          <div className="w-full">
            <h2 className={`text-2xl font-semibold mb-4 ${domine.className}`}>Analysis Results</h2>
            <div className="bg-white rounded-lg shadow p-6">
              {selectedAnalysis ? (
                <AnalysisResults analysis={selectedAnalysis.analysis} />
              ) : (
                <p className="text-gray-500 text-center">Select a document to view its analysis</p>
              )}
            </div>
          </div>

          {/* Documents and Upload Section - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className={`text-2xl font-semibold mb-4 ${domine.className}`}>Your Documents</h2>
              <DocumentList onAnalysisSelect={setSelectedAnalysis} />
            </div>
            
            <div>
              <h2 className={`text-2xl font-semibold mb-4 ${domine.className}`}>Upload New Document</h2>
              <DocumentUpload />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 