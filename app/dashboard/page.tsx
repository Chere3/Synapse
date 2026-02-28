'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DocumentUpload from '@/components/document-upload'
import DocumentList from '@/components/document-list'
import AnalysisResults from '@/components/analysis-results'
import { RiskAnalysis } from '@/utils/analysis'
import { ChevronLeft, ChevronRight, LogOut, FileText, User } from 'lucide-react'
import ChatInterface from '@/components/chat-interface'
import { Database } from '@/types/supabase'

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
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis')

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNewAnalysis = (analysis: RiskAnalysis[]) => {
    setCurrentAnalysis(analysis)
    setSelectedAnalysis(null)
    setActiveTab('analysis')
  }

  const activeAnalysis = selectedAnalysis?.analysis ?? currentAnalysis
  const activeDocId = selectedAnalysis?.id ?? ''
  const hasAnalysis = !!activeAnalysis

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-md-background">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-md-outline-variant"
            style={{ borderTopColor: 'var(--md-sys-color-primary)' }}
          />
          <p className="text-body-md text-md-on-surface-variant">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-md-background">

      {/* ── Top App Bar ── */}
      <header
        className={`z-40 flex items-center justify-between px-6 py-3 transition-all duration-medium2 md-standard ${
          isScrolled
            ? 'bg-md-surface-2 shadow-md-2'
            : 'bg-md-surface-1'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md-icon-btn"
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          <span
            className="text-title-lg font-bold text-md-primary"
            style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
          >
            Synapse
          </span>
        </div>

        {/* User actions */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md-full bg-md-surface-2 px-4 py-2 sm:flex">
            <User className="h-4 w-4 text-md-on-surface-variant" />
            <span className="text-label-md text-md-on-surface-variant truncate max-w-48">
              {user?.email}
            </span>
          </div>
          <button
            onClick={async () => {
              await supabaseClient.auth.signOut()
              router.push('/auth')
            }}
            className="md-btn-text flex items-center gap-2 text-label-md"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* ── Body: Sidebar + Main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar (Navigation Drawer) ── */}
        <aside
          className={`flex flex-col border-r border-md-outline-variant bg-md-surface transition-all duration-medium3 md-emph-decel ${
            isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-none'
          }`}
          aria-label="Document sidebar"
        >
          {/* Upload section */}
          <div className="border-b border-md-outline-variant p-5">
            <h2
              className="mb-4 text-title-sm text-md-on-surface-variant uppercase tracking-widest"
            >
              New Document
            </h2>
            <DocumentUpload onAnalysisComplete={handleNewAnalysis} />
          </div>

          {/* Document list */}
          <div className="flex flex-1 flex-col overflow-hidden p-5">
            <h2
              className="mb-3 text-title-sm text-md-on-surface-variant uppercase tracking-widest"
            >
              Your Documents
            </h2>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <DocumentList
                onAnalysisSelect={setSelectedAnalysis}
                isCollapsed={false}
              />
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {hasAnalysis ? (
            <>
              {/* Tab bar */}
              <div className="flex border-b border-md-outline-variant bg-md-surface px-6">
                {(['analysis', 'chat'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-5 py-4 text-label-lg transition-colors duration-short4 md-standard capitalize ${
                      activeTab === tab
                        ? 'text-md-primary'
                        : 'text-md-on-surface-variant hover:text-md-on-surface'
                    }`}
                  >
                    {tab === 'analysis' ? 'Analysis Results' : 'Chat with AI'}
                    {activeTab === tab && (
                      <span
                        className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-md-primary"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {activeTab === 'analysis' && (
                  <div className="p-6">
                    <AnalysisResults analysis={activeAnalysis!} />
                  </div>
                )}
                {activeTab === 'chat' && (
                  <div className="flex h-full flex-col p-6">
                    <div className="flex-1 min-h-0 rounded-md-lg border border-md-outline-variant bg-md-surface overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
                      <ChatInterface
                        analysisText={JSON.stringify(activeAnalysis ?? [])}
                        documentId={activeDocId}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-md-full bg-md-surface-variant">
                <FileText className="h-12 w-12 text-md-on-surface-variant" />
              </div>
              <div>
                <h2
                  className="mb-2 text-headline-sm text-md-on-surface"
                  style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
                >
                  No document selected
                </h2>
                <p className="max-w-md text-body-md text-md-on-surface-variant">
                  Upload a new document or select one from your sidebar to view its AI-powered risk analysis.
                </p>
              </div>
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="md-btn-tonal"
                >
                  Open Sidebar
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
