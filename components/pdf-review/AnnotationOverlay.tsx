'use client'

/**
 * AnnotationOverlay
 *
 * Renders annotation pins and connector lines directly on top of a PDF page.
 * Sits as Layer 3 in PdfPageRenderer (inside the children slot).
 *
 * Visual anatomy:
 *   ┌─────────────── PDF canvas ─────────────────┐
 *   │                                            │
 *   │  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ← pin at matched position
 *   │                                  [callout] │
 *   └────────────────────────────────────────────┘
 *
 * Each pin is:
 *   • A circle with a severity-coloured border (M3 tokens)
 *   • A horizontal connector line to a compact callout chip
 *   • The chip shows severity label + truncated clause text
 *
 * Interaction:
 *   • Click pin or chip → selects annotation (reports via onSelect)
 *   • Selected state gets a ring + shadow (keyboard-accessible)
 */

import type { ResolvedClause } from './types'
import {
  ShieldCheck,
  Info,
  AlertTriangle,
  ShieldAlert,
  AlertOctagon,
} from 'lucide-react'

// ─── Risk visual config (M3 semantic tokens only) ─────────────────────────────
const RISK_CFG = {
  1: {
    label: 'Minimal',
    Icon: ShieldCheck,
    ring:   'var(--md-sys-color-outline)',
    bg:     'var(--md-sys-color-surface-variant)',
    text:   'var(--md-sys-color-on-surface-variant)',
    chipBg: 'var(--md-sys-color-surface-2)',
    iconColor: 'var(--md-sys-color-outline)',
  },
  2: {
    label: 'Low',
    Icon: Info,
    ring:   'var(--md-sys-color-tertiary)',
    bg:     'var(--md-sys-color-tertiary-container)',
    text:   'var(--md-sys-color-on-tertiary-container)',
    chipBg: 'var(--md-sys-color-tertiary-container)',
    iconColor: 'var(--md-sys-color-tertiary)',
  },
  3: {
    label: 'Moderate',
    Icon: AlertTriangle,
    ring:   'var(--md-sys-color-primary)',
    bg:     'var(--md-sys-color-primary-container)',
    text:   'var(--md-sys-color-on-primary-container)',
    chipBg: 'var(--md-sys-color-primary-container)',
    iconColor: 'var(--md-sys-color-primary)',
  },
  4: {
    label: 'High',
    Icon: ShieldAlert,
    ring:   'var(--md-sys-color-secondary)',
    bg:     'var(--md-sys-color-secondary-container)',
    text:   'var(--md-sys-color-on-secondary-container)',
    chipBg: 'var(--md-sys-color-secondary-container)',
    iconColor: 'var(--md-sys-color-secondary)',
  },
  5: {
    label: 'Critical',
    Icon: AlertOctagon,
    ring:   'var(--md-sys-color-error)',
    bg:     'var(--md-sys-color-error-container)',
    text:   'var(--md-sys-color-on-error-container)',
    chipBg: 'var(--md-sys-color-error-container)',
    iconColor: 'var(--md-sys-color-error)',
  },
} as const

type Level = keyof typeof RISK_CFG

function cfg(level: number) {
  const clamped = Math.min(5, Math.max(1, Math.round(level))) as Level
  return RISK_CFG[clamped]
}

// ─── Single pin ───────────────────────────────────────────────────────────────
interface PinProps {
  clause: ResolvedClause
  isSelected: boolean
  pageWidth: number
  pageHeight: number
  onSelect: (index: number) => void
}

function AnnotationPin({ clause, isSelected, pageWidth, pageHeight, onSelect }: PinProps) {
  const c = cfg(clause.analysis.riskLevel)
  const { Icon } = c

  const topPx    = clause.anchor.yFraction * pageHeight
  const isApprox = clause.anchor.matchKind === 'fallback'

  // Pin sits at right side of page; callout extends further right
  // We place the pin in the gutter (right=0, translateX to push outside)
  return (
    <div
      className="absolute"
      style={{
        top:   Math.max(0, topPx - 14),
        right: 0,
        // width extends into the right gutter outside the canvas
        width: 0,
        zIndex: 10,
      }}
      aria-hidden="false"
    >
      {/* Horizontal connector line */}
      <div
        style={{
          position:   'absolute',
          top:        14,
          left:       0,
          width:      12,
          height:     1,
          background: 'var(--md-sys-color-outline-variant)',
        }}
        aria-hidden="true"
      />

      {/* Callout chip */}
      <button
        onClick={() => onSelect(clause.index)}
        aria-label={`${c.label} risk: ${clause.analysis.clause.slice(0, 80)}`}
        aria-pressed={isSelected}
        style={{
          position:        'absolute',
          top:             0,
          left:            12,
          background:      c.chipBg,
          color:           c.text,
          border:          `1px solid ${c.ring}`,
          boxShadow:       isSelected
            ? `0 0 0 2px ${c.ring}, 0 2px 6px color-mix(in srgb, ${c.ring} 30%, transparent)`
            : '0 1px 3px color-mix(in srgb, var(--md-sys-color-shadow) 15%, transparent)',
          borderRadius:    8,
          padding:         '3px 8px 3px 6px',
          display:         'flex',
          alignItems:      'center',
          gap:             5,
          cursor:          'pointer',
          minWidth:        130,
          maxWidth:        210,
          transition:      'box-shadow 150ms, transform 150ms',
          transform:       isSelected ? 'scale(1.03)' : 'scale(1)',
          outline:         'none',
        }}
        onFocus={e => { (e.currentTarget as HTMLButtonElement).style.outline = `2px solid var(--md-sys-color-primary)` }}
        onBlur={e  => { (e.currentTarget as HTMLButtonElement).style.outline = 'none' }}
      >
        <Icon
          style={{ width: 12, height: 12, color: c.iconColor, flexShrink: 0 }}
          aria-hidden="true"
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>
              {c.label}
            </span>
            {isApprox && (
              <span
                style={{ fontSize: 10, opacity: 0.6 }}
                title="Approximate position — clause not matched verbatim in PDF"
              >
                ~
              </span>
            )}
          </div>
          <p
            style={{
              fontSize:     10,
              lineHeight:   1.4,
              opacity:      0.8,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
              maxWidth:     180,
            }}
          >
            {clause.analysis.clause.slice(0, 50)}
          </p>
        </div>
      </button>
    </div>
  )
}

// ─── Page overlay (renders all pins for one page) ─────────────────────────────
interface AnnotationOverlayProps {
  clauses: ResolvedClause[]
  pageIndex: number
  pageWidth: number
  pageHeight: number
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export default function AnnotationOverlay({
  clauses,
  pageIndex,
  pageWidth,
  pageHeight,
  selectedIndex,
  onSelect,
}: AnnotationOverlayProps) {
  const pageClauses = clauses.filter(c => c.anchor.pageIndex === pageIndex)
  if (pageClauses.length === 0) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-label={`Annotations for page ${pageIndex + 1}`}
    >
      {pageClauses.map(clause => (
        <div key={clause.index} className="pointer-events-auto">
          <AnnotationPin
            clause={clause}
            isSelected={selectedIndex === clause.index}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  )
}
