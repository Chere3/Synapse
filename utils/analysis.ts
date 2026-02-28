export type RiskLevel = 1 | 2 | 3 | 4 | 5

export interface RiskAnalysis {
  clause: string
  riskLevel: RiskLevel
  explanation: string
}

export function normalizeAnalysisPayload(payload: unknown): RiskAnalysis[] {
  const arrayPayload = extractArray(payload)

  return arrayPayload
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const clause = String((item as any).clause ?? '').trim()
      const explanation = String((item as any).explanation ?? '').trim()
      const risk = Number((item as any).riskLevel)

      if (!clause || !explanation || Number.isNaN(risk)) return null

      return {
        clause,
        explanation,
        riskLevel: Math.min(5, Math.max(1, Math.round(risk))) as RiskLevel,
      }
    })
    .filter((item): item is RiskAnalysis => item !== null)
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
