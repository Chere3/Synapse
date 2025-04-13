import { NextResponse } from 'next/server'
import { Cerebras } from '@cerebras/cerebras_cloud_sdk'

// Get API key from environment variables
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || process.env.NEXT_PUBLIC_CEREBRAS_API_KEY

if (!CEREBRAS_API_KEY) {
  console.error('Cerebras API key is not configured. Please check your environment variables.')
}

interface CerebrasResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function POST(request: Request) {
  try {
    const { messages, documentId } = await request.json()

    // Get the analysis context from the system message
    const systemMessage = messages.find((m: any) => m.role === 'system')
    const analysisContext = systemMessage ? JSON.parse(systemMessage.content.split('context: ')[1]) : null

    const client = new Cerebras({
      apiKey: CEREBRAS_API_KEY
    })

    const chatCompletion = await client.chat.completions.create({
      messages: messages.filter((m: any) => m.role !== 'system'),
      model: 'llama-4-scout-17b-16e-instruct',
      temperature: 0.3,
      max_tokens: 5000
    }) as CerebrasResponse

    return NextResponse.json({ content: chatCompletion.choices[0].message.content })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
} 