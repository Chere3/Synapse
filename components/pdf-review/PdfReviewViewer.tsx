'use client'

/**
 * PdfReviewViewer — Main orchestrator (replaces PdfViewerWithAnnotations)
 *
 * Architecture:
 *   ┌─────────────── Toolbar ───────────────────────────────────────────┐
 *   │ title · pages · clauses · [nav arrows] · [high-risk jump dots]   │
 *   ├─────────────────────────────────────────┬─────────────────────────┤
 *   │                                         │                         │
 *   │   PDF Canvas area (scrollable)          │   ReviewSidebar         │
 *   │   ┌──────── PdfPageRenderer ──────┐     │   (filters + list +     │
 *   │   │  Layer1: canvas               │     │    nav + keyboard)      │
 *   │   │  Layer2: text layer           │     │                         │
 *   │   │  Layer3: AnnotationOverlay    │     │                         │
 *   │   └──────────────────────────────┘     │                         │
 *   │   (repeated per page, lazy via IO)      │                         │
 *   └─────────────────────────────────────────┴─────────────────────────┘
 *   │ Status bar: risk distribution · match accuracy · keyboard hint   │
 *   └───────────────────────────────────────────────────────────────────┘
 *
 * Clause anchoring: TextAnchorEngine (exact → normalized → fuzzy → fallback)
 * Lazy rendering:   IntersectionObserver inside PdfPageRenderer
 * Page dimensions:  tracked per-page so AnnotationOverlay uses correct px values
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
} from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Loader2, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'

import type { RiskAnalysis } from '@/utils/analysis'
import type { ResolvedClause } from './types'
import { resolveAllClauses } from './TextAnchorEngine'
import PdfPageRenderer from './PdfPageRenderer'
import AnnotationOverlay from './AnnotationOverlay'
import ReviewSidebar from './ReviewSidebar'

// ── pdfjs worker ──────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
}

// ─── Risk config (for toolbar dots + status bar) ──────────────────────────────
const RISK_DOT: Record<number, string> = {
  1: 'bg-md-outline',
  2: 'bg-md-tertiary',
  3: 'bg-md-primary',
  4: 'bg-md-secondary',
  5: 'bg-md-error',
}

const RISK_LABEL: Record<number, string> = {
  1: 'Minimal', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical',
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  pdfUrl: string
  analysis: RiskAnalysis[]
  documentTitle?: string
}

type LoadStatus = 'loading' | 'loaded' | 'error'

// ─── Component ────────────────────────────────────────────────────────────────
export default function PdfReviewViewer({
  pdfUrl,
  analysis,
  documentTitle = 'Contract Document',
}: Props) {
  const [pdfDoc,       setPdfDoc]       = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages,     setNumPages]     = useState(0)
  const [loadStatus,   setLoadStatus]   = useState<LoadStatus>('loading')
  const [loadError,    setLoadError]    = useState<string | null>(null)
  const [clauses,      setClauses]      = useState<ResolvedClause[]>([])
  const [anchoringDone, setAnchoringDone] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [pageDims,     setPageDims]     = useState<Map<number, { w: number; h: number }>>(new Map())
  const [sidebarOpen,  setSidebarOpen]  = useState(true)

  const pageRefs    = useRef<(HTMLDivElement | null)[]>([])
  const scrollerRef = useRef<HTMLDivElement>(null)

  // ── Load PDF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfUrl) return
    setLoadStatus('loading')
    setLoadError(null)
    setAnchoringDone(false)
    setClauses([])
    setPdfDoc(null)

    const task = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    })

    task.promise
      .then(doc => {
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setLoadStatus('loaded')
      })
      .catch(err => {
        console.error('[PdfReviewViewer] load error', err)
        setLoadError(err?.message ?? 'Failed to load PDF')
        setLoadStatus('error')
      })

    return () => { task.destroy() }
  }, [pdfUrl])

  // ── Anchor clauses after PDF loads ────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || analysis.length === 0) return
    setAnchoringDone(false)

    resolveAllClauses(analysis.map(a => a.clause), pdfDoc)
      .then(({ anchors }) => {
        const resolved: ResolvedClause[] = analysis.map((a, i) => ({
          analysis: a,
          index: i,
          anchor: anchors[i],
        }))
        setClauses(resolved)
        setAnchoringDone(true)
      })
      .catch(err => {
        console.error('[PdfReviewViewer] anchoring error', err)
        // Still show the viewer; clauses will be empty
        setAnchoringDone(true)
      })
  }, [pdfDoc, analysis])

  // ── Page dimension tracking (for AnnotationOverlay pixel coords) ──────────
  const handleDimensions = useCallback((pageIndex: number, w: number, h: number) => {
    setPageDims(prev => {
      const next = new Map(prev)
      next.set(pageIndex, { w, h })
      return next
    })
  }, [])

  // ── Scroll to page containing selected annotation ─────────────────────────
  const scrollToClause = useCallback((idx: number) => {
    const clause = clauses.find(c => c.index === idx)
    if (!clause) return
    const el = pageRefs.current[clause.anchor.pageIndex]
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [clauses])

  const handleSelect = useCallback((idx: number) => {
    setSelectedIndex(idx)
    setTimeout(() => scrollToClause(idx), 60)
  }, [scrollToClause])

  const navigatePrev = useCallback(() => {
    if (!analysis.length) return
    setSelectedIndex(prev => {
      const next = prev === null ? analysis.length - 1 : Math.max(0, prev - 1)
      setTimeout(() => scrollToClause(next), 60)
      return next
    })
  }, [analysis.length, scrollToClause])

  const navigateNext = useCallback(() => {
    if (!analysis.length) return
    setSelectedIndex(prev => {
      const next = prev === null ? 0 : Math.min(analysis.length - 1, prev + 1)
      setTimeout(() => scrollToClause(next), 60)
      return next
    })
  }, [analysis.length, scrollToClause])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); navigateNext() }
    if (e.key === 'ArrowUp'   || e.key === 'k') { e.preventDefault(); navigatePrev() }
  }, [navigateNext, navigatePrev])

  // ── Derived stats ─────────────────────────────────────────────────────────
  const exactCount   = clauses.filter(c => c.anchor.matchKind !== 'fallback').length
  const fallbackCount = clauses.length - exactCount
  const highRisk     = clauses
    .filter(c => c.analysis.riskLevel >= 4)
    .sort((a, b) => b.analysis.riskLevel - a.analysis.riskLevel)

  const currentPos = selectedIndex !== null
    ? `${selectedIndex + 1} / ${analysis.length}`
    : `– / ${analysis.length}`

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col overflow-hidden rounded-md-xl"
      style={{ border: '1px solid var(--md-sys-color-outline-variant)' }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b border-md-outline-variant flex-wrap shrink-0"
        style={{ background: 'var(--md-sys-color-surface-2)' }}
      >
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          aria-label={sidebarOpen ? 'Collapse review sidebar' : 'Open review sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-md-full text-md-on-surface-variant
            transition-colors hover:bg-md-surface-variant
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary"
        >
          {sidebarOpen ? (
            <ChevronDown className="h-4 w-4 rotate-90" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-4 w-4 rotate-90" aria-hidden="true" />
          )}
        </button>

        {/* Document title + meta */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md-sm shrink-0"
            style={{ background: 'var(--md-sys-color-primary-container)' }}
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-md-primary" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span
            className="text-label-md font-medium text-md-on-surface truncate"
            title={documentTitle}
          >
            {documentTitle}
          </span>
          {loadStatus === 'loaded' && (
            <span className="text-label-sm text-md-on-surface-variant shrink-0">
              · {numPages}p · {analysis.length} clauses
            </span>
          )}
          {loadStatus === 'loaded' && !anchoringDone && (
            <span className="flex items-center gap-1 text-label-sm text-md-on-surface-variant shrink-0">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              anchoring…
            </span>
          )}
        </div>

        {/* Annotation navigation */}
        <div
          className="flex items-center gap-0.5 rounded-md-full border border-md-outline-variant px-0.5"
          style={{ background: 'var(--md-sys-color-surface-1)' }}
          role="group"
          aria-label="Navigate annotations"
        >
          <button
            onClick={navigatePrev}
            disabled={!analysis.length || loadStatus !== 'loaded'}
            aria-label="Previous annotation"
            className="flex h-7 w-7 items-center justify-center rounded-md-full text-md-on-surface-variant
              transition-colors hover:bg-md-surface-variant
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary
              disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className="text-label-sm text-md-on-surface-variant px-1 tabular-nums min-w-[3.5rem] text-center">
            {currentPos}
          </span>
          <button
            onClick={navigateNext}
            disabled={!analysis.length || loadStatus !== 'loaded'}
            aria-label="Next annotation"
            className="flex h-7 w-7 items-center justify-center rounded-md-full text-md-on-surface-variant
              transition-colors hover:bg-md-surface-variant
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary
              disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* High-risk jump dots */}
        {highRisk.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-label-sm text-md-error font-medium">
              {highRisk.length} critical
            </span>
            <div className="flex gap-0.5">
              {highRisk.slice(0, 6).map(c => {
                const dotClass = RISK_DOT[Math.min(5, Math.max(1, Math.round(c.analysis.riskLevel)))]
                return (
                  <button
                    key={c.index}
                    onClick={() => handleSelect(c.index)}
                    aria-label={`Jump to ${RISK_LABEL[Math.round(c.analysis.riskLevel)]} clause ${c.index + 1}`}
                    className={[
                      'h-2 w-2 rounded-full transition-all duration-short4',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-error',
                      dotClass,
                      selectedIndex === c.index ? 'scale-150' : 'hover:scale-125',
                    ].join(' ')}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Body: PDF canvas + sidebar ── */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ minHeight: 0, maxHeight: 660 }}
      >
        {/* ── PDF scroll area ── */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto overflow-x-auto"
          style={{
            background:   'var(--md-sys-color-surface)',
            paddingRight: anchoringDone && clauses.length > 0 ? 230 : 16,
          }}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={`PDF viewer: ${documentTitle}. Arrow keys navigate annotations.`}
        >
          {/* Loading */}
          {loadStatus === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-md-primary" />
              <p className="text-body-md text-md-on-surface-variant">Loading PDF…</p>
            </div>
          )}

          {/* Error */}
          {loadStatus === 'error' && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-8">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-md-full"
                style={{ background: 'var(--md-sys-color-error-container)' }}
              >
                <AlertCircle className="h-7 w-7 text-md-error" />
              </div>
              <div>
                <p className="text-title-sm text-md-on-surface font-semibold">
                  PDF unavailable
                </p>
                <p className="text-body-sm text-md-on-surface-variant mt-1 max-w-xs">
                  {loadError ?? 'Could not load the document. The URL may have expired.'}
                </p>
              </div>
            </div>
          )}

          {/* Pages */}
          {loadStatus === 'loaded' && pdfDoc && (
            <div className="relative py-4 px-6 space-y-6">
              {Array.from({ length: numPages }, (_, i) => {
                const dims = pageDims.get(i)
                return (
                  <div
                    key={i}
                    ref={el => { pageRefs.current[i] = el }}
                    className="relative"
                  >
                    <PdfPageRenderer
                      pdfDoc={pdfDoc}
                      pageIndex={i}
                      scale={1.4}
                      onDimensionsReady={(w, h) => handleDimensions(i, w, h)}
                    >
                      {/* AnnotationOverlay as Layer 3 */}
                      {anchoringDone && dims && (
                        <AnnotationOverlay
                          clauses={clauses}
                          pageIndex={i}
                          pageWidth={dims.w}
                          pageHeight={dims.h}
                          selectedIndex={selectedIndex}
                          onSelect={handleSelect}
                        />
                      )}
                    </PdfPageRenderer>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Review Sidebar ── */}
        {sidebarOpen && loadStatus === 'loaded' && (
          <div
            className="hidden md:flex flex-col border-l border-md-outline-variant overflow-hidden shrink-0"
            style={{
              width:    300,
              minWidth: 300,
            }}
          >
            <ReviewSidebar
              clauses={clauses}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
              totalPages={numPages}
            />
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div
        className="flex items-center gap-4 flex-wrap px-4 py-2 border-t border-md-outline-variant shrink-0"
        style={{ background: 'var(--md-sys-color-surface-2)' }}
      >
        {/* Risk distribution */}
        {([5, 4, 3, 2, 1] as const).map(level => {
          const count = analysis.filter(a => Math.round(a.riskLevel) === level).length
          if (!count) return null
          return (
            <div key={level} className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${RISK_DOT[level]}`}
                aria-hidden="true"
              />
              <span className="text-label-sm text-md-on-surface-variant">
                {RISK_LABEL[level]}{' '}
                <span className="font-semibold text-md-on-surface">{count}</span>
              </span>
            </div>
          )
        })}

        {/* Match accuracy */}
        {clauses.length > 0 && (
          <span className="text-label-sm text-md-on-surface-variant ml-auto">
            {exactCount}/{clauses.length} anchored
            {fallbackCount > 0 ? ` · ${fallbackCount} approx` : ''}
          </span>
        )}

        {/* Keyboard hint */}
        <span className="text-label-sm text-md-on-surface-variant hidden sm:inline">
          <kbd className="rounded px-1 font-mono text-label-sm bg-md-surface-variant text-md-on-surface-variant border border-md-outline-variant">↑</kbd>
          <kbd className="ml-0.5 rounded px-1 font-mono text-label-sm bg-md-surface-variant text-md-on-surface-variant border border-md-outline-variant">↓</kbd>
          {' '}navigate
        </span>
      </div>
    </div>
  )
}
