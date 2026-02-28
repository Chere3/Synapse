import { NextResponse } from 'next/server'
import { Cerebras } from '@cerebras/cerebras_cloud_sdk'
import { getRequiredCerebrasApiKey } from '@/utils/env'
import { normalizeAnalysisPayload } from '@/utils/analysis'

const ANALYSIS_MODEL = process.env.CEREBRAS_MODEL ?? 'llama3.1-8b'

const ANALYSIS_PROMPT = `Analyze the following legal text and identify clauses with potential risks. For each identified clause, provide:
1. The exact text of the clause with its line numbers
2. A risk level from 1 to 5, where:
   - 1: Minimal risk, standard clause
   - 2: Low risk, minor concerns
   - 3: Moderate risk, needs review
   - 4: High risk, significant concerns
   - 5: Critical risk, immediate attention required
3. A clear, simple legal explanation of the risks and potential implications

Return ONLY valid JSON with this exact structure:
{
  "analysis": [
    {
      "clause": "exact clause text [lines X-Y]",
      "riskLevel": 1,
      "explanation": "simple legal explanation"
    }
  ]
}

Text to analyze:
`

function extractFirstJsonObject(input: string): string | null {
  const start = input.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < input.length; i++) {
    const ch = input[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) {
        return input.slice(start, i + 1)
      }
    }
  }

  return null
}

function parseJsonFromModel(content: string): unknown {
  const trimmed = content.trim()

  const candidates: string[] = [trimmed]

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (codeBlockMatch?.[1]) {
    candidates.push(codeBlockMatch[1].trim())
  }

  const extracted = extractFirstJsonObject(trimmed)
  if (extracted) {
    candidates.push(extracted)
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      // try next candidate
    }
  }

  throw new Error('Model response was not valid JSON')
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json({ error: 'Invalid document text' }, { status: 400 })
    }

    const client = new Cerebras({ apiKey: getRequiredCerebrasApiKey() })

    const completion: any = await client.chat.completions.create({
      model: ANALYSIS_MODEL,
      temperature: 0.2,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: 'You are a legal risk analysis assistant. Return strict JSON only.',
        },
        {
          role: 'user',
          content: ANALYSIS_PROMPT + text,
        },
      ],
    })

    const rawContent = completion.choices?.[0]?.message?.content
    if (!rawContent) {
      return NextResponse.json({ error: 'Empty model response' }, { status: 502 })
    }

    const parsed = parseJsonFromModel(rawContent)
    const normalized = normalizeAnalysisPayload(parsed)

    if (normalized.length === 0) {
      return NextResponse.json({ error: 'Could not parse analysis output' }, { status: 502 })
    }

    return NextResponse.json({ analysis: normalized })
  } catch (error: any) {
    console.error('Analyze route error:', error)

    const providerMessage = error?.error?.message ?? error?.message
    if (error?.status === 404 && providerMessage?.toLowerCase().includes('model')) {
      return NextResponse.json(
        { error: `Cerebras model not available: ${ANALYSIS_MODEL}` },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: providerMessage ?? 'Failed to analyze document' },
      { status: 500 }
    )
  }
}
