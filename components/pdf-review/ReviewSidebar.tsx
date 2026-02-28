'use client'

/**
 * ReviewSidebar
 *
 * Navigable list of all resolved clauses with:
 *  • Severity filter bar (All / Critical / High / Medium / Low)
 *  • Sorted by risk level (high → low) by default
 *  • Each row: severity chip, clause text preview, explanation, page location
 *  • Selected row scrolls into view and highlights with M3 surface-3 state layer
 *  • Prev/Next navigation buttons and keyboard support (ArrowUp/Down)
 *  • Match kind badge (Exact / Approx) for transparency
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
} from 'react'
import {
  ShieldCheck,
  Info,
  AlertTriangle,
  ShieldAlert,
  AlertOctagon,
  ChevronUp,
  ChevronDown,
  Filter,
} from 'lucide-react'
import type { ResolvedClause, SeverityFilter } from './types'

// ─── Risk config ──────────────────────────────────────────────────────────────
const RISK_CFG = {
  1: {
    label: 'Minimal',
    Icon: ShieldCheck,
    dot:   'bg-md-outline',
    chip:  'bg-md-surface-variant text-md-on-surface-variant border-md-outline',
    row:   'hover:bg-md-surface-variant',
    selBg: 'var(--md-sys-color-surface-variant)',
    selBorder: 'var(--md-sys-color-outline)',
    filter: 'low' as SeverityFilter,
  },
  2: {
    label: 'Low',
    Icon: Info,
    dot:   'bg-md-tertiary',
    chip:  'bg-md-tertiary-container text-md-on-tertiary-container border-md-tertiary',
    row:   'hover:bg-md-tertiary-container/30',
    selBg: 'var(--md-sys-color-tertiary-container)',
    selBorder: 'var(--md-sys-color-tertiary)',
    filter: 'low' as SeverityFilter,
  },
  3: {
    label: 'Moderate',
    Icon: AlertTriangle,
    dot:   'bg-md-primary',
    chip:  'bg-md-primary-container text-md-on-primary-container border-md-primary',
    row:   'hover:bg-md-primary-container/30',
    selBg: 'var(--md-sys-color-primary-container)',
    selBorder: 'var(--md-sys-color-primary)',
    filter: 'medium' as SeverityFilter,
  },
  4: {
    label: 'High',
    Icon: ShieldAlert,
    dot:   'bg-md-secondary',
    chip:  'bg-md-secondary-container text-md-on-secondary-container border-md-secondary',
    row:   'hover:bg-md-secondary-container/30',
    selBg: 'var(--md-sys-color-secondary-container)',
    selBorder: 'var(--md-sys-color-secondary)',
    filter: 'high' as SeverityFilter,
  },
  5: {
    label: 'Critical',
    Icon: AlertOctagon,
    dot:   'bg-md-error',
    chip:  'bg-md-error-container text-md-on-error-container border-md-error',
    row:   'hover:bg-md-error-container/30',
    selBg: 'var(--md-sys-color-error-container)',
    selBorder: 'var(--md-sys-color-error)',
    filter: 'critical' as SeverityFilter,
  },
} as const

type Level = keyof typeof RISK_CFG

function riskCfg(level: number) {
  return RISK_CFG[Math.min(5, Math.max(1, Math.round(level))) as Level]
}

// ─── Severity filter helpers ──────────────────────────────────────────────────
const FILTER_LABELS: { key: SeverityFilter; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'critical', label: 'Critical' },
  { key: 'high',     label: 'High'     },
  { key: 'medium',   label: 'Medium'   },
  { key: 'low',      label: 'Low'      },
]

function matchesFilter(c: ResolvedClause, f: SeverityFilter): boolean {
  if (f === 'all')      return true
  if (f === 'critical') return c.analysis.riskLevel === 5
  if (f === 'high')     return c.analysis.riskLevel === 4
  if (f === 'medium')   return c.analysis.riskLevel === 3
  if (f === 'low')      return c.analysis.riskLevel <= 2
  return true
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ReviewSidebarProps {
  clauses: ResolvedClause[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  totalPages: number
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReviewSidebar({
  clauses,
  selectedIndex,
  onSelect,
  totalPages,
}: ReviewSidebarProps) {
  const [filter, setFilter] = useState<SeverityFilter>('all')
  const listRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Sorted: highest risk first
  const sorted = [...clauses].sort((a, b) => b.analysis.riskLevel - a.analysis.riskLevel)
  const visible = sorted.filter(c => matchesFilter(c, filter))

  // Counts per filter
  const counts: Record<SeverityFilter, number> = {
    all:      clauses.length,
    critical: clauses.filter(c => c.analysis.riskLevel === 5).length,
    high:     clauses.filter(c => c.analysis.riskLevel === 4).length,
    medium:   clauses.filter(c => c.analysis.riskLevel === 3).length,
    low:      clauses.filter(c => c.analysis.riskLevel <= 2).length,
  }

  // Scroll selected row into view
  useEffect(() => {
    if (selectedIndex === null) return
    const el = rowRefs.current.get(selectedIndex)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedIndex])

  // Keyboard navigation within the sidebar list
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const visibleIndices = visible.map(c => c.index)
      const current = visibleIndices.indexOf(selectedIndex ?? -1)
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        const next = current < visibleIndices.length - 1 ? current + 1 : 0
        onSelect(visibleIndices[next])
      }
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        const prev = current > 0 ? current - 1 : visibleIndices.length - 1
        onSelect(visibleIndices[prev])
      }
    },
    [visible, selectedIndex, onSelect],
  )

  const navigatePrev = () => {
    const indices = visible.map(c => c.index)
    if (!indices.length) return
    const cur = indices.indexOf(selectedIndex ?? -1)
    onSelect(indices[cur > 0 ? cur - 1 : indices.length - 1])
  }

  const navigateNext = () => {
    const indices = visible.map(c => c.index)
    if (!indices.length) return
    const cur = indices.indexOf(selectedIndex ?? -1)
    onSelect(indices[cur < indices.length - 1 ? cur + 1 : 0])
  }

  const currentPos = (() => {
    if (selectedIndex === null) return null
    const idx = visible.findIndex(c => c.index === selectedIndex)
    return idx === -1 ? null : `${idx + 1} / ${visible.length}`
  })()

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--md-sys-color-surface-1)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-md-outline-variant shrink-0"
        style={{ background: 'var(--md-sys-color-surface-2)' }}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-md-on-surface-variant" aria-hidden="true" />
          <span className="text-label-md font-semibold text-md-on-surface uppercase tracking-wider">
            Review
          </span>
          <span className="text-label-sm text-md-on-surface-variant">
            {clauses.length} clause{clauses.length !== 1 ? 's' : ''} · {totalPages} page{totalPages !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Prev / Next navigation */}
        <div
          className="flex items-center gap-0.5 rounded-md-full border border-md-outline-variant px-0.5"
          style={{ background: 'var(--md-sys-color-surface-1)' }}
          role="group"
          aria-label="Navigate clauses"
        >
          <button
            onClick={navigatePrev}
            disabled={!visible.length}
            aria-label="Previous clause"
            className="flex h-7 w-7 items-center justify-center rounded-md-full text-md-on-surface-variant
              transition-colors hover:bg-md-surface-variant
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary
              disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <span className="text-label-sm text-md-on-surface-variant tabular-nums min-w-[3rem] text-center">
            {currentPos ?? `– / ${visible.length}`}
          </span>
          <button
            onClick={navigateNext}
            disabled={!visible.length}
            aria-label="Next clause"
            className="flex h-7 w-7 items-center justify-center rounded-md-full text-md-on-surface-variant
              transition-colors hover:bg-md-surface-variant
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary
              disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Severity filter bar ── */}
      <div
        className="flex gap-1 px-3 py-2 border-b border-md-outline-variant overflow-x-auto scrollbar-hide shrink-0"
        style={{ background: 'var(--md-sys-color-surface-1)' }}
        role="group"
        aria-label="Filter by severity"
      >
        {FILTER_LABELS.map(({ key, label }) => {
          const active  = filter === key
          const count   = counts[key]
          const hasCrit = key === 'critical' && count > 0
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className={[
                'flex items-center gap-1 rounded-md-full px-2.5 py-1 text-label-sm font-medium whitespace-nowrap shrink-0',
                'transition-all duration-short4',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary',
                active
                  ? 'bg-md-primary text-md-on-primary shadow-md-1'
                  : 'bg-md-surface-variant text-md-on-surface-variant hover:bg-md-surface-2',
              ].join(' ')}
            >
              {hasCrit && !active && (
                <span className="h-1.5 w-1.5 rounded-full bg-md-error" aria-hidden="true" />
              )}
              {label}
              <span className={[
                'rounded-md-full px-1 text-label-sm',
                active ? 'bg-md-on-primary/20 text-md-on-primary' : 'text-md-on-surface-variant',
              ].join(' ')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Clause list ── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
        role="listbox"
        aria-label="Clause list"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
            <span className="text-body-md text-md-on-surface-variant">
              No clauses match the current filter.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-md-outline-variant">
            {visible.map((clause) => {
              const c         = riskCfg(clause.analysis.riskLevel)
              const { Icon }  = c
              const isSelected = selectedIndex === clause.index
              const isApprox   = clause.anchor.matchKind === 'fallback'

              return (
                <div
                  key={clause.index}
                  ref={el => {
                    if (el) rowRefs.current.set(clause.index, el)
                    else rowRefs.current.delete(clause.index)
                  }}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => onSelect(clause.index)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(clause.index) } }}
                  style={{
                    background:  isSelected ? c.selBg : undefined,
                    borderLeft:  isSelected ? `3px solid ${c.selBorder}` : '3px solid transparent',
                    cursor:      'pointer',
                    transition:  'background 150ms, border-color 150ms',
                    outline:     'none',
                  }}
                  className={[
                    'px-4 py-3 flex items-start gap-3 group',
                    isSelected ? '' : c.row,
                    'focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-inset',
                  ].join(' ')}
                >
                  {/* Severity icon */}
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md-full border ${c.chip}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Severity + page + match badge row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`rounded-md-full border px-2 py-0.5 text-label-sm font-medium ${c.chip}`}>
                        {c.label}
                      </span>
                      <span className="text-label-sm text-md-on-surface-variant">
                        p.{clause.anchor.pageIndex + 1}
                      </span>
                      {isApprox ? (
                        <span className="text-label-sm text-md-on-surface-variant opacity-60" title="Approximate position">
                          ~approx
                        </span>
                      ) : (
                        <span className="text-label-sm text-md-tertiary opacity-80">
                          ✓ matched
                        </span>
                      )}
                    </div>

                    {/* Clause text */}
                    <p className="text-body-sm text-md-on-surface leading-relaxed line-clamp-2">
                      {clause.analysis.clause}
                    </p>

                    {/* Explanation (shown when selected) */}
                    {isSelected && (
                      <p className="text-body-sm text-md-on-surface-variant leading-relaxed mt-1">
                        {clause.analysis.explanation}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Footer: keyboard hint ── */}
      <div
        className="shrink-0 flex items-center justify-end gap-1 px-3 py-1.5 border-t border-md-outline-variant"
        style={{ background: 'var(--md-sys-color-surface-2)' }}
      >
        <span className="text-label-sm text-md-on-surface-variant">
          <kbd className="rounded px-1 text-label-sm font-mono bg-md-surface-variant text-md-on-surface-variant border border-md-outline-variant">↑</kbd>
          <kbd className="ml-0.5 rounded px-1 text-label-sm font-mono bg-md-surface-variant text-md-on-surface-variant border border-md-outline-variant">↓</kbd>
          {' '}navigate
        </span>
      </div>
    </div>
  )
}
