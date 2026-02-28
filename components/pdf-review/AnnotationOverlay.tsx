'use client'

import type { ResolvedClause } from './types'
import {
  ShieldCheck,
  Info,
  AlertTriangle,
  ShieldAlert,
  AlertOctagon,
} from 'lucide-react'

const RISK_CFG = {
  1: {
    label: 'Minimal',
    Icon: ShieldCheck,
    ring: 'var(--md-sys-color-outline)',
    bg: 'var(--md-sys-color-surface-variant)',
    text: 'var(--md-sys-color-on-surface-variant)',
    iconColor: 'var(--md-sys-color-outline)',
  },
  2: {
    label: 'Low',
    Icon: Info,
    ring: 'var(--md-sys-color-tertiary)',
    bg: 'var(--md-sys-color-tertiary-container)',
    text: 'var(--md-sys-color-on-tertiary-container)',
    iconColor: 'var(--md-sys-color-tertiary)',
  },
  3: {
    label: 'Moderate',
    Icon: AlertTriangle,
    ring: 'var(--md-sys-color-primary)',
    bg: 'var(--md-sys-color-primary-container)',
    text: 'var(--md-sys-color-on-primary-container)',
    iconColor: 'var(--md-sys-color-primary)',
  },
  4: {
    label: 'High',
    Icon: ShieldAlert,
    ring: 'var(--md-sys-color-secondary)',
    bg: 'var(--md-sys-color-secondary-container)',
    text: 'var(--md-sys-color-on-secondary-container)',
    iconColor: 'var(--md-sys-color-secondary)',
  },
  5: {
    label: 'Critical',
    Icon: AlertOctagon,
    ring: 'var(--md-sys-color-error)',
    bg: 'var(--md-sys-color-error-container)',
    text: 'var(--md-sys-color-on-error-container)',
    iconColor: 'var(--md-sys-color-error)',
  },
} as const

type Level = keyof typeof RISK_CFG
function cfg(level: number) {
  const clamped = Math.min(5, Math.max(1, Math.round(level))) as Level
  return RISK_CFG[clamped]
}

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

  const x = Math.max(8, clause.anchor.xFraction * pageWidth)
  const y = Math.max(8, clause.anchor.yFraction * pageHeight)
  const w = Math.max(32, clause.anchor.wFraction * pageWidth)
  const h = Math.max(12, clause.anchor.hFraction * pageHeight)
  const isApprox = clause.anchor.matchKind === 'fallback' || clause.anchor.matchKind === 'fuzzy'
  const canUnderline = clause.anchor.matchKind === 'exact' || clause.anchor.matchKind === 'normalized'

  const chipWidth = 210
  const leftForChip = Math.max(8, Math.min(x, pageWidth - chipWidth - 8))
  const topForChip = Math.max(8, y - 44)

  return (
    <>
      {/* Severity underline over the matched clause (only reliable matches) */}
      {canUnderline && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: x,
            top: y + Math.max(2, h * 0.92),
            width: Math.min(Math.max(28, w), pageWidth - x - 8),
            height: isSelected ? 4 : 3,
            borderRadius: 999,
            background: c.ring,
            opacity: isSelected ? 0.95 : 0.78,
            boxShadow: isSelected ? `0 0 0 1px ${c.ring}` : 'none',
            zIndex: 9,
          }}
        />
      )}

      {/* Connector from chip down to underline */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: leftForChip + 18,
          top: topForChip + 28,
          width: 1,
          height: Math.max(8, y - (topForChip + 28)),
          background: c.ring,
          opacity: 0.7,
          zIndex: 10,
        }}
      />

      {/* Comment chip ABOVE the clause */}
      <button
        onClick={() => onSelect(clause.index)}
        aria-label={`${c.label} risk: ${clause.analysis.clause.slice(0, 80)}`}
        aria-pressed={isSelected}
        style={{
          position: 'absolute',
          left: leftForChip,
          top: topForChip,
          width: chipWidth,
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.ring}`,
          borderRadius: 10,
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          textAlign: 'left',
          cursor: 'pointer',
          zIndex: 11,
          boxShadow: isSelected
            ? `0 0 0 2px ${c.ring}, 0 3px 10px color-mix(in srgb, ${c.ring} 25%, transparent)`
            : '0 1px 4px color-mix(in srgb, var(--md-sys-color-shadow) 12%, transparent)',
        }}
      >
        <Icon style={{ width: 12, height: 12, color: c.iconColor, flexShrink: 0 }} aria-hidden="true" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{c.label}</span>
            {isApprox && <span style={{ fontSize: 10, opacity: 0.6 }}>~</span>}
          </div>
          <p
            style={{
              fontSize: 10,
              lineHeight: 1.3,
              marginTop: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {clause.analysis.clause.slice(0, 58)}
          </p>
        </div>
      </button>
    </>
  )
}

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
    <div className="absolute inset-0 pointer-events-none" aria-label={`Annotations for page ${pageIndex + 1}`}>
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
