/**
 * Shared types for the PDF review architecture.
 * All positioning uses 0–1 fractions of page dimensions (scale-independent).
 */

import type { RiskAnalysis } from '@/utils/analysis'

// ─── Match quality ────────────────────────────────────────────────────────────
/** How the clause was anchored to a position in the PDF. */
export type MatchKind = 'exact' | 'normalized' | 'fuzzy' | 'fallback'

// ─── Text extraction ──────────────────────────────────────────────────────────
export interface TextItem {
  str: string
  /** x in PDF user-space units */
  tx: number
  /** y flipped (distance from top) in PDF user-space units */
  ty: number
  tw: number
  th: number
}

export interface PageTextData {
  pageIndex: number
  items: TextItem[]
  /** Raw joined text (original case) */
  rawText: string
  /** Normalized text (lowercase, punctuation stripped) */
  normText: string
  /** Page viewport width at scale=1 */
  width: number
  /** Page viewport height at scale=1 */
  height: number
}

// ─── Anchoring ────────────────────────────────────────────────────────────────
export interface TextAnchor {
  /** 0-based page index */
  pageIndex: number
  /** 0–1 fraction of page height (top of match) */
  yFraction: number
  /** 0–1 fraction of page width (left of match) */
  xFraction: number
  /** 0–1 fraction of page width (width of match) */
  wFraction: number
  /** 0–1 fraction of page height (height of match) */
  hFraction: number
  /** How the position was determined */
  matchKind: MatchKind
  /** 0–1 confidence score (1 = exact) */
  confidence: number
}

// ─── Resolved clause (analysis + position) ───────────────────────────────────
export interface ResolvedClause {
  analysis: RiskAnalysis
  /** Original index in the analysis array */
  index: number
  anchor: TextAnchor
}

// ─── Severity filter ──────────────────────────────────────────────────────────
export type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low'
