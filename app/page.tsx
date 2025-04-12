import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import DocumentUpload from '@/components/document-upload'
import DocumentList from '@/components/document-list'

export default async function Home() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to Synapse Legal</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Upload New Document</h2>
          <DocumentUpload />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Documents</h2>
          <DocumentList />
        </div>
      </div>
    </main>
  )
}
