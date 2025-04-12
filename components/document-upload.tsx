'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from './providers/auth-provider'
import { toast } from 'react-toastify'
import { Upload, FileText } from 'lucide-react'

export default function DocumentUpload() {
  const { supabaseClient, user } = useAuth()
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return

    const file = acceptedFiles[0]
    if (!file) return

    try {
      setUploading(true)

      // Read file content
      const text = await file.text()

      // Upload to Supabase
      const { data: document, error } = await supabaseClient
        .from('documents')
        .insert({
          user_id: user.id,
          title: file.name,
          content: text,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Document uploaded successfully!')
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }, [supabaseClient, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" />
          <p className="text-gray-600">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {isDragActive ? (
            <FileText className="h-12 w-12 text-blue-500 mb-2" />
          ) : (
            <Upload className="h-12 w-12 text-gray-400 mb-2" />
          )}
          <p className="text-gray-600">
            {isDragActive
              ? 'Drop the document here'
              : 'Drag and drop a document here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: PDF, DOC, DOCX, TXT
          </p>
        </div>
      )}
    </div>
  )
} 