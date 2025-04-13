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
      setUploading(true)

      // Generate a unique file path with user ID as the first folder
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Failed to upload file to storage: ${uploadError.message}`)
      }

      if (!uploadData) {
        throw new Error('No upload data returned from storage')
      }

      // Get the public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('documents')
        .getPublicUrl(filePath)

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file')
      }

      // Save document record to database
      const { data: document, error: dbError } = await supabaseClient
        .from('documents')
        .insert({
          user_id: user.id,
          title: file.name,
          file_path: filePath,
          file_url: publicUrl,
          status: 'pending',
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // If database insert fails, try to delete the uploaded file
        await supabaseClient.storage
          .from('documents')
          .remove([filePath])
        throw new Error(`Failed to save document record: ${dbError.message}`)
      }

      if (!document) {
        throw new Error('No document returned from server')
      }

      toast.success('Document uploaded successfully!')
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload document')
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
    maxSize: 5 * 1024 * 1024, // 5MB
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0]
      if (file) {
        if (file.errors[0]?.code === 'file-too-large') {
          toast.error('File is too large. Maximum size is 5MB')
        } else {
          toast.error('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file')
        }
      }
    },
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
            Supported formats: PDF, DOC, DOCX, TXT (max 5MB)
          </p>
        </div>
      )}
    </div>
  )
} 