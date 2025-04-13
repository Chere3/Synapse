'use client';
import { useEffect, useState } from 'react'
import { useAuth } from './providers/auth-provider'
import { FileText, Download, Eye } from 'lucide-react'
import { toast } from 'react-toastify'
import { Database } from '@/types/supabase'

type Document = Database['public']['Tables']['documents']['Row']

export default function DocumentList() {
  const { supabaseClient, user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDocuments() {
      if (!user) return

      try {
        const { data, error } = await supabaseClient
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching documents:', error)
          toast.error('Failed to fetch documents')
          return
        }

        setDocuments(data || [])
      } catch (error) {
        console.error('Error fetching documents:', error)
        toast.error('Failed to fetch documents')
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [supabaseClient, user])

  const handlePreview = async (document: Document) => {
    try {
      const { data, error } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600) // URL expires in 1 hour

      if (error) {
        console.error('Error generating preview URL:', error)
        toast.error('Failed to generate preview URL')
        return
      }

      if (!data?.signedUrl) {
        toast.error('No preview URL generated')
        return
      }

      setPreviewUrl(data.signedUrl)
      setSelectedDocument(document)
    } catch (error) {
      console.error('Error generating preview URL:', error)
      toast.error('Failed to generate preview URL')
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600) // URL expires in 1 hour

      if (error) {
        console.error('Error generating download URL:', error)
        toast.error('Failed to generate download URL')
        return
      }

      if (!data?.signedUrl) {
        toast.error('No download URL generated')
        return
      }

      // Create a temporary link and trigger download
      const link = window.document.createElement('a')
      link.href = data.signedUrl
      link.download = doc.title
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((document) => (
            <div
              key={document.id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <FileText className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="font-medium">{document.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreview(document)}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Preview"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDownload(document)}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedDocument && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">{selectedDocument.title}</h3>
              <button
                onClick={() => {
                  setSelectedDocument(null)
                  setPreviewUrl(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {selectedDocument.file_type === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[60vh]"
                  title={selectedDocument.title}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Preview not available for this file type
                  </p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Open in new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 