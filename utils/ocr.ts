import { createWorker } from 'tesseract.js'

let pdfjsLib: any = null
let pdfjsInitPromise: Promise<any> | null = null
let pdfjsWorkerConfigured = false

function resolvePdfWorkerSrc(): string {
  const candidates = [
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    'pdfjs-dist/build/pdf.worker.min.mjs'
  ]

  for (const candidate of candidates) {
    try {
      return new URL(candidate, import.meta.url).toString()
    } catch {
      // Keep trying candidates
    }
  }

  // Final fallback in case bundler URL resolution fails
  return 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs'
}

async function getPdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing is only available in the browser')
  }

  if (pdfjsLib && pdfjsWorkerConfigured) return pdfjsLib
  if (pdfjsInitPromise) return pdfjsInitPromise

  pdfjsInitPromise = (async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – pdfjs-dist/legacy typings may not exist at compile time
    const mod: any = await import('pdfjs-dist/legacy/build/pdf')
    const lib = mod?.default ?? mod

    if (!lib?.GlobalWorkerOptions) {
      throw new Error('PDF.js worker options are unavailable')
    }

    if (!pdfjsWorkerConfigured) {
      lib.GlobalWorkerOptions.workerSrc = resolvePdfWorkerSrc()
      pdfjsWorkerConfigured = true
    }

    pdfjsLib = lib
    return pdfjsLib
  })()

  try {
    return await pdfjsInitPromise
  } finally {
    pdfjsInitPromise = null
  }
}

type ProgressCallback = (step: string, progress: number, total: number) => void

async function convertPdfToImages(
  pdfBytes: Uint8Array,
  onProgress?: ProgressCallback
): Promise<HTMLCanvasElement[]> {
  const pdfjs = await getPdfJs()

  const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise
  const canvases: HTMLCanvasElement[] = []
  const totalPages = pdf.numPages

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(`Converting PDF to images (${i}/${totalPages})`, i, totalPages)

    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not get canvas context')

    canvas.height = viewport.height
    canvas.width = viewport.width

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
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null

  try {
    worker = await createWorker('eng')
    let extractedText = ''

    if (file.type === 'application/pdf') {
      if (typeof window === 'undefined') {
        throw new Error('PDF processing is only available in the browser')
      }

      const arrayBuffer = await file.arrayBuffer()
      const pdfBytes = new Uint8Array(arrayBuffer)
      const canvases = await convertPdfToImages(pdfBytes, onProgress)
      const totalCanvases = canvases.length

      for (let i = 0; i < canvases.length; i++) {
        onProgress?.(`Extracting text from image (${i + 1}/${totalCanvases})`, i + 1, totalCanvases)
        const {
          data: { text }
        } = await worker.recognize(canvases[i])
        extractedText += text + '\n\n'
      }
    } else {
      onProgress?.('Extracting text from file', 1, 1)
      const {
        data: { text }
      } = await worker.recognize(file)
      extractedText = text
    }

    return extractedText.trim()
  } catch (error) {
    console.error('Error in OCR processing:', error)
    throw new Error('Failed to extract text from document')
  } finally {
    if (worker) {
      await worker.terminate()
    }
  }
}
