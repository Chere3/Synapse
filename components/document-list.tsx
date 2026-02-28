'use client'
import { useEffect, useState } from 'react'
import { useAuth } from './providers/auth-provider'
import { FileText, Download, Eye, AlertCircle, CheckCircle, Clock, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { Database } from '@/types/supabase'
import { RiskAnalysis } from '@/utils/analysis'

type Document = Database['public']['Tables']['documents']['Row']
type Analysis = Database['public']['Tables']['analysis']['Row'] & {
  analysis: RiskAnalysis[]
}

interface DocumentListProps {
  onAnalysisSelect: (analysis: Analysis | null) => void
  isCollapsed?: boolean
}

const STATUS = {
  pending:  { label: 'Pending', Icon: Clock,         color: 'text-amber-600' },
  analyzed: { label: 'Analyzed', Icon: CheckCircle,  color: 'text-md-tertiary' },
  reviewed: { label: 'Reviewed', Icon: AlertCircle,  color: 'text-blue-500' },
} as const

function getStatus(status: string) {
  return STATUS[status as keyof typeof STATUS] ?? { label: status, Icon: Clock, color: 'text-md-on-surface-variant' }
}

export default function DocumentList({ onAnalysisSelect, isCollapsed = false }: DocumentListProps) {
  const { supabaseClient, user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
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

        if (error) { toast.error('Failed to fetch documents'); return }
        setDocuments(data || [])
      } catch { toast.error('Failed to fetch documents') }
      finally { setLoading(false) }
    }
    fetchDocuments()
  }, [supabaseClient, user])

  const handleDocumentClick = async (document: Document) => {
    setSelectedId(document.id)
    try {
      const { data: analysis, error } = await supabaseClient
        .from('analysis')
        .select('*')
        .eq('document_id', document.id)
        .single()

      if (error || !analysis) { onAnalysisSelect(null); return }
      onAnalysisSelect({ ...analysis, analysis: analysis.analysis as RiskAnalysis[] })
    } catch { toast.error('Failed to fetch analysis'); onAnalysisSelect(null) }
  }

  const handlePreview = async (document: Document) => {
    try {
      const { data, error } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600)
      if (error || !data?.signedUrl) { toast.error('Failed to generate preview URL'); return }
      setPreviewDoc(document)
      setPreviewUrl(data.signedUrl)
    } catch { toast.error('Failed to generate preview URL') }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600)
      if (error || !data?.signedUrl) { toast.error('Failed to generate download URL'); return }
      const link = globalThis.document.createElement('a')
      link.href = data.signedUrl
      link.download = doc.title
      globalThis.document.body.append(link)
      link.click()
      link.remove()
    } catch { toast.error('Failed to download document') }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-md-outline-variant"
          style={{ borderTopColor: 'var(--md-sys-color-primary)' }}
        />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md-full bg-md-surface-variant">
          <FileText className="h-6 w-6 text-md-on-surface-variant" />
        </div>
        <p className="text-body-sm text-md-on-surface-variant">No documents yet</p>
      </div>
    )
  }

  return (
    <>
      <nav aria-label="Document list">
        <ul className="space-y-1">
          {documents.map((doc) => {
            const { label, Icon, color } = getStatus(doc.status)
            const isSelected = selectedId === doc.id
            return (
              <li key={doc.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleDocumentClick(doc)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDocumentClick(doc)}
                  aria-selected={isSelected}
                  className={[
                    'group flex cursor-pointer items-center gap-3 rounded-md-md px-3 py-2.5',
                    'transition-all duration-short4 md-standard focus-visible:outline-none',
                    'focus-visible:ring-2 focus-visible:ring-md-primary',
                    isSelected
                      ? 'bg-md-secondary-container text-md-on-secondary-container'
                      : 'text-md-on-surface hover:bg-md-surface-variant',
                  ].join(' ')}
                >
                  {/* Doc icon */}
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md-sm ${
                      isSelected ? 'bg-md-on-secondary-container/10' : 'bg-md-surface-variant'
                    }`}
                  >
                    <FileText className={`h-4 w-4 ${isSelected ? 'text-md-on-secondary-container' : 'text-md-on-surface-variant'}`} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label-md font-medium">{doc.title}</p>
                    <div className={`flex items-center gap-1 mt-0.5 ${color}`}>
                      <Icon className="h-3 w-3 flex-shrink-0" />
                      <span className="text-label-sm">{label}</span>
                      <span className="text-label-sm opacity-50 ml-1">
                        · {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions (on hover) */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-short4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePreview(doc) }}
                      className="md-icon-btn h-7 w-7"
                      aria-label="Preview document"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(doc) }}
                      className="md-icon-btn h-7 w-7"
                      aria-label="Download document"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Preview modal */}
      {previewDoc && previewUrl && (
        <div
          role="dialog"
          aria-modal
          aria-label={`Preview: ${previewDoc.title}`}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setPreviewDoc(null); setPreviewUrl(null) }}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-md-xl bg-md-surface shadow-md-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-md-outline-variant px-6 py-4">
              <h3 className="text-title-md text-md-on-surface truncate">{previewDoc.title}</h3>
              <button
                onClick={() => { setPreviewDoc(null); setPreviewUrl(null) }}
                className="md-icon-btn"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-auto p-4">
              {previewDoc.file_type === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  className="h-full min-h-[60vh] w-full rounded-md-md"
                  title={previewDoc.title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <FileText className="h-12 w-12 text-md-on-surface-variant" />
                  <p className="text-body-md text-md-on-surface-variant">
                    Preview not available for this file type.
                  </p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="md-btn-tonal"
                  >
                    Open in new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
