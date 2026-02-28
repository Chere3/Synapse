'use client'

/**
 * AnnotationOverlay
 *
 * Renders risk annotations on top of a PDF page using pixel-accurate highlights.
 *
 * Highlight strategy (per clause):
 *  1. DOM-based (exact):   Use resolveHighlightRects() to find the actual text
 *     layer <span> nodes matching the clause, then call Range.getClientRects()
 *     for pixel-accurate multi-line highlight rectangles.
 *  2. Fractional fallback: When no DOM match is found, draw a coloured underline
 *     at the fractional position from TextAnchorEngine. Shown with a "~" badge
 *     to communicate the approximation to the user.
 *
 * The comment chip is anchored above the topmost highlight rect (or fallback
 * position) so the callout is always visually attached to the highlighted text.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { ResolvedClause, HighlightRect } from './types'
import { resolveHighlightRects } from './TextAnchorEngine'
import {
  ShieldCheck,
  Info,
  AlertTriangle,
  ShieldAlert,
  AlertOctagon,
} from 'lucide-react'

// ─── Risk severity config ─────────────────────────────────────────────────────
const RISK_CFG = {
  1: {
    label: 'Minimal',
    Icon: ShieldCheck,
    ring:     'var(--md-sys-color-outline)',
    bg:       'var(--md-sys-color-surface-variant)',
    text:     'var(--md-sys-color-on-surface-variant)',
    iconColor:'var(--md-sys-color-outline)',
    highlight:'color-mix(in srgb, var(--md-sys-color-outline) 18%, transparent)',
  },
  2: {
    label: 'Low',
    Icon: Info,
    ring:     'var(--md-sys-color-tertiary)',
    bg:       'var(--md-sys-color-tertiary-container)',
    text:     'var(--md-sys-color-on-tertiary-container)',
    iconColor:'var(--md-sys-color-tertiary)',
    highlight:'color-mix(in srgb, var(--md-sys-color-tertiary) 22%, transparent)',
  },
  3: {
    label: 'Moderate',
    Icon: AlertTriangle,
    ring:     'var(--md-sys-color-primary)',
    bg:       'var(--md-sys-color-primary-container)',
    text:     'var(--md-sys-color-on-primary-container)',
    iconColor:'var(--md-sys-color-primary)',
    highlight:'color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent)',
  },
  4: {
    label: 'High',
    Icon: ShieldAlert,
    ring:     'var(--md-sys-color-secondary)',
    bg:       'var(--md-sys-color-secondary-container)',
    text:     'var(--md-sys-color-on-secondary-container)',
    iconColor:'var(--md-sys-color-secondary)',
    highlight:'color-mix(in srgb, var(--md-sys-color-secondary) 28%, transparent)',
  },
  5: {
    label: 'Critical',
    Icon: AlertOctagon,
    ring:     'var(--md-sys-color-error)',
    bg:       'var(--md-sys-color-error-container)',
    text:     'var(--md-sys-color-on-error-container)',
    iconColor:'var(--md-sys-color-error)',
    highlight:'color-mix(in srgb, var(--md-sys-color-error) 30%, transparent)',
  },
} as const

type Level = keyof typeof RISK_CFG
function cfg(level: number) {
  const clamped = Math.min(5, Math.max(1, Math.round(level))) as Level
  return RISK_CFG[clamped]
}

// ─── Per-clause resolved highlight state ─────────────────────────────────────
interface ResolvedHighlight {
  clauseIndex: number
  rects: HighlightRect[]      // empty = use fractional fallback
  isExact: boolean            // true = came from DOM resolution
}

// ─── Individual annotation pin ────────────────────────────────────────────────
interface PinProps {
  clause:      ResolvedClause
  highlight:   ResolvedHighlight
  isSelected:  boolean
  pageWidth:   number
  pageHeight:  number
  onSelect:    (index: number) => void
}

function AnnotationPin({
  clause,
  highlight,
  isSelected,
  pageWidth,
  pageHeight,
  onSelect,
}: PinProps) {
  const c = cfg(clause.analysis.riskLevel)
  const { Icon } = c
  const isApprox = !highlight.isExact

  // ── Chip positioning ─────────────────────────────────────────────────────────
  // If we have exact rects, anchor chip above the topmost rect.
  // Otherwise fall back to fractional position from TextAnchor.
  let chipAnchorTop: number
  let chipAnchorLeft: number

  if (highlight.isExact && highlight.rects.length > 0) {
    const topRect = highlight.rects.reduce((a, b) => (a.top < b.top ? a : b))
    chipAnchorTop  = topRect.top
    chipAnchorLeft = topRect.left
  } else {
    chipAnchorTop  = Math.max(8, clause.anchor.yFraction * pageHeight)
    chipAnchorLeft = Math.max(8, clause.anchor.xFraction * pageWidth)
  }

  const chipWidth  = 210
  const chipHeight = 46
  const leftForChip = Math.max(8, Math.min(chipAnchorLeft, pageWidth - chipWidth - 8))
  const topForChip  = Math.max(8, chipAnchorTop - chipHeight - 6)

  // Connector from chip bottom to first highlight rect (or fallback line)
  const connectorBottom = chipAnchorTop
  const connectorTop    = topForChip + chipHeight
  const connectorHeight = Math.max(0, connectorBottom - connectorTop)

  return (
    <>
      {/* ── Exact highlights (DOM-based, multi-line) ── */}
      {highlight.isExact && highlight.rects.map((r, ri) => (
        <div
          key={ri}
          aria-hidden="true"
          style={{
            position:     'absolute',
            left:         r.left,
            top:          r.top,
            width:        r.width,
            height:       r.height,
            background:   c.highlight,
            border:       isSelected ? `1px solid ${c.ring}` : 'none',
            borderRadius: 2,
            zIndex:       8,
            pointerEvents:'none',
            transition:   'background 200ms, border 200ms',
          }}
        />
      ))}

      {/* ── Fractional fallback underline (when no DOM match) ── */}
      {!highlight.isExact && (
        <div
          aria-hidden="true"
          style={{
            position:     'absolute',
            left:         Math.max(8, clause.anchor.xFraction * pageWidth),
            top:          Math.max(8, clause.anchor.yFraction * pageHeight)
                           + Math.max(2, clause.anchor.hFraction * pageHeight * 0.92),
            width:        Math.min(
                            Math.max(28, clause.anchor.wFraction * pageWidth),
                            pageWidth - clause.anchor.xFraction * pageWidth - 8,
                          ),
            height:       isSelected ? 4 : 3,
            borderRadius: 999,
            background:   c.ring,
            opacity:      isSelected ? 0.85 : 0.6,
            zIndex:       8,
            pointerEvents:'none',
          }}
        />
      )}

      {/* ── Connector line ── */}
      {connectorHeight > 4 && (
        <div
          aria-hidden="true"
          style={{
            position:   'absolute',
            left:       leftForChip + 18,
            top:        connectorTop,
            width:      1,
            height:     connectorHeight,
            background: c.ring,
            opacity:    0.55,
            zIndex:     9,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Comment chip ABOVE the clause ── */}
      <button
        onClick={() => onSelect(clause.index)}
        aria-label={`${c.label} risk: ${clause.analysis.clause.slice(0, 80)}`}
        aria-pressed={isSelected}
        style={{
          position:   'absolute',
          left:       leftForChip,
          top:        topForChip,
          width:      chipWidth,
          background: c.bg,
          color:      c.text,
          border:     `1px solid ${c.ring}`,
          borderRadius: 10,
          padding:    '5px 8px',
          display:    'flex',
          alignItems: 'center',
          gap:        6,
          textAlign:  'left',
          cursor:     'pointer',
          zIndex:     11,
          boxShadow:  isSelected
            ? `0 0 0 2px ${c.ring}, 0 3px 10px color-mix(in srgb, ${c.ring} 25%, transparent)`
            : '0 1px 4px color-mix(in srgb, var(--md-sys-color-shadow) 12%, transparent)',
        }}
      >
        <Icon
          style={{ width: 12, height: 12, color: c.iconColor, flexShrink: 0 }}
          aria-hidden="true"
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>
              {c.label}
            </span>
            {isApprox && (
              <span
                style={{ fontSize: 10, opacity: 0.6 }}
                title="Approximate position — exact text match not found"
              >
                ~
              </span>
            )}
          </div>
          <p
            style={{
              fontSize:     10,
              lineHeight:   1.3,
              marginTop:    1,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
          >
            {clause.analysis.clause.slice(0, 58)}
          </p>
        </div>
      </button>
    </>
  )
}

// ─── Main overlay component ───────────────────────────────────────────────────
interface AnnotationOverlayProps {
  clauses:       ResolvedClause[]
  pageIndex:     number
  pageWidth:     number
  pageHeight:    number
  selectedIndex: number | null
  onSelect:      (index: number) => void
  /** The rendered text layer div for this page (from PdfPageRenderer). */
  textLayerEl?:  HTMLDivElement | null
  /** Incremented after every text layer re-render; used to trigger re-resolution. */
  textLayerStamp?: number
}

export default function AnnotationOverlay({
  clauses,
  pageIndex,
  pageWidth,
  pageHeight,
  selectedIndex,
  onSelect,
  textLayerEl,
  textLayerStamp,
}: AnnotationOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [highlights, setHighlights] = useState<Map<number, ResolvedHighlight>>(new Map())

  const pageClauses = useMemo(
    () => clauses.filter(c => c.anchor.pageIndex === pageIndex),
    [clauses, pageIndex],
  )

  // ── Compute highlight rects whenever text layer becomes available ─────────
  const computeHighlights = useCallback(() => {
    if (!textLayerEl || !overlayRef.current || pageClauses.length === 0) return

    const overlayEl = overlayRef.current
    const next = new Map<number, ResolvedHighlight>()

    for (const clause of pageClauses) {
      const rects = resolveHighlightRects(
        textLayerEl,
        overlayEl,
        clause.analysis.clause,
      )
      next.set(clause.index, {
        clauseIndex: clause.index,
        rects:       rects ?? [],
        isExact:     rects !== null && rects.length > 0,
      })
    }

    setHighlights(prev => {
      const sig = (m: Map<number, ResolvedHighlight>) => JSON.stringify(
        Array.from(m.entries()).map(([k, v]) => [k, v.isExact, v.rects.map(r => [r.left, r.top, r.width, r.height])]),
      )
      return sig(prev) === sig(next) ? prev : next
    })
  }, [textLayerEl, pageClauses]) // eslint-disable-line react-hooks/exhaustive-deps

  // Run after DOM has updated (layout effect so rects are fresh)
  useLayoutEffect(() => {
    computeHighlights()
  }, [computeHighlights, textLayerStamp])

  // Also recompute on window resize (e.g. user zooms browser)
  useEffect(() => {
    const onResize = () => computeHighlights()
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [computeHighlights])

  if (pageClauses.length === 0) return null

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none"
      aria-label={`Annotations for page ${pageIndex + 1}`}
    >
      {pageClauses.map(clause => {
        const highlight = highlights.get(clause.index) ?? {
          clauseIndex: clause.index,
          rects: [],
          isExact: false,
        }
        return (
          <div key={clause.index} className="pointer-events-auto">
            <AnnotationPin
              clause={clause}
              highlight={highlight}
              isSelected={selectedIndex === clause.index}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              onSelect={onSelect}
            />
          </div>
        )
      })}
    </div>
  )
}
