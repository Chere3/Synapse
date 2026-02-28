'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from './providers/auth-provider'
import { toast } from 'react-toastify'
import { Upload, FileText, CheckCircle2 } from 'lucide-react'
import { extractTextFromFile } from '@/utils/ocr'
import { RiskAnalysis } from '@/utils/analysis'
import { Progress } from './ui/progress'

interface DocumentUploadProps {
  onAnalysisComplete?: (analysis: RiskAnalysis[], filePath?: string) => void
}

export default function DocumentUpload({ onAnalysisComplete }: DocumentUploadProps) {
  const { supabaseClient, user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [done, setDone] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error('You must be logged in to upload documents')
      return
    }

    const file = acceptedFiles[0]
    if (!file) return
    setDone(false)

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setCurrentStep('Preparing upload…')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`
      const filePath = `${user.id}/${fileName}.${fileExt}`

      setCurrentStep('Uploading file…')
      const { error: uploadError } = await supabaseClient.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw new Error(`Failed to upload file: ${uploadError.message}`)

      const { data: { publicUrl } } = supabaseClient.storage
        .from('documents')
        .getPublicUrl(filePath)

      if (!publicUrl) throw new Error('Failed to get public URL for uploaded file')

      setCurrentStep('Processing document…')
      let extractedText = ''
      try {
        extractedText = await extractTextFromFile(file, (step: any, progress: any, total: any) => {
          setCurrentStep(step)
          setUploadProgress((progress / total) * 100)
        })
      } catch {
        toast.warning('Could not extract text from document, but file was uploaded successfully')
      }

      setCurrentStep('Saving document…')
      const { data: document, error: insertError } = await supabaseClient
        .from('documents')
        .insert({
          user_id: user.id,
          title: file.name,
          file_path: filePath,
          file_url: publicUrl,
          extracted_text: extractedText,
          status: 'pending',
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single()

      if (insertError) {
        await supabaseClient.storage.from('documents').remove([filePath])
        throw new Error(`Failed to save document: ${insertError.message}`)
      }

      if (!document) throw new Error('No document returned from server')

      if (extractedText) {
        setIsAnalyzing(true)
        setCurrentStep('Analyzing document…')
        try {
          setCurrentStep('Running legal risk analysis…')
          setAnalysisProgress(30)

          const analysisResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: extractedText }),
          })

          if (!analysisResponse.ok) {
            let detail = 'Analysis request failed'
            try {
              const p = await analysisResponse.json()
              if (p?.error) detail = p.error
            } catch { /* ignore */ }
            throw new Error(detail)
          }

          const analysisData = await analysisResponse.json()
          const analysis = (analysisData.analysis ?? []) as RiskAnalysis[]
          setAnalysisProgress(80)

          await supabaseClient.from('analysis').insert({
            document_id: document.id,
            user_id: user.id,
            analysis,
            status: 'completed',
          })

          await supabaseClient
            .from('documents')
            .update({ status: 'analyzed' })
            .eq('id', document.id)

          if (onAnalysisComplete) onAnalysisComplete(analysis, filePath)
          setDone(true)
        } catch (error) {
          console.error('Analysis error:', error)
          toast.warning('Document was uploaded but analysis failed')
        } finally {
          setIsAnalyzing(false)
        }
      }

      toast.success('Document uploaded successfully')
    } catch (error) {
      console.error('Error uploading document:', error)
      const msg = error instanceof Error ? error.message : 'Failed to upload document'
      toast.error(msg)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setCurrentStep('')
      setAnalysisProgress(0)
    }
  }, [user, onAnalysisComplete, supabaseClient])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0]
      if (!file) return
      if (file.errors[0]?.code === 'file-too-large') {
        toast.error('File is too large. Maximum size is 5MB')
      } else {
        toast.error('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file')
      }
    },
  })

  const isBusy = isUploading || isAnalyzing
  const progress = isAnalyzing ? analysisProgress : uploadProgress

  return (
    <div
      {...getRootProps()}
      role="button"
      aria-label="Upload document"
      className={[
        'group relative cursor-pointer rounded-md-lg border-2 border-dashed p-6 text-center',
        'transition-all duration-medium2 md-standard focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2',
        isDragActive
          ? 'border-md-primary bg-md-primary-container'
          : done
          ? 'border-md-tertiary bg-md-tertiary-container'
          : 'border-md-outline-variant bg-md-surface hover:border-md-outline hover:bg-md-surface-1',
      ].join(' ')}
    >
      <input {...getInputProps()} />

      {isBusy ? (
        /* Progress state */
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-center">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-md-outline-variant"
              style={{ borderTopColor: 'var(--md-sys-color-primary)' }}
            />
          </div>
          <p className="text-label-md text-md-on-surface-variant">{currentStep}</p>
          <Progress value={progress} className="h-1.5" />
          <p className="text-label-sm text-md-on-surface-variant">{Math.round(progress)}%</p>
        </div>
      ) : done ? (
        /* Done state */
        <div className="flex flex-col items-center gap-2 py-2">
          <CheckCircle2 className="h-8 w-8 text-md-tertiary" />
          <p className="text-label-md font-medium text-md-on-surface">Analysis complete!</p>
          <p className="text-label-sm text-md-on-surface-variant">Drop another file to analyze</p>
        </div>
      ) : (
        /* Idle state */
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-md-lg bg-md-surface-variant group-hover:bg-md-primary-container transition-colors duration-short4">
            {isDragActive ? (
              <FileText className="h-6 w-6 text-md-primary" />
            ) : (
              <Upload className="h-6 w-6 text-md-on-surface-variant group-hover:text-md-primary transition-colors duration-short4" />
            )}
          </div>
          <div>
            <p className="text-label-md font-medium text-md-on-surface">
              {isDragActive ? 'Drop to upload' : 'Upload document'}
            </p>
            <p className="mt-0.5 text-label-sm text-md-on-surface-variant">
              PDF, DOCX, TXT · max 5 MB
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
