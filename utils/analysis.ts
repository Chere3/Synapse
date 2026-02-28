export type RiskLevel = 1 | 2 | 3 | 4 | 5

export interface RiskAnalysis {
  clause: string
  riskLevel: RiskLevel
  explanation: string
}

export function normalizeAnalysisPayload(payload: unknown): RiskAnalysis[] {
  const arrayPayload = extractArray(payload)

  return arrayPayload
    .map(toRiskAnalysis)
    .filter((item): item is RiskAnalysis => item !== null)
}

function toRiskAnalysis(item: unknown): RiskAnalysis | null {
  if (!item || typeof item !== 'object') return null

  const input = item as Record<string, unknown>
  const clause = asNonEmptyString(input.clause)
  const explanation = asNonEmptyString(input.explanation)
  const riskLevel = asRiskLevel(input.riskLevel)

  if (!clause || !explanation || riskLevel === null) return null

  return {
    clause,
    explanation,
    riskLevel,
  }
}

function asNonEmptyString(value: unknown): string | null {
  const normalized = String(value ?? '').trim()
  return normalized.length > 0 ? normalized : null
}

function asRiskLevel(value: unknown): RiskLevel | null {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null

  return Math.min(5, Math.max(1, Math.round(parsed))) as RiskLevel
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload

  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>
    if (Array.isArray(p.analysis)) return p.analysis
    if (Array.isArray(p.results)) return p.results
    if (Array.isArray(p.data)) return p.data
  }

  return []
}
