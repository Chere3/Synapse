'use client'

/**
 * DocumentPreviewWithAnnotations
 *
 * GitHub-style document review: extracted contract clauses rendered as
 * document text with risk annotations in a fixed gutter on the right.
 *
 * ─── Architecture ──────────────────────────────────────────────────────────
 * MVP: Anchor annotations by clause *index* (one annotation per clause block).
 *   - Each RiskAnalysis.clause = one document segment rendered in order.
 *   - The annotation callout floats in the right margin at the same row.
 *   - Clicking an annotation (or Prev/Next) scrolls to + highlights the clause.
 *
 * To upgrade to exact coordinate anchoring:
 *   1. Store PDF page + bbox (x,y,w,h) per clause during AI extraction.
 *   2. Use pdfjs-dist to render PDF pages onto <canvas> elements.
 *   3. Overlay <div> annotation pins using absolute positioning relative to canvas.
 *   4. See: https://mozilla.github.io/pdf.js/examples/
 *
 * Fallback: if analysis is empty, renders a friendly empty state without crashing.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react'
import { RiskAnalysis } from '@/utils/analysis'
import {
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────
// Risk config — M3 semantic token mapping
// ─────────────────────────────────────────────────────────
const RISK_CONFIG = {
  1: {
    label:       'Minimal',
    Icon:        ShieldCheck,
    gutter:      'border-md-outline bg-md-surface-variant text-md-on-surface-variant',
    gutterHover: 'hover:bg-md-surface-container-highest',
    gutterActive:'bg-md-surface-container-highest ring-2 ring-md-outline',
    highlight:   'bg-md-surface-variant/50',
    highlightActive: 'bg-md-surface-variant ring-2 ring-inset ring-md-outline',
    pill:        'bg-md-surface-variant text-md-on-surface-variant',
    dot:         'bg-md-outline',
    callout:     'bg-md-surface-variant border-md-outline text-md-on-surface-variant',
    iconColor:   'text-md-outline',
  },
  2: {
    label:       'Low',
    Icon:        Info,
    gutter:      'border-md-tertiary bg-md-tertiary-container text-md-on-tertiary-container',
    gutterHover: 'hover:brightness-95',
    gutterActive:'brightness-90 ring-2 ring-md-tertiary',
    highlight:   'bg-md-tertiary-container/30',
    highlightActive: 'bg-md-tertiary-container/60 ring-2 ring-inset ring-md-tertiary',
    pill:        'bg-md-tertiary-container text-md-on-tertiary-container',
    dot:         'bg-md-tertiary',
    callout:     'bg-md-tertiary-container border-md-tertiary text-md-on-tertiary-container',
    iconColor:   'text-md-tertiary',
  },
  3: {
    label:       'Moderate',
    Icon:        AlertTriangle,
    gutter:      'border-md-primary bg-md-primary-container text-md-on-primary-container',
    gutterHover: 'hover:brightness-95',
    gutterActive:'brightness-90 ring-2 ring-md-primary',
    highlight:   'bg-md-primary-container/30',
    highlightActive: 'bg-md-primary-container/50 ring-2 ring-inset ring-md-primary',
    pill:        'bg-md-primary-container text-md-on-primary-container',
    dot:         'bg-md-primary',
    callout:     'bg-md-primary-container border-md-primary text-md-on-primary-container',
    iconColor:   'text-md-primary',
  },
  4: {
    label:       'High',
    Icon:        ShieldAlert,
    gutter:      'border-md-secondary bg-md-secondary-container text-md-on-secondary-container',
    gutterHover: 'hover:brightness-95',
    gutterActive:'brightness-90 ring-2 ring-md-secondary',
    highlight:   'bg-md-secondary-container/30',
    highlightActive: 'bg-md-secondary-container/50 ring-2 ring-inset ring-md-secondary',
    pill:        'bg-md-secondary-container text-md-on-secondary-container',
    dot:         'bg-md-secondary',
    callout:     'bg-md-secondary-container border-md-secondary text-md-on-secondary-container',
    iconColor:   'text-md-secondary',
  },
  5: {
    label:       'Critical',
    Icon:        AlertOctagon,
    gutter:      'border-md-error bg-md-error-container text-md-on-error-container',
    gutterHover: 'hover:brightness-95',
    gutterActive:'brightness-90 ring-2 ring-md-error',
    highlight:   'bg-md-error-container/30',
    highlightActive: 'bg-md-error-container/50 ring-2 ring-inset ring-md-error',
    pill:        'bg-md-error-container text-md-on-error-container',
    dot:         'bg-md-error',
    callout:     'bg-md-error-container border-md-error text-md-on-error-container',
    iconColor:   'text-md-error',
  },
} as const

type Level = keyof typeof RISK_CONFIG

function getRiskConfig(level: number) {
  const clamped = Math.min(5, Math.max(1, Math.round(level))) as Level
  return RISK_CONFIG[clamped]
}

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────
interface DocumentPreviewWithAnnotationsProps {
  /** The ordered list of analysed clauses. */
  analysis: RiskAnalysis[]
  /**
   * Optional raw extracted text for the full document.
   * When provided, clauses are highlighted within it (future: exact match).
   * MVP: ignored, we render clauses directly as document segments.
   *
   * TODO (production): pass PDF blob/URL here, render with pdfjs-dist,
   *   and overlay annotation pins by page+bbox coordinates.
   */
  extractedText?: string | null
  /** Optional doc title for accessibility labels. */
  documentTitle?: string
}

