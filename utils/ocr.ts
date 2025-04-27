import { createWorker } from 'tesseract.js'

// Only import PDF.js on the client side
let pdfjsLib: any = null
if (typeof window !== 'undefined') {
  pdfjsLib = require('pdfjs-dist')
  // Use CDN for worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
}

type ProgressCallback = (step: string, progress: number, total: number) => void

export async function convertPdfToImages(
  pdfBytes: Uint8Array,
  onProgress?: ProgressCallback
): Promise<HTMLCanvasElement[]> {
  if (!pdfjsLib) {
    throw new Error('PDF.js is not available in this environment')
  }

  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise
  const canvases: HTMLCanvasElement[] = []
  const totalPages = pdf.numPages

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress(`Converting PDF to images (${i}/${totalPages})`, i, totalPages)
    }

    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 }) // Increase scale for better quality

    // Create canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not get canvas context')

    canvas.height = viewport.height
    canvas.width = viewport.width

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    canvases.push(canvas)
  }

  return canvases
}

export async function extractTextFromFile(
  file: File,
  onProgress?: ProgressCallback
): Promise<string> {
  try {
    // Create a worker for OCR processing
    const worker = await createWorker('eng')
    let extractedText = ''

    if (file.type === 'application/pdf') {
      if (typeof window === 'undefined') {
        throw new Error('PDF processing is only available in the browser')
      }

      // Convert PDF to array buffer
      const arrayBuffer = await file.arrayBuffer()
      const pdfBytes = new Uint8Array(arrayBuffer)

      // Convert PDF pages to canvases
      const canvases = await convertPdfToImages(pdfBytes, onProgress)
      const totalCanvases = canvases.length

      // Process each canvas with OCR
      for (let i = 0; i < canvases.length; i++) {
        if (onProgress) {
          onProgress(`Extracting text from image (${i + 1}/${totalCanvases})`, i + 1, totalCanvases)
        }

        const { data: { text } } = await worker.recognize(canvases[i])
        extractedText += text + '\n\n'
      }
    } else {
      if (onProgress) {
        onProgress('Extracting text from file', 1, 1)
      }
      // Process non-PDF files directly
      const { data: { text } } = await worker.recognize(file)
      extractedText = text
    }

    // Terminate the worker
    await worker.terminate()

    return extractedText.trim()
  } catch (error) {
    console.error('Error in OCR processing:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to extract text from document')
  }
} 