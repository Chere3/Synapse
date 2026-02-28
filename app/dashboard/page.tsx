'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DocumentUpload from '@/components/document-upload'
import DocumentList from '@/components/document-list'
import ChatInterface from '@/components/chat-interface'
import { RiskAnalysis } from '@/utils/analysis'
import { Database } from '@/types/supabase'
import { ChevronLeft, ChevronRight, LogOut, FileText, User, Sparkles, MessageSquare, Download, Share2, X } from 'lucide-react'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type Analysis = Database['public']['Tables']['analysis']['Row'] & {
  analysis: RiskAnalysis[]
}

// ─────────────────────────────────────────────────────────
// Risk helpers — map riskLevel 1-5 to demo's 3-tier visual
// ─────────────────────────────────────────────────────────
type DemoTier = 'low' | 'medium' | 'high'

function toTier(level: number): DemoTier {
  if (level <= 2) return 'low'
  if (level <= 3) return 'medium'
  return 'high'
}

const TIER_CONFIG: Record<DemoTier, {
  label: string
  dot: string
  badge: string
  bar: string
  barPct: number
}> = {
  low:    { label: 'Low Risk',    dot: 'bg-md-tertiary',  badge: 'bg-md-tertiary-container text-md-on-tertiary-container',   bar: 'bg-md-tertiary',  barPct: 22 },
  medium: { label: 'Medium Risk', dot: 'bg-md-secondary', badge: 'bg-md-secondary-container text-md-on-secondary-container', bar: 'bg-md-secondary', barPct: 55 },
  high:   { label: 'High Risk',   dot: 'bg-md-error',     badge: 'bg-md-error-container text-md-on-error-container',         bar: 'bg-md-error',     barPct: 88 },
}

/** Convert avg riskLevel (1-5) to 0-100 score for the dial */
function toScore(avgLevel: number): number {
  return Math.round(((avgLevel - 1) / 4) * 80 + 10)
}

