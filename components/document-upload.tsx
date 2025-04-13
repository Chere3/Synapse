'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from './providers/auth-provider'
import { toast } from 'react-toastify'
import { Upload, FileText } from 'lucide-react'
import { extractTextFromFile } from '@/utils/ocr'
import { Progress } from '@/components/ui/progress'

export default function DocumentUpload() {
  const { supabaseClient, user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error('You must be logged in to upload documents')
      return
    }

    const file = acceptedFiles[0]
    if (!file) {
      toast.error('No file selected')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setCurrentStep('Preparing upload...')

      // Generate a unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      const filePath = `${user.id}/${fileName}.${fileExt}`

      // Upload file to storage
      setCurrentStep('Uploading file...')
      const { error: uploadError } = await supabaseClient.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      // Get the public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('documents')
        .getPublicUrl(filePath)

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file')
      }

      // Extract text from the file with progress tracking
      setCurrentStep('Processing document...')
      let extractedText = ''
      try {
        extractedText = await extractTextFromFile(file, (step, progress, total) => {
          setCurrentStep(step)
          setUploadProgress((progress / total) * 100)
        })
      } catch (error) {
        console.error('OCR processing error:', error)
        toast.warning('Could not extract text from document, but file was uploaded successfully')
      }

      // Insert document record
      setCurrentStep('Saving document...')
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
          file_size: file.size
        })
        .select()
        .single()

      if (insertError) {
        console.error('Database insert error:', insertError)
        // If database insert fails, remove the uploaded file
        await supabaseClient.storage
          .from('documents')
          .remove([filePath])
        throw new Error(`Failed to save document: ${insertError.message}`)
      }

      if (!document) {
        throw new Error('No document returned from server')
      }

      toast.success('Document uploaded successfully')
    } catch (error) {
      console.error('Error uploading document:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setCurrentStep('')
    }
  }, [user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0]
      if (file) {
        if (file.errors[0]?.code === 'file-too-large') {
          toast.error('File is too large. Maximum size is 5MB')
        } else {
          toast.error('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file')
        }
      }
    }
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{currentStep}</p>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-600">{Math.round(uploadProgress)}%</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop the file here' : 'Drag and drop a document here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: PDF, TXT, DOC, DOCX (max 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 