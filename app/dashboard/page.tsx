'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DocumentUpload from '@/components/document-upload'
import DocumentList from '@/components/document-list'
import AnalysisResults from '@/components/analysis-results'
import { RiskAnalysis } from '@/utils/analysis'
import { ChevronLeft, ChevronRight, LogOut, FileText, User, Sparkles, BarChart2, MessageSquare } from 'lucide-react'
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
        {/* Atmospheric backdrop on loading screen */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
          style={{
            background: [
              'radial-gradient(ellipse 90% 60% at 60% -5%, color-mix(in srgb, var(--md-sys-color-primary-container) 50%, transparent) 0%, transparent 60%)',
              'radial-gradient(ellipse 50% 40% at 10% 100%, color-mix(in srgb, var(--md-sys-color-tertiary-container) 30%, transparent) 0%, transparent 70%)',
            ].join(', '),
          }}
        />
        <div className="relative flex flex-col items-center gap-4">
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

      {/* ── Atmospheric backdrop (matches landing hero) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            'radial-gradient(ellipse 70% 50% at 80% -10%, color-mix(in srgb, var(--md-sys-color-primary-container) 45%, transparent) 0%, transparent 55%)',
            'radial-gradient(ellipse 40% 35% at 0% 100%, color-mix(in srgb, var(--md-sys-color-tertiary-container) 25%, transparent) 0%, transparent 65%)',
            'radial-gradient(ellipse 35% 30% at 100% 80%, color-mix(in srgb, var(--md-sys-color-secondary-container) 20%, transparent) 0%, transparent 65%)',
          ].join(', '),
        }}
      />
      {/* Subtle dot-grid texture — same as landing */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--md-sys-color-on-background) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Top App Bar ── */}
      <header
        className={`relative z-40 flex items-center justify-between px-6 py-3 transition-all duration-medium2 md-standard ${
          isScrolled
            ? 'bg-md-surface-2/90 shadow-md-2 backdrop-blur-md'
            : 'bg-md-surface-1/80 backdrop-blur-sm'
        }`}
        style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
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
          {/* Premium eyebrow badge — mirrors landing trust pill */}
          <div className="hidden items-center gap-1.5 rounded-md-full border border-md-outline-variant bg-md-surface/70 px-3 py-1 text-label-sm text-md-on-surface-variant backdrop-blur-sm sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-md-tertiary" aria-hidden="true" />
            <span>AI Legal Analysis</span>
          </div>
        </div>

        {/* User actions */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md-full border border-md-outline-variant bg-md-surface/70 px-4 py-2 backdrop-blur-sm sm:flex">
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
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── Sidebar (Navigation Drawer) ── */}
        <aside
          className={`flex flex-col border-r border-md-outline-variant bg-md-surface-1/80 backdrop-blur-sm transition-all duration-medium3 md-emph-decel ${
            isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-none'
          }`}
          aria-label="Document sidebar"
        >
          {/* Upload section */}
          <div className="border-b border-md-outline-variant p-5">
            {/* Section eyebrow — matches landing section headers */}
            <div className="mb-4 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md-sm"
                style={{ background: 'var(--md-sys-color-primary-container)' }}
                aria-hidden="true"
              >
                <Sparkles className="h-3.5 w-3.5 text-md-primary" />
              </div>
              <h2 className="text-label-lg font-semibold uppercase tracking-widest text-md-on-surface-variant">
                New Document
              </h2>
            </div>
            <DocumentUpload onAnalysisComplete={handleNewAnalysis} />
          </div>

          {/* Document list */}
          <div className="flex flex-1 flex-col overflow-hidden p-5">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md-sm"
                style={{ background: 'var(--md-sys-color-secondary-container)' }}
                aria-hidden="true"
              >
                <FileText className="h-3.5 w-3.5 text-md-secondary" />
              </div>
              <h2 className="text-label-lg font-semibold uppercase tracking-widest text-md-on-surface-variant">
                Your Documents
              </h2>
            </div>
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
              {/* ── Tab bar — premium M3 style ── */}
              <div
                className="flex border-b border-md-outline-variant bg-md-surface-1/70 px-6 backdrop-blur-sm"
              >
                {(
                  [
                    { id: 'analysis', label: 'Analysis Results', Icon: BarChart2 },
                    { id: 'chat',     label: 'Chat with AI',     Icon: MessageSquare },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`relative flex items-center gap-2 px-5 py-4 text-label-lg transition-colors duration-short4 md-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary ${
                      activeTab === id
                        ? 'text-md-primary'
                        : 'text-md-on-surface-variant hover:text-md-on-surface'
                    }`}
                    aria-selected={activeTab === id}
                    role="tab"
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors duration-short4 ${
                        activeTab === id ? 'text-md-primary' : 'text-md-on-surface-variant'
                      }`}
                      aria-hidden="true"
                    />
                    {label}
                    {/* Active indicator — animated underline */}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-md-primary transition-all duration-medium2 md-standard ${
                        activeTab === id ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                      }`}
                      style={{ transformOrigin: 'center' }}
                    />
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
                    <div
                      className="flex-1 min-h-0 overflow-hidden rounded-md-xl border border-md-outline-variant shadow-md-1"
                      style={{
                        background: 'var(--md-sys-color-surface-1)',
                        height: 'calc(100vh - 220px)',
                      }}
                    >
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
            /* ── Premium empty state — matches landing hero aesthetic ── */
            <div className="flex flex-1 flex-col items-center justify-center gap-8 p-12 text-center">
              {/* Glow card — same shadow/backdrop treatment as landing mockup */}
              <div
                className="relative w-full max-w-md overflow-hidden rounded-md-xl p-8 shadow-md-3"
                style={{
                  background: 'var(--md-sys-color-surface-1)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                }}
              >
                {/* Inner glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-md-xl opacity-40"
                  style={{
                    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--md-sys-color-primary-container) 70%, transparent) 0%, transparent 70%)',
                  }}
                />

                <div className="relative flex flex-col items-center gap-5">
                  {/* Icon in tonal container */}
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-md-full"
                    style={{ background: 'var(--md-sys-color-primary-container)' }}
                  >
                    <FileText className="h-10 w-10 text-md-primary" />
                  </div>

                  <div>
                    <h2
                      className="mb-2 text-headline-sm text-md-on-surface"
                      style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
                    >
                      Ready to analyse
                    </h2>
                    <p className="text-body-md text-md-on-surface-variant">
                      Upload a contract or select one from your sidebar to get an AI-powered risk analysis in seconds.
                    </p>
                  </div>

                  {/* Mini metrics strip — mirrors landing's metric cards in hero mockup */}
                  <div className="grid w-full grid-cols-3 gap-2 text-center">
                    {[
                      { val: '< 30s', label: 'Analysis time' },
                      { val: '94%',   label: 'Accuracy' },
                      { val: '5',     label: 'Risk levels' },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-md-md py-2.5"
                        style={{ background: 'var(--md-sys-color-surface-2)' }}
                      >
                        <p
                          className="text-title-md font-bold text-md-on-surface"
                          style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
                        >
                          {m.val}
                        </p>
                        <p className="text-label-sm text-md-on-surface-variant">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {!isSidebarOpen && (
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="md-btn-tonal mt-1 px-8 py-3"
                    >
                      Open Sidebar to Upload
                    </button>
                  )}
                </div>
              </div>

              {/* Trust strip — SOC 2 badges like landing footer */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {['SOC 2 Type II', 'AES-256 Encryption', 'GDPR Compliant'].map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 rounded-md-full border border-md-outline-variant px-3 py-1 text-label-sm text-md-on-surface-variant"
                    style={{ background: 'var(--md-sys-color-surface-1)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-md-tertiary"><polyline points="20 6 9 17 4 12"/></svg>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
