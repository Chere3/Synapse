import { createClient } from '@/utils/supabase/client'
import { Cerebras } from '@cerebras/cerebras_cloud_sdk'

const supabaseClient = createClient()

// Get API key from environment variables
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || process.env.NEXT_PUBLIC_CEREBRAS_API_KEY

if (!CEREBRAS_API_KEY) {
  console.error('Cerebras API key is not configured. Please check your environment variables.')
}

type RiskLevel = 1 | 2 | 3 | 4 | 5

export interface RiskAnalysis {
  clause: string
  riskLevel: RiskLevel
  explanation: string
}

interface CerebrasResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

type ProgressCallback = (step: string, progress: number, total: number) => void

const ANALYSIS_PROMPT = `Analyze the following legal text and identify clauses with potential risks. For each identified clause, provide:
1. The exact text of the clause with its line numbers
2. A risk level from 1 to 5, where:
   - 1: Minimal risk, standard clause
   - 2: Low risk, minor concerns
   - 3: Moderate risk, needs review
   - 4: High risk, significant concerns
   - 5: Critical risk, immediate attention required
3. A clear, simple legal explanation of the risks and potential implications

IMPORTANT: Your response MUST be a valid JSON array of objects with the following structure:
[
  {
    "clause": "exact text of the clause [lines X-Y]",
    "riskLevel": number between 1 and 5,
    "explanation": "simple legal explanation"
  }
]

Focus on identifying:
- Unusual or non-standard clauses
- Potentially unfair terms
- Ambiguous language
- Unreasonable obligations
- Unbalanced rights and responsibilities
- Hidden costs or fees
- Unclear termination conditions
- Excessive liability clauses
- Data privacy concerns
- Intellectual property issues

Text to analyze:
`

export async function analyzeDocumentText(
  text: string,
  onProgress?: ProgressCallback
): Promise<RiskAnalysis[]> {
  try {
    if (onProgress) {
      onProgress('Initializing analysis...', 0, 1)
    }

    if (!CEREBRAS_API_KEY) {
      throw new Error('Cerebras API key is not configured. Please check your environment variables.')
    }

    const client = new Cerebras({
      apiKey: CEREBRAS_API_KEY
    })

    if (onProgress) {
      onProgress('Sending request to Cerebras...', 0.2, 1)
    }

    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a legal expert specializing in risk analysis. Your responses must be valid JSON arrays.'
        },
        {
          role: 'user',
          content: ANALYSIS_PROMPT + text
        }
      ],
      model: 'llama-4-scout-17b-16e-instruct',
      temperature: 0.3,
      max_tokens: 5000,
      response_format: { type: "json_object" }
    }) as CerebrasResponse

    if (onProgress) {
      onProgress('Processing response...', 0.6, 1)
    }

    let analysis
    try {
      const content = chatCompletion.choices[0].message.content
      // Try to clean the response if it's not valid JSON
      const cleanedContent = content.replace(/[\r\n]+/g, ' ').trim()
      analysis = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('Error parsing response:', parseError)
      console.error('Raw response:', chatCompletion.choices[0].message.content)
      throw new Error('Failed to parse analysis response. Please try again.')
    }

    // Validate the response format
    if (!Array.isArray(analysis)) {
      throw new Error('Invalid analysis format')
    }

    if (onProgress) {
      onProgress('Formatting results...', 0.8, 1)
    }

    const formattedAnalysis = analysis.map(item => ({
      clause: item.clause,
      riskLevel: Math.min(5, Math.max(1, item.riskLevel)) as RiskLevel,
      explanation: item.explanation
    }))

    if (onProgress) {
      onProgress('Analysis complete', 1, 1)
    }

    return formattedAnalysis
  } catch (error) {
    console.error('Error analyzing document:', error)
    throw new Error('Failed to analyze document')
  }
}

export async function saveAnalysis(documentId: string, analysis: RiskAnalysis[], userId: string) {
  try {
    const { error } = await supabaseClient
      .from('analysis')
      .insert({
        document_id: documentId,
        user_id: userId,
        analysis: analysis,
        status: 'completed'
      })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error saving analysis:', error)
    throw new Error('Failed to save analysis')
  }
} 