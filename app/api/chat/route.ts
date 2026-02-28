import { NextResponse } from 'next/server'
import { Cerebras } from '@cerebras/cerebras_cloud_sdk'
import { getRequiredCerebrasApiKey } from '@/utils/env'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const { messages, analysisText } = await request.json()

    const safeMessages = (Array.isArray(messages) ? messages : [])
      .filter(
        (m: any): m is ChatMessage =>
          (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string'
      )
      .map((m) => ({ role: m.role, content: m.content })) as Array<{ role: 'user' | 'assistant'; content: string }>

    if (safeMessages.length === 0) {
      return NextResponse.json({ error: 'No chat messages provided' }, { status: 400 })
    }

    const client = new Cerebras({ apiKey: getRequiredCerebrasApiKey() })

    const completion: any = await client.chat.completions.create({
      model: 'llama-4-scout-17b-16e-instruct',
      temperature: 0.3,
      max_tokens: 3000,
      messages: [
        {
          role: 'system',
          content:
            'You are a legal document analysis assistant. Base your answers on the provided analysis context. If context is insufficient, say so clearly.',
        },
        {
          role: 'system',
          content: `Analysis context:\n${typeof analysisText === 'string' ? analysisText : '[]'}`,
        },
        ...safeMessages,
      ],
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Empty model response' }, { status: 502 })
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Chat route error:', error)
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 })
  }
}
