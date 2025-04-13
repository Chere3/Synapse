-- Add extracted_text column to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.documents.extracted_text IS 'Text extracted from the document using OCR'; 