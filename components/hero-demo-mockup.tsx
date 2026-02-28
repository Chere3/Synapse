'use client'

import { useEffect, useState } from 'react'

/* ─────────────────────────────────────────────
   Animated progress bar (CSS-driven)
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Clause row
───────────────────────────────────────────── */
type RiskLevel = 'low' | 'medium' | 'high'
interface ClauseItem {
  name: string
  risk: RiskLevel
  note: string
}

const riskConfig: Record<RiskLevel, { label: string; dot: string; badge: string; bar: string; barPct: number }> = {
  low:    { label: 'Low Risk',    dot: 'bg-md-tertiary',   badge: 'bg-md-tertiary-container text-md-on-tertiary-container',    bar: 'bg-md-tertiary',   barPct: 22 },
  medium: { label: 'Medium Risk', dot: 'bg-md-secondary',  badge: 'bg-md-secondary-container text-md-on-secondary-container',  bar: 'bg-md-secondary',  barPct: 55 },
  high:   { label: 'High Risk',   dot: 'bg-md-error',      badge: 'bg-md-error-container text-md-on-error-container',          bar: 'bg-md-error',      barPct: 88 },
}

function ClauseRow({ clause, index }: { clause: ClauseItem; index: number }) {
  const cfg = riskConfig[clause.risk]
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-label-md text-md-on-surface">{clause.name}</span>
          <span className={`shrink-0 rounded-md-full px-2 py-0.5 text-label-sm font-medium ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <p className="mt-0.5 text-body-sm text-md-on-surface-variant">{clause.note}</p>
        <RiskBar value={cfg.barPct} colorClass={cfg.bar} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Circular risk score dial
───────────────────────────────────────────── */
function RiskDial({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 500)
    return () => clearTimeout(t)
  }, [score])

  const radius = 36
  const circ = 2 * Math.PI * radius
  const pct = animated / 100
  const dash = circ * pct
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

/* ─────────────────────────────────────────────
   Typing animation for "Analysing…"
───────────────────────────────────────────── */
function StatusBadge() {
  const [phase, setPhase] = useState<'scanning' | 'done'>('scanning')
  useEffect(() => {
    const t = setTimeout(() => setPhase('done'), 2200)
    return () => clearTimeout(t)
  }, [])
  return phase === 'scanning' ? (
    <span className="inline-flex items-center gap-1.5 rounded-md-full bg-md-secondary-container px-3 py-1 text-label-sm text-md-on-secondary-container">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-md-secondary" />
      Analysing document…
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md-full bg-md-tertiary-container px-3 py-1 text-label-sm text-md-on-tertiary-container">
      <span className="h-1.5 w-1.5 rounded-full bg-md-tertiary" />
      Analysis complete · 28s
    </span>
  )
}

/* ─────────────────────────────────────────────
   Main mockup component
───────────────────────────────────────────── */
const clauses: ClauseItem[] = [
  { name: 'Indemnification',        risk: 'high',   note: 'Broad liability exposure — recommend negotiation' },
  { name: 'Termination for Cause',  risk: 'medium', note: 'Ambiguous "material breach" definition' },
  { name: 'Intellectual Property',  risk: 'medium', note: 'Work-for-hire scope needs clarification' },
  { name: 'Confidentiality / NDA',  risk: 'low',    note: 'Standard bilateral obligations — acceptable' },
  { name: 'Force Majeure',          risk: 'low',    note: 'Comprehensive coverage, well-drafted' },
]

export function HeroDemoMockup() {
  return (
    /* Browser chrome wrapper */
    <div
      className="relative w-full overflow-hidden rounded-md-xl shadow-md-3"
      style={{ background: 'var(--md-sys-color-surface-1)', border: '1px solid var(--md-sys-color-outline-variant)' }}
      role="img"
      aria-label="Synapse contract analysis dashboard showing a service agreement with 28-point risk score and clause-level breakdown"
    >
      {/* Window chrome bar */}
      <div
        className="flex items-center gap-2 border-b border-md-outline-variant px-4 py-3"
        style={{ background: 'var(--md-sys-color-surface-2)' }}
      >
        <span className="h-3 w-3 rounded-full" style={{ background: 'var(--md-sys-color-error-container)' }} />
        <span className="h-3 w-3 rounded-full" style={{ background: 'var(--md-sys-color-secondary-container)' }} />
        <span className="h-3 w-3 rounded-full" style={{ background: 'var(--md-sys-color-tertiary-container)' }} />
        <div
          className="ml-3 flex-1 rounded-md-sm px-3 py-1 text-label-sm text-md-on-surface-variant"
          style={{ background: 'var(--md-sys-color-surface-variant)', maxWidth: 260 }}
        >
          app.synapse.legal/analysis/NDA-2024
        </div>
        <div className="ml-auto">
          <StatusBadge />
        </div>
      </div>

      {/* App content: two-column split */}
      <div className="grid grid-cols-1 divide-md-outline-variant lg:grid-cols-[1fr_1.35fr] lg:divide-x">

        {/* ── Left: Document metadata + key terms ── */}
        <div className="p-5">
          {/* Doc header */}
          <div className="mb-4 flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md-md text-md-on-primary"
              style={{ background: 'var(--md-sys-color-primary)' }}
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-title-sm font-semibold text-md-on-surface">Software Services Agreement</p>
              <p className="text-body-sm text-md-on-surface-variant">Acme Corp ↔ Vendor Ltd · 12 pages · PDF</p>
            </div>
          </div>

          {/* Metrics row */}
          <div className="mb-5 grid grid-cols-3 gap-2 text-center">
            {[
              { val: '12', label: 'Pages' },
              { val: '5', label: 'Risks Found' },
              { val: '28s', label: 'Analysis' },
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

          {/* Key terms */}
          <p className="mb-3 text-label-sm font-semibold uppercase tracking-wider text-md-on-surface-variant">
            Key Terms Extracted
          </p>
          <div className="space-y-2">
            {[
              { k: 'Contract Value',    v: '$240,000 / yr' },
              { k: 'Duration',          v: '24 months' },
              { k: 'Payment Terms',     v: 'Net 30' },
              { k: 'Governing Law',     v: 'State of Delaware' },
              { k: 'Auto-renewal',      v: '⚠ Yes — 60-day notice' },
              { k: 'Limitation of Liability', v: '2× annual fees' },
            ].map(({ k, v }) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="text-body-sm text-md-on-surface-variant">{k}</span>
                <span className="text-label-sm font-medium text-md-on-surface">{v}</span>
              </div>
            ))}
          </div>

          {/* Compliance badges */}
          <div className="mt-5 flex flex-wrap gap-2">
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

        {/* ── Right: Risk analysis ── */}
        <div className="p-5">
          {/* Risk score + summary row */}
          <div
            className="mb-5 flex items-center gap-5 rounded-md-lg p-4"
            style={{ background: 'var(--md-sys-color-surface-2)' }}
          >
            <RiskDial score={28} />
            <div>
              <p className="text-title-sm font-semibold text-md-on-surface">Overall Risk Score</p>
              <p className="mt-1 text-body-sm text-md-on-surface-variant">
                1 high-priority clause requires immediate attention before signing.
              </p>
              <div className="mt-3 flex gap-3 text-label-sm text-md-on-surface-variant">
                <span><span className="font-bold text-md-error">1</span> High</span>
                <span><span className="font-bold text-md-secondary">2</span> Medium</span>
                <span><span className="font-bold text-md-tertiary">2</span> Low</span>
              </div>
            </div>
          </div>

          {/* Clause breakdown */}
          <p className="mb-3 text-label-sm font-semibold uppercase tracking-wider text-md-on-surface-variant">
            Clause-by-Clause Breakdown
          </p>
          <div className="space-y-3.5">
            {clauses.map((c, i) => (
              <ClauseRow key={c.name} clause={c} index={i} />
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="md-btn-filled py-2 text-label-sm"
              tabIndex={-1}
              aria-hidden="true"
            >
              Export Report
            </button>
            <button
              type="button"
              className="md-btn-outlined py-2 text-label-sm"
              tabIndex={-1}
              aria-hidden="true"
            >
              Share with Team
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
