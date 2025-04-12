'use client';
import { useEffect, useState } from 'react'
import { useAuth } from './providers/auth-provider'
import { Database } from '@/types/supabase'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

type Document = Database['public']['Tables']['documents']['Row']

export default function DocumentList() {
  const { supabaseClient, user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setDocuments(data || [])
      } catch (error) {
        console.error('Error fetching documents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [supabaseClient, user])

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'analyzed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'reviewed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No documents uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(doc.status)}
              <h3 className="font-medium">{doc.title}</h3>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(doc.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Status: {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
          </div>
        </div>
      ))}
    </div>
  )
} 