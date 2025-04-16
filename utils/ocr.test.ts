import { createWorker } from 'tesseract.js'
import { extractTextFromFile, convertPdfToImages } from './ocr'

// Mock File object with arrayBuffer method
class MockFile extends File {
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0))
  }
}

// Mock tesseract.js
jest.mock('tesseract.js', () => {
  return {
    createWorker: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        recognize: jest.fn().mockResolvedValue({
          data: { text: 'Extracted text' }
        }),
        terminate: jest.fn()
      })
    })
  }
})

// Mock PDF.js
jest.mock('pdfjs-dist', () => {
  return {
    getDocument: jest.fn().mockImplementation(() => {
      if (!global.window) {
        throw new Error('PDF.js is not available in this environment')
      }
      return {
        promise: Promise.resolve({
          numPages: 2,
          getPage: jest.fn().mockResolvedValue({
            getViewport: jest.fn().mockReturnValue({
              height: 100,
              width: 100
            }),
            render: jest.fn().mockResolvedValue({
              promise: Promise.resolve()
            })
          })
        })
      }
    }),
    GlobalWorkerOptions: {
      workerSrc: ''
    }
  }
})

describe('OCR Utility', () => {
  describe('convertPdfToImages', () => {
    beforeEach(() => {
      // Ensure window is available for each test
      if (!global.window) {
        global.window = {} as any
      }
    })

    afterEach(() => {
      // Clean up after each test
      jest.clearAllMocks()
    })

    it('should convert PDF to canvas images', async () => {
      const mockPdfBytes = new Uint8Array([1, 2, 3])
      const mockProgress = jest.fn()

      const canvases = await convertPdfToImages(mockPdfBytes, mockProgress)

      expect(canvases).toHaveLength(2)
      expect(mockProgress).toHaveBeenCalledWith(
        'Converting PDF to images (1/2)',
        1,
        2
      )
      expect(mockProgress).toHaveBeenCalledWith(
        'Converting PDF to images (2/2)',
        2,
        2
      )
    })

    it('should throw error when PDF.js is not available', async () => {
      delete (global as any).window

      const mockPdfBytes = new Uint8Array([1, 2, 3])
      await expect(convertPdfToImages(mockPdfBytes)).rejects.toThrow(
        'PDF.js is not available in this environment'
      )
    })
  })

  describe('extractTextFromFile', () => {
    beforeEach(() => {
      // Ensure window is available for each test
      if (!global.window) {
        global.window = {} as any
      }
    })

    afterEach(() => {
      // Clean up after each test
      jest.clearAllMocks()
    })

    it('should extract text from PDF file', async () => {
      const mockFile = new MockFile(['test'], 'test.pdf', { type: 'application/pdf' })
      const mockProgress = jest.fn()

      const result = await extractTextFromFile(mockFile, mockProgress)

      expect(result).toBe('Extracted text\n\nExtracted text')
      expect(mockProgress).toHaveBeenCalledWith(
        'Extracting text from image (1/2)',
        1,
        2
      )
      expect(mockProgress).toHaveBeenCalledWith(
        'Extracting text from image (2/2)',
        2,
        2
      )
    })

    it('should extract text from image file', async () => {
      const mockFile = new MockFile(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockProgress = jest.fn()

      const result = await extractTextFromFile(mockFile, mockProgress)

      expect(result).toBe('Extracted text')
      expect(mockProgress).toHaveBeenCalledWith(
        'Extracting text from file',
        1,
        1
      )
    })

    it('should throw error when PDF processing is attempted in non-browser environment', async () => {
      delete (global as any).window

      const mockFile = new MockFile(['test'], 'test.pdf', { type: 'application/pdf' })
      try {
        await extractTextFromFile(mockFile)
        fail('Expected error was not thrown')
      } catch (error: any) {
        expect(error.message).toBe('PDF processing is only available in the browser')
      }
    })

    it('should handle errors during OCR processing', async () => {
      const mockFile = new MockFile(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockWorker = {
        recognize: jest.fn().mockRejectedValue(new Error('OCR failed')),
        terminate: jest.fn()
      }
      ;(createWorker as jest.Mock).mockResolvedValueOnce(mockWorker)

      await expect(extractTextFromFile(mockFile)).rejects.toThrow('OCR failed')
    })
  })
}) 