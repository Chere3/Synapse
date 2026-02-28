'use client'

/**
 * PdfViewerWithAnnotations
 *
 * Renders the REAL PDF document using pdfjs-dist (canvas per page) with
 * M3-styled risk annotations overlaid directly on the rendered pages.
 *
 * ─── How the PDF is obtained ──────────────────────────────────────────────
 * 1. `pdfUrl` prop is passed from the parent (signed URL from Supabase Storage
 *    OR public URL stored in documents.file_url).
 * 2. Parent resolves this URL by calling supabase.storage.from('documents')
 *    .createSignedUrl(document.file_path, 3600) — same pattern as DocumentList.
 *
 * ─── Annotation positioning ───────────────────────────────────────────────
 * MVP — Approximate text-search anchoring:
 *   1. For each clause, search all pages for the first ~40 chars of the clause
 *      text using pdfjs getTextContent().
 *   2. If a text match is found, use the matching item's transform (x,y)
 *      translated to canvas coordinates for the annotation pin.
 *   3. If no match found → fall back to distributing annotations evenly across
 *      pages using (annotationIndex / totalAnnotations) as a vertical fraction.
 *
 * Limitations & next steps for production-grade precision:
 *   - Store page number + bbox (x,y,w,h) per clause during AI extraction.
 *   - Use those exact coordinates for pixel-perfect annotation pins.
 *   - Consider react-pdf or a custom pdfjs text layer for interactive selection.
 * ──────────────────────────────────────────────────────────────────────────
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  KeyboardEvent,
} from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { RiskAnalysis } from '@/utils/analysis'
import {
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react'

// ── pdfjs worker (Next.js / webpack compatible) ──────────────────────────
// We must point pdfjs to its worker. Use the CDN bundle to avoid
// issues with webpack splitting the worker file.
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
}

// ─────────────────────────────────────────────────────────
// Risk config — M3 semantic token mapping
// ─────────────────────────────────────────────────────────
const RISK_CONFIG = {
  1: {
    label: 'Minimal',
    Icon: ShieldCheck,
    pin: 'bg-md-surface-variant border-md-outline text-md-on-surface-variant',
    pinActive: 'bg-md-surface-2 border-md-outline ring-2 ring-md-outline',
    card: 'bg-md-surface-variant border-md-outline text-md-on-surface-variant',
    dot: 'bg-md-outline',
    iconColor: 'text-md-outline',
    pill: 'bg-md-surface-variant text-md-on-surface-variant',
  },
  2: {
    label: 'Low',
    Icon: Info,
    pin: 'bg-md-tertiary-container border-md-tertiary text-md-on-tertiary-container',
    pinActive: 'bg-md-tertiary-container border-md-tertiary ring-2 ring-md-tertiary',
    card: 'bg-md-tertiary-container border-md-tertiary text-md-on-tertiary-container',
    dot: 'bg-md-tertiary',
    iconColor: 'text-md-tertiary',
    pill: 'bg-md-tertiary-container text-md-on-tertiary-container',
  },
  3: {
    label: 'Moderate',
    Icon: AlertTriangle,
    pin: 'bg-md-primary-container border-md-primary text-md-on-primary-container',
    pinActive: 'bg-md-primary-container border-md-primary ring-2 ring-md-primary',
    card: 'bg-md-primary-container border-md-primary text-md-on-primary-container',
    dot: 'bg-md-primary',
    iconColor: 'text-md-primary',
    pill: 'bg-md-primary-container text-md-on-primary-container',
  },
  4: {
    label: 'High',
    Icon: ShieldAlert,
    pin: 'bg-md-secondary-container border-md-secondary text-md-on-secondary-container',
    pinActive: 'bg-md-secondary-container border-md-secondary ring-2 ring-md-secondary',
    card: 'bg-md-secondary-container border-md-secondary text-md-on-secondary-container',
    dot: 'bg-md-secondary',
    iconColor: 'text-md-secondary',
    pill: 'bg-md-secondary-container text-md-on-secondary-container',
  },
  5: {
    label: 'Critical',
    Icon: AlertOctagon,
    pin: 'bg-md-error-container border-md-error text-md-on-error-container',
    pinActive: 'bg-md-error-container border-md-error ring-2 ring-md-error',
    card: 'bg-md-error-container border-md-error text-md-on-error-container',
    dot: 'bg-md-error',
    iconColor: 'text-md-error',
    pill: 'bg-md-error-container text-md-on-error-container',
  },
} as const

type Level = keyof typeof RISK_CONFIG

function getRiskConfig(level: number) {
  const clamped = Math.min(5, Math.max(1, Math.round(level))) as Level
  return RISK_CONFIG[clamped]
}

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface AnnotationPosition {
  /** 0-based page index */
  pageIndex: number
  /** Fraction 0-1 of page height (top of annotation pin) */
  yFraction: number
  /** Whether this was found via text search (true) or fallback (false) */
  isExact: boolean
}

