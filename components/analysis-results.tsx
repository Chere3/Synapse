'use client'

import { RiskAnalysis } from '@/utils/analysis'

interface AnalysisResultsProps {
  analysis: RiskAnalysis[]
}

/**
 * Risk level → M3 design token mapping.
 * Uses semantic container roles so the palette adapts automatically
 * to light/dark mode without any hardcoded hex values.
 *
 * Token naming follows Tailwind utility classes generated from tailwind.config.ts:
 *   bg-md-{role}   text-md-{role}   border-md-{role}
 *
 * Hierarchy (low→high severity):
 *   1 Minimal  → surface-variant   (neutral)
 *   2 Low      → tertiary-container (green tones)
 *   3 Moderate → primary-container  (brand accent)
 *   4 High     → secondary-container (warm orange)
 *   5 Critical → error-container    (red)
 */
const RISK_CONFIG = {
  1: {
    label:  'Minimal Risk',
    bg:     'bg-md-surface-variant',
    text:   'text-md-on-surface-variant',
    border: 'border-md-outline-variant',
    dot:    'bg-md-outline',
    bar:    'bg-md-outline',
    badgeBg:'bg-md-surface-variant',
    hover:  'hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-outline',
  },
  2: {
    label:  'Low Risk',
    bg:     'bg-md-tertiary-container',
    text:   'text-md-on-tertiary-container',
    border: 'border-md-tertiary-container',
    dot:    'bg-md-tertiary',
    bar:    'bg-md-tertiary',
    badgeBg:'bg-md-tertiary-container',
    hover:  'hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-tertiary',
  },
  3: {
    label:  'Moderate Risk',
    bg:     'bg-md-primary-container',
    text:   'text-md-on-primary-container',
    border: 'border-md-primary-container',
    dot:    'bg-md-primary',
    bar:    'bg-md-primary',
    badgeBg:'bg-md-primary-container',
    hover:  'hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-primary',
  },
  4: {
    label:  'High Risk',
    bg:     'bg-md-secondary-container',
    text:   'text-md-on-secondary-container',
    border: 'border-md-secondary-container',
    dot:    'bg-md-secondary',
    bar:    'bg-md-secondary',
    badgeBg:'bg-md-secondary-container',
    hover:  'hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-secondary',
  },
  5: {
    label:  'Critical Risk',
    bg:     'bg-md-error-container',
    text:   'text-md-on-error-container',
    border: 'border-md-error-container',
    dot:    'bg-md-error',
    bar:    'bg-md-error',
    badgeBg:'bg-md-error-container',
    hover:  'hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-md-error',
  },
} as const

function getRiskConfig(level: number) {
  const clamped = Math.min(5, Math.max(1, level)) as keyof typeof RISK_CONFIG
  return RISK_CONFIG[clamped] ?? RISK_CONFIG[3]
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  if (!analysis || analysis.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-body-md text-md-on-surface-variant">No analysis results found.</p>
      </div>
    )
  }

  const avgRisk = analysis.reduce((acc, item) => acc + (item.riskLevel ?? 1), 0) / analysis.length
  const riskCounts = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: analysis.filter((a) => a.riskLevel === level).length,
    config: getRiskConfig(level),
  }))

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="md-card-outlined p-6">
        <h3
          className="mb-5 text-title-md text-md-on-surface"
          style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
        >
          Risk Summary
        </h3>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {/* Average risk */}
          <div className="flex flex-col">
            <span className="text-label-sm text-md-on-surface-variant">Average Risk</span>
            <span
              className={`mt-1 text-display-sm font-bold ${getRiskConfig(Math.round(avgRisk)).text}`}
              style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
            >
              {avgRisk.toFixed(1)}
            </span>
            <span className="text-label-sm text-md-on-surface-variant">out of 5</span>
          </div>

          {/* Total clauses */}
          <div className="flex flex-col">
            <span className="text-label-sm text-md-on-surface-variant">Clauses Analyzed</span>
            <span
              className="mt-1 text-display-sm font-bold text-md-on-surface"
              style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
            >
              {analysis.length}
            </span>
            <span className="text-label-sm text-md-on-surface-variant">total clauses</span>
          </div>

          {/* High/Critical count */}
          <div className="flex flex-col col-span-2 sm:col-span-1">
            <span className="text-label-sm text-md-on-surface-variant">Needs Attention</span>
            <span
              className="mt-1 text-display-sm font-bold text-md-error"
              style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
            >
              {analysis.filter((a) => a.riskLevel >= 4).length}
            </span>
            <span className="text-label-sm text-md-on-surface-variant">high / critical</span>
          </div>
        </div>

        {/* Distribution bar */}
        <div className="mt-6">
          <span className="text-label-sm text-md-on-surface-variant">Risk distribution</span>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-md-surface-variant">
            {riskCounts.map(({ level, count, config }) =>
              count > 0 ? (
                <div
                  key={level}
                  className={`${config.bar} transition-all duration-medium2`}
                  style={{ width: `${(count / analysis.length) * 100}%` }}
                  title={`${config.label}: ${count}`}
                />
              ) : null
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {riskCounts.filter((r) => r.count > 0).map(({ level, count, config }) => (
              <div key={level} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                <span className="text-label-sm text-md-on-surface-variant">
                  {config.label} ({count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clause list */}
      <div className="space-y-3">
        <h3 className="text-title-sm text-md-on-surface-variant uppercase tracking-widest px-1">
          Clause Analysis
        </h3>
        {analysis.map((item, index) => {
          const cfg = getRiskConfig(item.riskLevel)
          return (
            <article
              key={index}
              className={`rounded-md-lg border p-5 transition-all duration-short4 ${cfg.bg} ${cfg.border} ${cfg.hover}`}
              aria-label={`Clause ${index + 1}: ${cfg.label}`}
            >
              {/* Header row */}
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
                  <span className={`text-label-lg font-semibold ${cfg.text}`}>{cfg.label}</span>
                </div>
                {/* Risk level badge — uses same container so contrast stays accessible */}
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border ${cfg.border} ${cfg.text} ${cfg.badgeBg} text-label-sm font-bold`}
                >
                  {item.riskLevel}
                </div>
              </div>

              {/* Clause text */}
              <div className="mb-3">
                <span className={`text-label-sm font-medium uppercase tracking-wider ${cfg.text} opacity-70`}>
                  Clause
                </span>
                <p className={`mt-1 text-body-md italic leading-relaxed border-l-2 ${cfg.border} pl-3 ml-0.5 ${cfg.text}`}>
                  {item.clause}
                </p>
              </div>

              {/* Explanation */}
              <div>
                <span className={`text-label-sm font-medium uppercase tracking-wider ${cfg.text} opacity-70`}>
                  Explanation
                </span>
                <p className={`mt-1 text-body-md ${cfg.text}`}>
                  {item.explanation}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