// ─────────────────────────────────────────────────────────
// Animated progress bar (identical to demo)
// ─────────────────────────────────────────────────────────
function RiskBar({ value, colorClass }: { value: number; colorClass: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300)
    return () => clearTimeout(t)
  }, [value])
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-md-surface-variant">
      <div
        className={`h-full rounded-full transition-all ${colorClass}`}
        style={{ width: `${width}%`, transitionDuration: '1200ms', transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Clause row — same structure as demo, real data wired in
// ─────────────────────────────────────────────────────────
function ClauseRow({ item, index }: { item: RiskAnalysis; index: number }) {
  const tier = toTier(item.riskLevel)
  const cfg = TIER_CONFIG[tier]
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400 + index * 180)
    return () => clearTimeout(t)
  }, [index])
  return (
    <div
      className="flex items-start gap-3 transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)' }}
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-body-sm text-md-on-surface leading-relaxed [overflow-wrap:anywhere]"
            title={item.clause}
          >
            {item.clause}
          </p>
          <span className={`shrink-0 rounded-md-full px-2 py-0.5 text-label-sm font-medium ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-body-sm text-md-on-surface-variant leading-relaxed [overflow-wrap:anywhere]">
          {item.explanation}
        </p>
        <RiskBar value={cfg.barPct} colorClass={cfg.bar} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Circular risk score dial (identical to demo)
// ─────────────────────────────────────────────────────────
function RiskDial({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 500)
    return () => clearTimeout(t)
  }, [score])

  const radius = 36
  const circ = 2 * Math.PI * radius
  const dash = circ * (animated / 100)
  const gap = circ - dash

  const color =
    score < 35 ? 'var(--md-sys-color-tertiary)' :
    score < 65 ? 'var(--md-sys-color-secondary)' :
    'var(--md-sys-color-error)'
  const label = score < 35 ? 'Low Risk' : score < 65 ? 'Medium Risk' : 'High Risk'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="var(--md-sys-color-surface-variant)" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.34,1.2,0.64,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-title-lg font-bold text-md-on-surface" style={{ lineHeight: 1 }}>{animated}</span>
          <span className="text-label-sm text-md-on-surface-variant">/100</span>
        </div>
      </div>
      <span className="text-label-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Status badge (real state wired in)
// ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'analysing' | 'complete' }) {
  return status === 'analysing' ? (
    <span className="inline-flex items-center gap-1.5 rounded-md-full bg-md-secondary-container px-3 py-1 text-label-sm text-md-on-secondary-container">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-md-secondary" />
      Analysing document…
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md-full bg-md-tertiary-container px-3 py-1 text-label-sm text-md-on-tertiary-container">
      <span className="h-1.5 w-1.5 rounded-full bg-md-tertiary" />
      Analysis complete
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading, supabaseClient } = useAuth()
  const router = useRouter()
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)
  const [currentAnalysis, setCurrentAnalysis] = useState<RiskAnalysis[] | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showChat, setShowChat] = useState(false)

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
    setShowChat(false)
  }

  const activeAnalysis = selectedAnalysis?.analysis ?? currentAnalysis
  const activeDocId = selectedAnalysis?.id ?? ''
  const hasAnalysis = !!activeAnalysis && activeAnalysis.length > 0

  // Compute stats from real analysis
  const avgLevel = hasAnalysis
    ? activeAnalysis!.reduce((s, a) => s + a.riskLevel, 0) / activeAnalysis!.length
    : 0
  const riskScore = toScore(avgLevel)
  const highCount = hasAnalysis ? activeAnalysis!.filter(a => a.riskLevel >= 4).length : 0
  const medCount  = hasAnalysis ? activeAnalysis!.filter(a => a.riskLevel === 3).length : 0
  const lowCount  = hasAnalysis ? activeAnalysis!.filter(a => a.riskLevel <= 2).length : 0

  // Doc metadata from selectedAnalysis or generic
  const docTitle = selectedAnalysis
    ? (selectedAnalysis as Analysis & { title?: string }).title ?? 'Uploaded Document'
    : 'New Document'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-md-background">
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
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-md-outline-variant" style={{ borderTopColor: 'var(--md-sys-color-primary)' }} />
          <p className="text-body-md text-md-on-surface-variant">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-md-background">

      {/* Atmospheric backdrop */}
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
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--md-sys-color-on-background) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Top App Bar — mirrors demo's window-chrome bar ── */}
      <header
        className={`relative z-40 flex items-center gap-2 border-b border-md-outline-variant px-4 py-3 transition-all duration-medium2 md-standard ${
          isScrolled
            ? 'bg-md-surface-2/90 shadow-md-2 backdrop-blur-md'
            : 'bg-md-surface-2/80 backdrop-blur-sm'
        }`}
      >
        {/* Sidebar toggle + brand */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md-icon-btn ml-2"
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {/* Status badge — real state */}
        {hasAnalysis && (
          <div className="ml-2 hidden sm:block">
            <StatusBadge status="complete" />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* User + sign out */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md-full border border-md-outline-variant bg-md-surface/70 px-3 py-1.5 backdrop-blur-sm sm:flex">
            <User className="h-3.5 w-3.5 text-md-on-surface-variant" />
            <span className="max-w-40 truncate text-label-sm text-md-on-surface-variant">{user?.email}</span>
          </div>
          <button
            onClick={async () => { await supabaseClient.auth.signOut(); router.push('/auth') }}
            className="md-btn-text flex items-center gap-2 text-label-md"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* ── Body: Sidebar + Demo-Layout Main ── */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside
          className={`flex flex-col border-r border-md-outline-variant bg-md-surface-1/80 backdrop-blur-sm transition-all duration-medium3 md-emph-decel ${
            isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-none'
          }`}
          aria-label="Document sidebar"
        >
          {/* Upload */}
          <div className="border-b border-md-outline-variant p-5">
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

            {hasAnalysis && (
              <div
                className="mt-4 rounded-md-md border p-3"
                style={{
                  background: 'var(--md-sys-color-surface-2)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
                aria-label="Uploaded document summary"
              >
                <p className="text-label-sm uppercase tracking-widest text-md-on-surface-variant">Uploaded Document</p>
                <p className="mt-1 text-body-sm text-md-on-surface-variant">AI analysis ready for review</p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    { val: String(activeAnalysis!.length), label: 'Clauses' },
                    { val: String(highCount), label: 'High Risk' },
                    { val: String(lowCount), label: 'Low Risk' },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-md-md py-2"
                      style={{ background: 'var(--md-sys-color-surface-1)' }}
                    >
                      <p className="text-title-sm font-bold text-md-on-surface">{m.val}</p>
                      <p className="text-label-sm text-md-on-surface-variant">{m.label}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-label-sm font-semibold uppercase tracking-wider text-md-on-surface-variant">Risk Distribution</p>
                <div className="mt-2 space-y-1.5">
                  {[
                    { k: 'Critical (level 5)', v: activeAnalysis!.filter(a => a.riskLevel === 5).length },
                    { k: 'High (level 4)', v: activeAnalysis!.filter(a => a.riskLevel === 4).length },
                    { k: 'Moderate (level 3)', v: activeAnalysis!.filter(a => a.riskLevel === 3).length },
                    { k: 'Low (level 2)', v: activeAnalysis!.filter(a => a.riskLevel === 2).length },
                    { k: 'Minimal (level 1)', v: activeAnalysis!.filter(a => a.riskLevel === 1).length },
                  ].map(({ k, v }) => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <span className="text-body-sm text-md-on-surface-variant">{k}</span>
                      <span className="text-label-sm font-medium text-md-on-surface">{v} clause{v !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {['SOC 2', 'GDPR', 'AES-256'].map((b) => (
                    <span
                      key={b}
                      className="rounded-md-full px-2.5 py-0.5 text-label-sm"
                      style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}
                    >
                      ✓ {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
              <DocumentList onAnalysisSelect={setSelectedAnalysis} isCollapsed={false} />
            </div>
          </div>
        </aside>

        {/* ── Main content: demo two-column layout ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {hasAnalysis ? (
            <div className="relative flex-1 overflow-y-auto scrollbar-hide">
              {/* Chat overlay panel */}
              {showChat && (
                <div className="absolute inset-0 z-20 flex flex-col bg-md-background/95 backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-md-outline-variant px-6 py-3">
                    <div className="flex items-center gap-2 text-title-sm text-md-on-surface">
                      <MessageSquare className="h-4 w-4 text-md-primary" />
                      Chat with AI about this document
                    </div>
                    <button
                      onClick={() => setShowChat(false)}
                      className="md-icon-btn"
                      aria-label="Close chat"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden p-4">
                    <div
                      className="h-full overflow-hidden rounded-md-xl border border-md-outline-variant shadow-md-1"
                      style={{ background: 'var(--md-sys-color-surface-1)' }}
                    >
                      <ChatInterface
                        analysisText={JSON.stringify(activeAnalysis ?? [])}
                        documentId={activeDocId}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Demo layout: two-column split ── */}
              <div
                className="m-4 overflow-hidden rounded-md-xl shadow-md-3"
                style={{ background: 'var(--md-sys-color-surface-1)', border: '1px solid var(--md-sys-color-outline-variant)' }}
              >
                {/* Inner chrome strip (mirrors demo's inner header row) */}
                <div
                  className="flex items-center gap-2 border-b border-md-outline-variant px-4 py-3"
                  style={{ background: 'var(--md-sys-color-surface-2)' }}
                >
                  <div className="flex-1">
                    <StatusBadge status="complete" />
                  </div>
                  {/* Action buttons in chrome — mirrors demo's right side */}
                  <button
                    onClick={() => setShowChat(true)}
                    className="md-btn-text flex items-center gap-1.5 text-label-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </button>
                </div>

                {/* Main analysis panel */}
                <div>
                  <div className="p-5">
                    {/* Risk score + summary — identical to demo */}
                    <div
                      className="mb-5 flex items-center gap-5 rounded-md-lg p-4"
                      style={{ background: 'var(--md-sys-color-surface-2)' }}
                    >
                      <RiskDial score={riskScore} />
                      <div>
                        <p className="text-title-sm font-semibold text-md-on-surface">Overall Risk Score</p>
                        <p className="mt-1 text-body-sm text-md-on-surface-variant">
                          {highCount > 0
                            ? `${highCount} high-priority clause${highCount > 1 ? 's' : ''} require${highCount === 1 ? 's' : ''} attention before signing.`
                            : 'No critical issues found. Review medium-risk clauses before signing.'}
                        </p>
                        <div className="mt-3 flex gap-3 text-label-sm text-md-on-surface-variant">
                          <span><span className="font-bold text-md-error">{highCount}</span> High</span>
                          <span><span className="font-bold text-md-secondary">{medCount}</span> Medium</span>
                          <span><span className="font-bold text-md-tertiary">{lowCount}</span> Low</span>
                        </div>
                      </div>
                    </div>

                    {/* Clause breakdown — identical structure, real clauses */}
                    <p className="mb-3 text-label-sm font-semibold uppercase tracking-wider text-md-on-surface-variant">
                      Clause-by-Clause Breakdown
                    </p>
                    <div className="space-y-3.5 max-h-96 overflow-y-auto scrollbar-hide pr-1">
                      {activeAnalysis!.map((item, i) => (
                        <ClauseRow key={item.clause + i} item={item} index={i} />
                      ))}
                    </div>

                    {/* Action buttons — identical structure, real actions */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(activeAnalysis, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `synapse-analysis-${docTitle.replace(/\s+/g, '-').toLowerCase()}.json`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        className="md-btn-filled flex items-center gap-2 py-2 text-label-sm"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export Report
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowChat(true)}
                        className="md-btn-outlined flex items-center gap-2 py-2 text-label-sm"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat with AI
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* ── Empty state ── */
            <div className="flex flex-1 flex-col items-center justify-center gap-8 p-12 text-center">
              <div
                className="relative w-full max-w-md overflow-hidden rounded-md-xl p-8 shadow-md-3"
                style={{ background: 'var(--md-sys-color-surface-1)', border: '1px solid var(--md-sys-color-outline-variant)' }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-md-xl opacity-40"
                  style={{
                    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--md-sys-color-primary-container) 70%, transparent) 0%, transparent 70%)',
                  }}
                />
                <div className="relative flex flex-col items-center gap-5">
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
                        <p className="text-title-md font-bold text-md-on-surface">{m.val}</p>
                        <p className="text-label-sm text-md-on-surface-variant">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="md-btn-tonal mt-1 px-8 py-3">
                      Open Sidebar to Upload
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {['SOC 2 Type II', 'AES-256 Encryption', 'GDPR Compliant'].map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 rounded-md-full border border-md-outline-variant px-3 py-1 text-label-sm text-md-on-surface-variant"
                    style={{ background: 'var(--md-sys-color-surface-1)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-md-tertiary"><polyline points="20 6 9 17 4 12" /></svg>
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
