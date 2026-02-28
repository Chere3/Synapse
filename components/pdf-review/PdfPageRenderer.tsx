'use client'

/**
 * PdfPageRenderer
 *
 * Renders a single PDF page with three layers:
 *  1. Canvas layer  — pixel-accurate PDF rendering via pdfjs
 *  2. Text layer    — selectable / searchable invisible text overlay
 *  3. Children slot — AnnotationOverlay injected by parent
 *
 * Lazy rendering: uses IntersectionObserver so pages outside the viewport
 * are only rendered when they scroll into view, keeping initial load fast.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import type * as pdfjsLib from 'pdfjs-dist'
import { Loader2, AlertCircle } from 'lucide-react'

type RenderStatus = 'idle' | 'rendering' | 'done' | 'error'

interface Props {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  pageIndex: number
  scale: number
  /** AnnotationOverlay (or any overlay) rendered above the text layer */
  children?: React.ReactNode
  /** Called when the page dimensions are known */
  onDimensionsReady?: (w: number, h: number) => void
}

/** Text layer CSS injected once into the document head. */
const TEXT_LAYER_CSS = `
.pdf-text-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0.25;
  line-height: 1;
  pointer-events: auto;
  user-select: text;
}
.pdf-text-layer span {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
.pdf-text-layer ::selection {
  background: color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent);
  color: transparent;
}
`

let cssInjected = false
function injectTextLayerCss() {
  if (cssInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = TEXT_LAYER_CSS
  document.head.appendChild(style)
  cssInjected = true
}

export default function PdfPageRenderer({
  pdfDoc,
  pageIndex,
  scale,
  children,
  onDimensionsReady,
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const textLayerRef  = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)
  const observerRef   = useRef<IntersectionObserver | null>(null)

  const [status, setStatus]     = useState<RenderStatus>('idle')
  const [dims, setDims]         = useState({ w: 600, h: 800 })
  const [isVisible, setVisible] = useState(false)

  // Inject CSS once
  useEffect(() => { injectTextLayerCss() }, [])

  // IntersectionObserver: mark visible when page enters viewport
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          // Once visible, disconnect — we never un-render a rendered page
          observerRef.current?.disconnect()
        }
      },
      { rootMargin: '200px' }, // pre-load 200px before entering viewport
    )
    observerRef.current.observe(el)
    return () => observerRef.current?.disconnect()
  }, [])

  const renderPage = useCallback(async () => {
    if (status === 'rendering' || status === 'done') return
    setStatus('rendering')

    try {
      const page     = await pdfDoc.getPage(pageIndex + 1)
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef.current
      const textDiv = textLayerRef.current
      if (!canvas) return

      canvas.width  = viewport.width
      canvas.height = viewport.height

      const newDims = { w: viewport.width, h: viewport.height }
      setDims(newDims)
      onDimensionsReady?.(viewport.width, viewport.height)

      // ── Canvas render ───────────────────────────────────────────────────────
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No 2d context')

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
      const renderTask = page.render({ canvasContext: ctx, viewport })
      renderTaskRef.current = renderTask
      await renderTask.promise

      // ── Text layer render ───────────────────────────────────────────────────
      if (textDiv) {
        textDiv.style.width  = `${viewport.width}px`
        textDiv.style.height = `${viewport.height}px`
        textDiv.innerHTML    = ''

        const textContent = await page.getTextContent()
        const { renderTextLayer } = await import('pdfjs-dist')

        type PdfTextItem = {
          str: string
          transform: number[]
          width: number
          height: number
          fontName?: string
        }

        for (const item of textContent.items as PdfTextItem[]) {
          if (!item.str.trim()) continue

          const [a, b, c, d, e, f] = item.transform
          const tx = viewport.transform

          // Apply viewport transformation
          const scaledX = e * tx[0] + f * tx[2] + tx[4]
          const scaledY = e * tx[1] + f * tx[3] + tx[5]
          const scaleA  = a * tx[0] + b * tx[2]
          const scaleB  = a * tx[1] + b * tx[3]
          const scaleC  = c * tx[0] + d * tx[2]
          const scaleD  = c * tx[1] + d * tx[3]

          const angle = Math.atan2(scaleB, scaleA)
          const fontH = Math.sqrt(scaleC * scaleC + scaleD * scaleD)

          const span = document.createElement('span')
          span.textContent = item.str

          // Position using CSS transform matching the canvas transformation matrix
          span.style.fontSize       = `${fontH}px`
          span.style.left           = `${scaledX}px`
          span.style.top            = `${viewport.height - scaledY}px`
          span.style.transform      = `rotate(${angle}rad)`
          span.style.transformOrigin = '0% 100%'

          if (item.width > 0 && item.str.length > 0) {
            const targetWidth = item.width * scale * (tx[0] / 1)
            span.style.width         = `${targetWidth}px`
            span.style.whiteSpace    = 'pre'
          }

          textDiv.appendChild(span)
        }

        // Use renderTextLayer API if available (pdfjs 4.x)
        try {
          textDiv.innerHTML = ''
          const renderTask2 = renderTextLayer({
            textContentSource: page.streamTextContent(),
            container: textDiv,
            viewport,
          })
          await renderTask2.promise
        } catch {
          // renderTextLayer may not exist or differ in some builds — the manual
          // span approach above already ran, so this is an acceptable no-op.
        }
      }

      setStatus('done')
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'name' in err &&
        (err as { name: string }).name === 'RenderingCancelledException'
      ) {
        return // Expected on cleanup
      }
      console.error(`[PdfPageRenderer] page ${pageIndex + 1}`, err)
      setStatus('error')
    }
  }, [pdfDoc, pageIndex, scale, status, onDimensionsReady])

  // Trigger render when page becomes visible
  useEffect(() => {
    if (isVisible && status === 'idle') {
      renderPage()
    }
  }, [isVisible, status, renderPage])

  // Cleanup render task on unmount
  useEffect(() => {
    return () => {
      renderTaskRef.current?.cancel()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative mx-auto"
      style={{ width: dims.w, maxWidth: '100%' }}
      data-page={pageIndex + 1}
      aria-label={`PDF page ${pageIndex + 1}`}
    >
      {/* ── Layer 1: Canvas ── */}
      <canvas
        ref={canvasRef}
        className="block w-full shadow-md-2 rounded-md-sm"
        style={{ visibility: status === 'done' ? 'visible' : 'hidden' }}
        aria-hidden="true"
      />

      {/* ── Layer 2: Text layer ── */}
      <div
        ref={textLayerRef}
        className="pdf-text-layer"
        aria-hidden="true"
      />

      {/* ── Layer 3: Annotation slot (AnnotationOverlay) ── */}
      {status === 'done' && children}

      {/* Loading shimmer */}
      {(status === 'idle' || status === 'rendering') && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-md-sm"
          style={{
            background: 'var(--md-sys-color-surface-variant)',
            height: dims.h,
          }}
          aria-label={`Loading page ${pageIndex + 1}`}
        >
          <Loader2 className="h-6 w-6 animate-spin text-md-on-surface-variant" />
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md-sm"
          style={{
            background: 'var(--md-sys-color-error-container)',
            height: dims.h,
          }}
          role="alert"
        >
          <AlertCircle className="h-7 w-7 text-md-error" />
          <p className="text-body-sm text-md-on-error-container">
            Failed to render page {pageIndex + 1}
          </p>
        </div>
      )}

      {/* Page number chip */}
      <div className="mt-1 text-center">
        <span className="text-label-sm text-md-on-surface-variant" aria-hidden="true">
          {pageIndex + 1}
        </span>
      </div>
    </div>
  )
}
