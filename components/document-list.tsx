'use client';
import { useEffect, useState } from 'react'
import { useAuth } from './providers/auth-provider'
import { FileText, Download, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'react-toastify'
import { Database } from '@/types/supabase'
import { RiskAnalysis } from '@/utils/analysis'

type Document = Database['public']['Tables']['documents']['Row']
type Analysis = Database['public']['Tables']['analysis']['Row'] & {
  analysis: RiskAnalysis[]
}

interface DocumentListProps {
  onAnalysisSelect: (analysis: Analysis | null) => void;
  isCollapsed?: boolean;
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': {
      return 'Pending Analysis'
    }
    case 'analyzed': {
      return 'Analyzed'
    }
    case 'reviewed': {
      return 'Reviewed'
    }
    default: {
      return status
    }
  }
}

export default function DocumentList({ onAnalysisSelect, isCollapsed = false }: DocumentListProps) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': {
        return <Clock className="h-4 w-4 text-yellow-500" />
      }
      case 'analyzed': {
        return <CheckCircle className="h-4 w-4 text-green-500" />
      }
      case 'reviewed': {
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      }
      default: {
        return <Clock className="h-4 w-4 text-gray-500" />
      }
    }
  }

  const handleDocumentClick = async (document: Document) => {
    setSelectedDocument(document)

    try {
      const { data: analysis, error } = await supabaseClient
        .from('analysis')
        .select('*')
        .eq('document_id', document.id)
        .single()

      if (error) {
        console.error('Error fetching analysis:', error)
        toast.error('Failed to fetch analysis')
        onAnalysisSelect(null)
        return
      }

      if (!analysis) {
        onAnalysisSelect(null)
        return
      }

      const typedAnalysis: Analysis = {
        ...analysis,
        analysis: analysis.analysis as RiskAnalysis[]
      }

      onAnalysisSelect(typedAnalysis)
    } catch (error) {
      console.error('Error fetching analysis:', error)
      toast.error('Failed to fetch analysis')
      onAnalysisSelect(null)
    }
  }

  const handlePreview = async (document: Document) => {
    try {
      const { data, error } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600)

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
    } catch (error) {
      console.error('Error generating preview URL:', error)
      toast.error('Failed to generate preview URL')
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600)

      if (error) {
        console.error('Error generating download URL:', error)
        toast.error('Failed to generate download URL')
        return
      }

      if (!data?.signedUrl) {
        toast.error('No download URL generated')
        return
      }

      const link = globalThis.document.createElement('a')
      link.href = data.signedUrl
      link.download = doc.title
      globalThis.document.body.append(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="scrollbar-hide">
      {documents.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className={isCollapsed ? 'hidden' : ''}>No documents uploaded yet</p>
        </div>
      ) : (
        <div>
          {documents.map((document, index) => (
            <div key={document.id}>
              <div
                className="flex cursor-pointer items-center justify-between bg-white py-3 transition-colors hover:bg-gray-50"
                onClick={() => handleDocumentClick(document)}
              >
                <div className="flex min-w-0 items-center space-x-4">
                  <div className={isCollapsed ? 'hidden' : 'min-w-0 flex-1'}>
                    <h3 className="truncate font-medium">{document.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {getStatusIcon(document.status)}
                      <span>{getStatusText(document.status)}</span>
                      <span>•</span>
                      <span>{new Date(document.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="flex shrink-0 items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePreview(document)
                      }}
                      className="p-2 text-gray-500 transition-colors hover:text-blue-500"
                      title="Preview"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(document)
                      }}
                      className="p-2 text-gray-500 transition-colors hover:text-blue-500"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              {index < documents.length - 1 && (
                <div className="h-px bg-gray-200 opacity-20" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedDocument && previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white">
            <div className="flex items-center justify-between border-b p-4">
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
                  className="h-full min-h-[60vh] w-full"
                  title={selectedDocument.title}
                />
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-4 text-gray-500">
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