interface ResolvedAnnotation {
  analysis: RiskAnalysis
  originalIndex: number
  position: AnnotationPosition
}

interface PageRenderState {
  status: 'idle' | 'loading' | 'rendered' | 'error'
  width: number
  height: number
}

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────
interface PdfViewerWithAnnotationsProps {
  /** Signed or public URL to the PDF file */
  pdfUrl: string
  /** Clause-level risk analysis to overlay */
  analysis: RiskAnalysis[]
  /** Document title for accessibility */
  documentTitle?: string
}

// ─────────────────────────────────────────────────────────
// Annotation pin overlay (absolute positioned on a page)
// ─────────────────────────────────────────────────────────
interface AnnotationPinProps {
  annotation: ResolvedAnnotation
  isSelected: boolean
  onSelect: (index: number) => void
  pageHeight: number
}

function AnnotationPin({ annotation, isSelected, onSelect, pageHeight }: AnnotationPinProps) {
  const cfg = getRiskConfig(annotation.analysis.riskLevel)
  const { Icon } = cfg
  const topPx = annotation.position.yFraction * pageHeight

  return (
    <div
      className="absolute right-0 z-10 flex items-start"
      style={{ top: Math.max(0, topPx - 16), transform: 'translateX(0)' }}
    >
      {/* Connector line */}
      <div
        className="mt-4 h-px w-4 shrink-0"
        style={{ background: 'var(--md-sys-color-outline-variant)' }}
        aria-hidden="true"
      />
      {/* Pin button */}
      <button
        onClick={() => onSelect(annotation.originalIndex)}
        aria-label={`${cfg.label} risk clause: ${annotation.analysis.clause.slice(0, 60)}…`}
        aria-pressed={isSelected}
        className={[
          'flex items-center gap-1.5 rounded-md-lg border px-2 py-1.5 text-left',
          'transition-all duration-short4 cursor-pointer',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-md-primary',
          'shadow-md-1 hover:shadow-md-2',
          'max-w-[200px]',
          isSelected ? cfg.pinActive : cfg.pin,
        ].join(' ')}
        style={{ minWidth: 140 }}
      >
        <Icon className={`h-3.5 w-3.5 shrink-0 ${cfg.iconColor}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-label-sm font-semibold">{cfg.label}</span>
            {!annotation.position.isExact && (
              <span
                className="text-label-sm opacity-60"
                title="Approximate position — clause text not matched in PDF"
                aria-label="Approximate position"
              >
                ~
              </span>
            )}
          </div>
          <p className="text-label-sm opacity-80 line-clamp-1">
            {annotation.analysis.clause.slice(0, 45)}
          </p>
        </div>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Single rendered PDF page with its annotation layer
// ─────────────────────────────────────────────────────────
interface PdfPageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  pageIndex: number
  scale: number
  annotations: ResolvedAnnotation[]
  selectedIndex: number | null
  onAnnotationSelect: (index: number) => void
}

function PdfPage({
  pdfDoc,
  pageIndex,
  scale,
  annotations,
  selectedIndex,
  onAnnotationSelect,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<PageRenderState>({
    status: 'idle',
    width: 600,
    height: 800,
  })
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)

  useEffect(() => {
    let cancelled = false

    async function renderPage() {
      setState(s => ({ ...s, status: 'loading' }))
      try {
        const page = await pdfDoc.getPage(pageIndex + 1)
        if (cancelled) return

        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        canvas.width = viewport.width
        canvas.height = viewport.height
        setState({ status: 'loading', width: viewport.width, height: viewport.height })

        const ctx = canvas.getContext('2d')
        if (!ctx || cancelled) return

        // Cancel any previous render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
        }

        const renderTask = page.render({ canvasContext: ctx, viewport })
        renderTaskRef.current = renderTask
        await renderTask.promise

        if (!cancelled) {
          setState({ status: 'rendered', width: viewport.width, height: viewport.height })
        }
      } catch (err: unknown) {
        if (cancelled) return
        // RenderingCancelledException is expected on cleanup — ignore it
        if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') return
        setState(s => ({ ...s, status: 'error' }))
      }
    }

    renderPage()

    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
    }
  }, [pdfDoc, pageIndex, scale])

  const pageAnnotations = annotations.filter(a => a.position.pageIndex === pageIndex)

  return (
    <div
      className="relative mx-auto"
      style={{ width: state.width, maxWidth: '100%' }}
      data-page={pageIndex + 1}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full shadow-md-2 rounded-md-sm"
        style={{ display: state.status === 'error' ? 'none' : 'block' }}
        aria-label={`Page ${pageIndex + 1}`}
      />

      {/* Loading shimmer */}
      {state.status === 'loading' && (
        <div
          className="absolute inset-0 rounded-md-sm"
          style={{ background: 'var(--md-sys-color-surface-variant)', height: state.height }}
          aria-hidden="true"
        >
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-md-on-surface-variant" />
          </div>
        </div>
      )}

      {/* Error state */}
      {state.status === 'error' && (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-md-sm py-12"
          style={{ background: 'var(--md-sys-color-error-container)', height: state.height }}
        >
          <AlertCircle className="h-8 w-8 text-md-error" />
          <p className="text-body-sm text-md-on-error-container">Failed to render page {pageIndex + 1}</p>
        </div>
      )}

      {/* Annotation overlay — right gutter */}
      {state.status === 'rendered' && pageAnnotations.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 pointer-events-none"
          style={{ width: 0 }}
          aria-label={`Annotations for page ${pageIndex + 1}`}
        >
          {pageAnnotations.map(annotation => (
            <div key={annotation.originalIndex} className="pointer-events-auto">
              <AnnotationPin
                annotation={annotation}
                isSelected={selectedIndex === annotation.originalIndex}
                onSelect={onAnnotationSelect}
                pageHeight={state.height}
              />
            </div>
          ))}
        </div>
      )}

      {/* Page number label */}
      <div className="mt-1 text-center">
        <span className="text-label-sm text-md-on-surface-variant">{pageIndex + 1}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
export default function PdfViewerWithAnnotations({
  pdfUrl,
  analysis,
  documentTitle = 'Contract Document',
}: PdfViewerWithAnnotationsProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<ResolvedAnnotation[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [scale] = useState(1.4)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  // ── Load PDF ──────────────────────────────────────────
  useEffect(() => {
    if (!pdfUrl) return
    setLoadStatus('loading')
    setLoadError(null)

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    })

    loadingTask.promise
      .then(doc => {
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setLoadStatus('loaded')
      })
      .catch(err => {
        console.error('[PdfViewer] Failed to load PDF', err)
        setLoadError(err?.message ?? 'Failed to load PDF')
        setLoadStatus('error')
      })

    return () => { loadingTask.destroy() }
  }, [pdfUrl])

  // ── Resolve annotation positions after PDF loads ───────
  useEffect(() => {
    if (!pdfDoc || analysis.length === 0) return

    async function resolveAnnotations() {
      // Build a text map: pageIndex → array of {str, x, y, width, height}
      const pageTextItems: Array<Array<{ str: string; tx: number; ty: number; tw: number; th: number; pageH: number }>> = []

      for (let p = 0; p < pdfDoc!.numPages; p++) {
        const page = await pdfDoc!.getPage(p + 1)
        const viewport = page.getViewport({ scale: 1 })
        const tc = await page.getTextContent()
        type PdfTextItem = { str: string; transform: number[]; width: number; height: number }
        const items = (tc.items as PdfTextItem[]).map(item => {
          const [, , , , tx, ty] = item.transform
          return {
            str: item.str,
            tx,
            ty: viewport.height - ty, // flip y axis: pdfjs y=0 is bottom
            tw: item.width,
            th: item.height,
            pageH: viewport.height,
          }
        })
        pageTextItems.push(items)
      }

      // Concatenate per-page text for search
      const pageTexts = pageTextItems.map(items => items.map(i => i.str).join(' '))

      const resolved: ResolvedAnnotation[] = analysis.map((a, idx) => {
        // Search for first ~40 chars of clause across pages
        const searchStr = a.clause.slice(0, 40).toLowerCase().trim()
        let bestPage = -1
        let bestY = 0.5
        let isExact = false

        for (let p = 0; p < pageTexts.length; p++) {
          const pageText = pageTexts[p].toLowerCase()
          const matchIdx = pageText.indexOf(searchStr)
          if (matchIdx !== -1) {
            // Find which text item contains this match position
            let charCount = 0
            for (const item of pageTextItems[p]) {
              charCount += item.str.length + 1 // +1 for the join space
              if (charCount >= matchIdx) {
                bestPage = p
                bestY = item.ty / (item.pageH || 800)
                isExact = true
                break
              }
            }
            if (isExact) break
          }
        }

        // Fallback: distribute evenly across pages
        if (!isExact) {
          const fraction = idx / Math.max(1, analysis.length - 1)
          bestPage = Math.floor(fraction * (pdfDoc!.numPages - 1))
          bestY = (fraction * pdfDoc!.numPages) % 1
        }

        return {
          analysis: a,
          originalIndex: idx,
          position: {
            pageIndex: Math.max(0, bestPage),
            yFraction: Math.max(0.05, Math.min(0.95, bestY)),
            isExact,
          },
        }
      })

      setAnnotations(resolved)
    }

    resolveAnnotations().catch(err => console.error('[PdfViewer] Annotation resolution failed', err))
  }, [pdfDoc, analysis])

  // ── Navigation ────────────────────────────────────────
  const scrollToAnnotation = useCallback((idx: number) => {
    const ann = annotations.find(a => a.originalIndex === idx)
    if (!ann) return
    const pageEl = pageRefs.current[ann.position.pageIndex]
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [annotations])

  const handleSelect = useCallback((idx: number) => {
    setSelectedIndex(idx)
    setExpandedIndex(idx)
    setTimeout(() => scrollToAnnotation(idx), 50)
  }, [scrollToAnnotation])

  const navigatePrev = useCallback(() => {
    if (analysis.length === 0) return
    setSelectedIndex(prev => {
      const next = prev === null ? analysis.length - 1 : Math.max(0, prev - 1)
      setExpandedIndex(next)
      setTimeout(() => scrollToAnnotation(next), 50)
      return next
    })
  }, [analysis.length, scrollToAnnotation])

  const navigateNext = useCallback(() => {
    if (analysis.length === 0) return
    setSelectedIndex(prev => {
      const next = prev === null ? 0 : Math.min(analysis.length - 1, prev + 1)
      setExpandedIndex(next)
      setTimeout(() => scrollToAnnotation(next), 50)
      return next
    })
  }, [analysis.length, scrollToAnnotation])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); navigateNext() }
    if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); navigatePrev() }
  }, [navigateNext, navigatePrev])

  // ── Summary stats ─────────────────────────────────────
  const exactCount = annotations.filter(a => a.position.isExact).length
  const approxCount = annotations.length - exactCount
  const highRiskAnnotations = annotations
    .filter(a => a.analysis.riskLevel >= 4)
    .sort((a, b) => b.analysis.riskLevel - a.analysis.riskLevel)

  const currentPosition = selectedIndex !== null
    ? `${selectedIndex + 1} / ${analysis.length}`
    : `– / ${analysis.length}`

  // ── Render ────────────────────────────────────────────
  return (
    <div
      className="flex flex-col overflow-hidden rounded-md-xl"
      style={{ border: '1px solid var(--md-sys-color-outline-variant)' }}
    >
      {/* ── Toolbar ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b border-md-outline-variant flex-wrap"
        style={{ background: 'var(--md-sys-color-surface-2)' }}
      >
        {/* Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="h-6 w-6 flex items-center justify-center rounded-md-sm shrink-0"
            style={{ background: 'var(--md-sys-color-primary-container)' }}
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
          <span className="text-label-md font-medium text-md-on-surface truncate" title={documentTitle}>
            {documentTitle}
          </span>
          {loadStatus === 'loaded' && (
            <span className="text-label-sm text-md-on-surface-variant shrink-0">
              · {numPages} page{numPages !== 1 ? 's' : ''} · {analysis.length} clause{analysis.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Annotation navigation */}
        <div
          className="flex items-center gap-1 rounded-md-full border border-md-outline-variant px-1"
          style={{ background: 'var(--md-sys-color-surface-1)' }}
          role="group"
          aria-label="Navigate between annotations"
        >
          <button
            onClick={navigatePrev}
            disabled={analysis.length === 0 || loadStatus !== 'loaded'}
            aria-label="Previous annotation"
            className="flex h-7 w-7 items-center justify-center rounded-md-full text-md-on-surface-variant transition-colors hover:bg-md-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className="text-label-sm text-md-on-surface-variant px-1 tabular-nums min-w-[3.5rem] text-center">
            {currentPosition}
          </span>
          <button
            onClick={navigateNext}
            disabled={analysis.length === 0 || loadStatus !== 'loaded'}
            aria-label="Next annotation"
            className="flex h-7 w-7 items-center justify-center rounded-md-full text-md-on-surface-variant transition-colors hover:bg-md-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* High-risk jump dots */}
        {highRiskAnnotations.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-label-sm text-md-error font-medium">
              {highRiskAnnotations.length} critical
            </span>
            <div className="flex gap-0.5">
              {highRiskAnnotations.slice(0, 5).map(ann => {
                const cfg = getRiskConfig(ann.analysis.riskLevel)
                return (
                  <button
                    key={ann.originalIndex}
                    onClick={() => handleSelect(ann.originalIndex)}
                    aria-label={`Jump to ${cfg.label} risk clause ${ann.originalIndex + 1}`}
                    className={[
                      'h-2 w-2 rounded-full transition-all duration-short4',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-error',
                      cfg.dot,
                      selectedIndex === ann.originalIndex ? 'scale-150' : 'hover:scale-125',
                    ].join(' ')}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Main area: PDF + annotation panel ────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* ── Left: scrollable PDF canvas ────────────────── */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-auto"
          style={{
            background: 'var(--md-sys-color-surface)',
            maxHeight: 640,
            paddingRight: 220, // room for annotation gutter
          }}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={`PDF viewer: ${documentTitle}. Use arrow keys to navigate annotations.`}
        >
          {/* Loading state */}
          {loadStatus === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-md-primary" />
              <p className="text-body-md text-md-on-surface-variant">Loading PDF…</p>
            </div>
          )}

          {/* Error state */}
          {loadStatus === 'error' && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-8">
              <div className="h-14 w-14 flex items-center justify-center rounded-md-full bg-md-error-container">
                <AlertCircle className="h-7 w-7 text-md-error" />
              </div>
              <div>
                <p className="text-title-sm text-md-on-surface font-semibold">PDF unavailable</p>
                <p className="text-body-sm text-md-on-surface-variant mt-1 max-w-xs">
                  {loadError ?? 'Could not load the document. The URL may have expired.'}
                </p>
              </div>
            </div>
          )}

          {/* PDF pages */}
          {loadStatus === 'loaded' && pdfDoc && (
            <div className="relative py-4 px-6 space-y-6">
              {Array.from({ length: numPages }, (_, i) => (
                <div
                  key={i}
                  ref={el => { pageRefs.current[i] = el }}
                  className="relative"
                >
                  <PdfPage
                    pdfDoc={pdfDoc}
                    pageIndex={i}
                    scale={scale}
                    annotations={annotations}
                    selectedIndex={selectedIndex}
                    onAnnotationSelect={handleSelect}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: annotation detail panel ─────────────── */}
        {loadStatus === 'loaded' && selectedIndex !== null && analysis[selectedIndex] && (
          <div
            className="hidden md:flex flex-col border-l border-md-outline-variant overflow-y-auto"
            style={{
              width: 280,
              minWidth: 280,
              maxWidth: 280,
              background: 'var(--md-sys-color-surface-1)',
              maxHeight: 640,
            }}
          >
            {(() => {
              const item = analysis[selectedIndex]
              const cfg = getRiskConfig(item.riskLevel)
              const { Icon } = cfg
              const ann = annotations.find(a => a.originalIndex === selectedIndex)
              return (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md-full border ${cfg.pin}`}
                    >
                      <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-label-md font-semibold text-md-on-surface">
                        Clause {selectedIndex + 1}
                      </p>
                      <span className={`text-label-sm rounded-md-full px-2 py-0.5 ${cfg.pill}`}>
                        {cfg.label} risk · level {item.riskLevel}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`rounded-md-lg border p-3 ${cfg.card}`}
                  >
                    <p
                      className="text-body-sm leading-relaxed"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {item.clause}
                    </p>
                  </div>

                  <div>
                    <p className="text-label-sm font-semibold text-md-on-surface-variant uppercase tracking-wider mb-1">
                      Explanation
                    </p>
                    <p className="text-body-sm text-md-on-surface leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>

                  {ann && (
                    <div className="rounded-md-md bg-md-surface-variant px-3 py-2">
                      <p className="text-label-sm text-md-on-surface-variant">
                        {ann.position.isExact
                          ? `📍 Located on page ${ann.position.pageIndex + 1}`
                          : `~ Approx. page ${ann.position.pageIndex + 1} (text not found in PDF)`}
                      </p>
                    </div>
                  )}

                  {/* Navigation within the panel */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={navigatePrev}
                      className="flex-1 md-btn-outlined py-1.5 text-label-sm flex items-center justify-center gap-1"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                      Prev
                    </button>
                    <button
                      onClick={navigateNext}
                      className="flex-1 md-btn-outlined py-1.5 text-label-sm flex items-center justify-center gap-1"
                    >
                      Next
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* ── Bottom status bar ─────────────────────────────── */}
      <div
        className="flex items-center gap-4 flex-wrap px-4 py-2 border-t border-md-outline-variant"
        style={{ background: 'var(--md-sys-color-surface-2)' }}
      >
        {/* Risk distribution */}
        {([5, 4, 3, 2, 1] as Level[]).map(level => {
          const count = analysis.filter(a => Math.round(a.riskLevel) === level).length
          if (!count) return null
          const cfg = RISK_CONFIG[level]
          return (
            <div key={level} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} aria-hidden="true" />
              <span className="text-label-sm text-md-on-surface-variant">
                {cfg.label} <span className="font-semibold text-md-on-surface">{count}</span>
              </span>
            </div>
          )
        })}

        {/* Position accuracy indicator */}
        {annotations.length > 0 && (
          <span className="text-label-sm text-md-on-surface-variant ml-auto">
            {exactCount}/{annotations.length} positioned · {approxCount > 0 ? `${approxCount} approx` : 'all exact'}
          </span>
        )}

        {/* Keyboard hint */}
        <span className="text-label-sm text-md-on-surface-variant">
          Press{' '}
          <kbd className="rounded px-1 py-0.5 text-label-sm font-mono bg-md-surface-variant text-md-on-surface-variant border border-md-outline-variant">↑</kbd>
          <kbd className="rounded px-1 py-0.5 text-label-sm font-mono bg-md-surface-variant text-md-on-surface-variant border border-md-outline-variant ml-0.5">↓</kbd>
          {' '}to navigate
        </span>
      </div>
    </div>
  )
}