// ─────────────────────────────────────────────────────────
// Sub-component: a single annotated clause row
// ─────────────────────────────────────────────────────────
interface ClauseBlockProps {
  item: RiskAnalysis
  index: number
  total: number
  isSelected: boolean
  isExpanded: boolean
  onSelect: (index: number) => void
  onToggleExpand: (index: number) => void
  blockRef: (el: HTMLDivElement | null) => void
  annotationRef: (el: HTMLButtonElement | null) => void
}

function ClauseBlock({
  item,
  index,
  total,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  blockRef,
  annotationRef,
}: ClauseBlockProps) {
  const cfg = getRiskConfig(item.riskLevel)
  const { Icon } = cfg

  return (
    <div
      className="group relative flex gap-0"
      role="row"
      aria-label={`Clause ${index + 1} of ${total}: ${cfg.label} risk`}
    >
      {/* ── Document text column ──────────────────────────────── */}
      <div
        ref={blockRef}
        className={[
          'flex-1 min-w-0 px-6 py-4 border-l-4 transition-all duration-short4',
          isSelected ? cfg.highlightActive : cfg.highlight,
          isSelected ? 'border-l-current' : 'border-l-transparent group-hover:border-l-current',
        ].join(' ')}
        style={isSelected ? { borderLeftColor: `var(--md-sys-color-${getRiskBorderToken(item.riskLevel)})` } : {}}
      >
        {/* Clause number chip */}
        <div className="mb-2 flex items-center gap-2">
          <span className={`text-label-sm font-semibold rounded-md-full px-2 py-0.5 ${cfg.pill}`}>
            § {index + 1}
          </span>
          <span className={`text-label-sm font-medium ${cfg.iconColor}`}>{cfg.label} risk</span>
        </div>

        {/* Clause text — rendered like document prose */}
        <p
          className="text-body-md leading-relaxed text-md-on-surface"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {item.clause}
        </p>
      </div>

      {/* ── Gutter / Annotation column ────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col justify-start px-2 py-4">
        {/* Annotation callout button */}
        <button
          ref={annotationRef}
          onClick={() => {
            onSelect(index)
            onToggleExpand(index)
          }}
          onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(index)
              onToggleExpand(index)
            }
          }}
          aria-expanded={isExpanded}
          aria-label={`${cfg.label} risk annotation for clause ${index + 1}. ${isExpanded ? 'Collapse' : 'Expand'} explanation.`}
          className={[
            'w-full text-left rounded-md-lg border p-3 transition-all duration-short4',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-md-primary',
            isSelected ? cfg.gutterActive : `${cfg.gutter} ${cfg.gutterHover}`,
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 shrink-0 ${cfg.iconColor}`} aria-hidden="true" />
            <span className="text-label-sm font-semibold truncate">{cfg.label}</span>
            <span className={`ml-auto h-5 w-5 flex items-center justify-center rounded-full text-label-sm font-bold ${cfg.pill}`}>
              {item.riskLevel}
            </span>
          </div>

          {/* Expanded explanation */}
          <div
            className={[
              'overflow-hidden transition-all duration-medium2',
              isExpanded ? 'max-h-40 mt-2 opacity-100' : 'max-h-0 opacity-0',
            ].join(' ')}
            aria-hidden={!isExpanded}
          >
            <p className="text-body-sm leading-relaxed">
              {item.explanation}
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}

function getRiskBorderToken(level: number): string {
  if (level <= 1) return 'outline'
  if (level === 2) return 'tertiary'
  if (level === 3) return 'primary'
  if (level === 4) return 'secondary'
  return 'error'
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
export default function DocumentPreviewWithAnnotations({
  analysis,
  documentTitle = 'Contract Document',
}: DocumentPreviewWithAnnotationsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // Refs to each clause block and its annotation button for scroll-to
  const blockRefs = useRef<(HTMLDivElement | null)[]>([])
  const annotationRefs = useRef<(HTMLButtonElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Ensure ref arrays match analysis length
  useEffect(() => {
    blockRefs.current = blockRefs.current.slice(0, analysis.length)
    annotationRefs.current = annotationRefs.current.slice(0, analysis.length)
  }, [analysis.length])

  const scrollToClause = useCallback((index: number) => {
    const block = blockRefs.current[index]
    if (!block) return
    block.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex(index)
    scrollToClause(index)
  }, [scrollToClause])

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedIndex(prev => prev === index ? null : index)
  }, [])

  const navigatePrev = useCallback(() => {
    if (analysis.length === 0) return
    setSelectedIndex(prev => {
      const next = prev === null ? analysis.length - 1 : Math.max(0, prev - 1)
      setExpandedIndex(next)
      setTimeout(() => scrollToClause(next), 50)
      return next
    })
  }, [analysis.length, scrollToClause])

  const navigateNext = useCallback(() => {
    if (analysis.length === 0) return
    setSelectedIndex(prev => {
      const next = prev === null ? 0 : Math.min(analysis.length - 1, prev + 1)
      setExpandedIndex(next)
      setTimeout(() => scrollToClause(next), 50)
      return next
    })
  }, [analysis.length, scrollToClause])

  // Keyboard navigation when container is focused
  const handleContainerKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); navigateNext() }
    if (e.key === 'ArrowUp'   || e.key === 'k') { e.preventDefault(); navigatePrev() }
  }, [navigateNext, navigatePrev])

  // ── Empty / fallback state ──────────────────────────────
  if (!analysis || analysis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="h-12 w-12 rounded-md-full bg-md-surface-variant flex items-center justify-center">
          <Info className="h-6 w-6 text-md-on-surface-variant" aria-hidden="true" />
        </div>
        <div>
          <p className="text-title-sm text-md-on-surface">No clauses to preview</p>
          <p className="text-body-sm text-md-on-surface-variant mt-1">
            Upload a document to see the annotated preview.
          </p>
        </div>
      </div>
    )
  }

  // Sorted for nav: highest risk first so Prev/Next goes through severity
  const highRiskIndices = analysis
    .map((a, i) => ({ i, level: a.riskLevel }))
    .filter(x => x.level >= 4)
    .sort((a, b) => b.level - a.level)
    .map(x => x.i)

  const currentPosition = selectedIndex !== null
    ? `${selectedIndex + 1} / ${analysis.length}`
    : `0 / ${analysis.length}`

  return (
    <div
      className="flex flex-col overflow-hidden rounded-md-xl"
      style={{ border: '1px solid var(--md-sys-color-outline-variant)' }}
    >
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b border-md-outline-variant"
        style={{ background: 'var(--md-sys-color-surface-2)' }}
      >
        {/* Doc icon + title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="h-6 w-6 flex items-center justify-center rounded-md-sm shrink-0"
            style={{ background: 'var(--md-sys-color-primary-container)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-md-primary" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <span className="text-label-md font-medium text-md-on-surface truncate" title={documentTitle}>
            {documentTitle}
          </span>
          <span className="text-label-sm text-md-on-surface-variant shrink-0">
            · {analysis.length} clause{analysis.length !== 1 ? 's' : ''}
          </span>
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
            disabled={analysis.length === 0}
            aria-label="Previous annotation"
            className={[
              'flex h-7 w-7 items-center justify-center rounded-md-full',
              'text-md-on-surface-variant transition-colors duration-short4',
              'hover:bg-md-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary',
              'disabled:opacity-40 disabled:pointer-events-none',
            ].join(' ')}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className="text-label-sm text-md-on-surface-variant px-1 tabular-nums min-w-[3rem] text-center">
            {currentPosition}
          </span>
          <button
            onClick={navigateNext}
            disabled={analysis.length === 0}
            aria-label="Next annotation"
            className={[
              'flex h-7 w-7 items-center justify-center rounded-md-full',
              'text-md-on-surface-variant transition-colors duration-short4',
              'hover:bg-md-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary',
              'disabled:opacity-40 disabled:pointer-events-none',
            ].join(' ')}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* High-risk jump badges */}
        {highRiskIndices.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5" aria-label={`${highRiskIndices.length} high or critical risk clause${highRiskIndices.length !== 1 ? 's' : ''}`}>
            <span className="text-label-sm text-md-error font-medium">
              {highRiskIndices.length} critical
            </span>
            <div className="flex gap-0.5">
              {highRiskIndices.slice(0, 5).map(i => (
                <button
                  key={i}
                  onClick={() => { handleSelect(i); setExpandedIndex(i) }}
                  aria-label={`Jump to clause ${i + 1}`}
                  className={[
                    'h-2 w-2 rounded-full transition-all duration-short4',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-error',
                    analysis[i].riskLevel === 5 ? 'bg-md-error' : 'bg-md-secondary',
                    selectedIndex === i ? 'scale-150' : 'hover:scale-125',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Column headers ───────────────────────────────────── */}
      <div
        className="flex items-center border-b border-md-outline-variant"
        style={{ background: 'var(--md-sys-color-surface-1)' }}
        aria-hidden="true"
      >
        <div className="flex-1 px-6 py-2">
          <span className="text-label-sm font-semibold uppercase tracking-widest text-md-on-surface-variant">
            Document · Contract Text
          </span>
        </div>
        <div className="w-64 shrink-0 px-2 py-2">
          <span className="text-label-sm font-semibold uppercase tracking-widest text-md-on-surface-variant">
            Risk Annotations
          </span>
        </div>
      </div>

      {/* ── Scrollable clause+annotation grid ───────────────── */}
      {/*
       * Keyboard nav: focus the container, then ArrowUp/Down (or j/k) to jump between clauses.
       * This mirrors code-review UX (e.g. GitHub's `j`/`k` comment navigation).
       */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto scrollbar-hide flex-1"
        style={{ maxHeight: '560px', background: 'var(--md-sys-color-surface)' }}
        role="grid"
        aria-label={`Annotated preview of ${documentTitle}`}
        tabIndex={0}
        onKeyDown={handleContainerKeyDown}
        aria-roledescription="Use arrow keys or J/K to navigate between clauses"
      >
        {analysis.map((item, index) => (
          <div
            key={`${item.clause.slice(0, 20)}-${index}`}
            className={[
              'border-b border-md-outline-variant/50 last:border-b-0',
              'transition-colors duration-short4',
            ].join(' ')}
          >
            <ClauseBlock
              item={item}
              index={index}
              total={analysis.length}
              isSelected={selectedIndex === index}
              isExpanded={expandedIndex === index}
              onSelect={handleSelect}
              onToggleExpand={handleToggleExpand}
              blockRef={el => { blockRefs.current[index] = el }}
              annotationRef={el => { annotationRefs.current[index] = el }}
            />
          </div>
        ))}
      </div>

      {/* ── Bottom summary bar ───────────────────────────────── */}
      <div
        className="flex items-center gap-4 flex-wrap px-4 py-2 border-t border-md-outline-variant"
        style={{ background: 'var(--md-sys-color-surface-2)' }}
        aria-label="Risk distribution summary"
      >
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
        <span className="ml-auto text-label-sm text-md-on-surface-variant">
          Press <kbd className="rounded px-1 py-0.5 text-label-sm font-mono bg-md-surface-variant text-md-on-surface-variant border border-md-outline-variant">↑</kbd>
          <kbd className="rounded px-1 py-0.5 text-label-sm font-mono bg-md-surface-variant text-md-on-surface-variant border border-md-outline-variant ml-0.5">↓</kbd>
          {' '}to navigate
        </span>
      </div>
    </div>
  )
}
