import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { documentId } = await request.json()

    // Get the document from Supabase
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (documentError) throw documentError

    // Call Cerebras API for analysis
    const response = await fetch(`${process.env.CEREBRAS_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        text: document.content,
        model: 'llama-4',
        analysis_type: 'legal',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to analyze document')
    }

    const analysis = await response.json()

    // Update document status and store analysis
    const { error: updateError } = await supabase
      .from('analysis')
      .insert({
        document_id: documentId,
        user_id: document.user_id,
        analysis: analysis,
        status: 'completed',
      })

    if (updateError) throw updateError

    // Update document status
    const { error: statusError } = await supabase
      .from('documents')
      .update({ status: 'analyzed' })
      .eq('id', documentId)

    if (statusError) throw statusError

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Error analyzing document:', error)
    return NextResponse.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    )
  }
} 