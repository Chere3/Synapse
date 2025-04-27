import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Mock TextEncoder and TextDecoder for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn()
global.URL.revokeObjectURL = jest.fn()

// Mock document.createElement
document.createElement = jest.fn((tagName) => {
  if (tagName === 'canvas') {
    return {
      getContext: jest.fn().mockReturnValue({
        drawImage: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
      }),
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,'),
      width: 0,
      height: 0,
    }
  }
  return {}
}) 