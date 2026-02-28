/**
 * TextAnchorEngine
 *
 * Responsible for:
 *  1. Extracting text content from every PDF page (memoized per pdfDoc).
 *  2. Anchoring each clause via a three-tier strategy:
 *       • exact      – verbatim substring in raw page text
 *       • normalized – after lowercasing + collapsing punctuation/whitespace
 *       • fuzzy      – token-overlap score ≥ FUZZY_THRESHOLD across pages
 *       • fallback   – evenly distributed if all else fails
 *
 * OCR noise handling:
 *  - Normalisation strips punctuation that OCR commonly corrupts (e.g. 'li­ability' → 'liability').
 *  - Fuzzy matching tokenises both the query and each page, then counts matching content words.
 *    This tolerates word-level garbling but needs enough unique tokens to avoid false positives.
 *
 * Performance:
 *  - Text extraction is O(pages) and cached in a WeakMap keyed by PDFDocumentProxy.
 *  - Per-clause anchor results are cached in a Map<clauseText, TextAnchor>.
 */

import type * as pdfjsLib from 'pdfjs-dist'
import type { PageTextData, TextAnchor, TextItem, MatchKind } from './types'

// ─── Tuning ───────────────────────────────────────────────────────────────────
const SEARCH_PREFIX_LEN = 80   // chars from clause start used as search key
const FUZZY_THRESHOLD   = 0.40 // minimum token-overlap ratio to accept fuzzy match
const STOP_WORDS = new Set([
  'the','a','an','and','or','of','to','in','for','on','at','by',
  'with','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','shall','should','may','might','must',
  'can','could','that','this','these','those','it','its','not','no','any',
  'all','each','such','other','than','then','when','which','who',
])

// ─── Text normalisation helpers ───────────────────────────────────────────────
function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u00ad\u200b\u200c\u200d\ufeff]/g, '') // invisible chars (OCR artifacts)
    .replace(/[^\w\s]/g, ' ')                          // punctuation → space
    .replace(/\s+/g, ' ')
    .trim()
}

/** Content words only (no stop words, min 3 chars). */
function contentTokens(s: string): string[] {
  return normalizeText(s)
    .split(' ')
    .filter(t => t.length >= 3 && !STOP_WORDS.has(t))
}

// ─── Fuzzy score between a token list and a page's normalised text ────────────
function fuzzyScore(queryTokens: string[], normPageText: string): number {
  if (queryTokens.length === 0) return 0
  let hits = 0
  for (const t of queryTokens) {
    if (normPageText.includes(t)) hits++
  }
  return hits / queryTokens.length
}

// ─── Find the best TextItem position for a match in a page ───────────────────
function findPositionInPage(
  pageData: PageTextData,
  matchStart: number,
): { yFraction: number; xFraction: number; wFraction: number; hFraction: number } {
  // Walk items accumulating character position until we find the matching item.
  let charCount = 0
  for (const item of pageData.items) {
    charCount += item.str.length + 1 // +1 for join space
    if (charCount > matchStart) {
      return {
        yFraction: Math.max(0, Math.min(1, item.ty / pageData.height)),
        xFraction: Math.max(0, Math.min(1, item.tx / pageData.width)),
        wFraction: Math.max(0.05, Math.min(1, item.tw / pageData.width)),
        hFraction: Math.max(0.01, item.th / pageData.height),
      }
    }
  }
  // Fallback to middle of page
  return { yFraction: 0.5, xFraction: 0.05, wFraction: 0.9, hFraction: 0.02 }
}

// ─── Module-level cache (WeakMap keyed by PDFDocumentProxy) ──────────────────
const textDataCache = new WeakMap<object, PageTextData[]>()
const anchorCache   = new WeakMap<object, Map<string, TextAnchor>>()

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract text content from all pages.  Results are cached per pdfDoc object.
 */
export async function extractPageTexts(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
): Promise<PageTextData[]> {
  const cached = textDataCache.get(pdfDoc as object)
  if (cached) return cached

  const pages: PageTextData[] = []

  for (let p = 0; p < pdfDoc.numPages; p++) {
    const page  = await pdfDoc.getPage(p + 1)
    const vp    = page.getViewport({ scale: 1 })
    const tc    = await page.getTextContent()

    type PdfTextItem = { str: string; transform: number[]; width: number; height: number }
    const items: TextItem[] = (tc.items as PdfTextItem[]).map(item => {
      const [, , , , tx, ty] = item.transform
      return {
        str: item.str,
        tx,
        ty: vp.height - ty, // flip y: pdfjs origin is bottom-left
        tw: item.width,
        th: item.height > 0 ? item.height : 10,
      }
    })

    const rawText  = items.map(i => i.str).join(' ')
    const normText = normalizeText(rawText)

    pages.push({ pageIndex: p, items, rawText, normText, width: vp.width, height: vp.height })
  }

  textDataCache.set(pdfDoc as object, pages)
  return pages
}

/**
 * Resolve a single clause to a TextAnchor using a three-tier strategy.
 * Results are cached per (pdfDoc, clauseText) pair.
 */
export function anchorClause(
  clauseText: string,
  pageTexts: PageTextData[],
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  fallbackIndex: number,
  totalClauses: number,
): TextAnchor {
  // Per-doc cache
  if (!anchorCache.has(pdfDoc as object)) {
    anchorCache.set(pdfDoc as object, new Map<string, TextAnchor>())
  }
  const cache = anchorCache.get(pdfDoc as object)!
  if (cache.has(clauseText)) return cache.get(clauseText)!

  const fullClause = clauseText.trim()
  const searchStr  = clauseText.slice(0, SEARCH_PREFIX_LEN).trim()
  const exactNeedles = Array.from(new Set([fullClause, searchStr].filter(s => s.length > 0)))

  const normFull   = normalizeText(fullClause)
  const normSearch = normalizeText(searchStr)
  const normNeedles = Array.from(new Set([normFull, normSearch].filter(s => s.length > 0)))

  const queryToks  = contentTokens(searchStr)

  let result: TextAnchor | null = null

  // ── Tier 1: exact (raw text) ────────────────────────────────────────────────
  for (const needle of exactNeedles) {
    if (result) break
    for (const pd of pageTexts) {
      const idx = pd.rawText.indexOf(needle)
      if (idx !== -1) {
        const pos = findPositionInPage(pd, idx)
        result = { pageIndex: pd.pageIndex, ...pos, matchKind: 'exact' as MatchKind, confidence: 1.0 }
        break
      }
    }
  }

  // ── Tier 2: normalised (handles OCR punctuation corruption) ─────────────────
  if (!result) {
    for (const needle of normNeedles) {
      if (result) break
      for (const pd of pageTexts) {
        const idx = pd.normText.indexOf(needle)
        if (idx !== -1) {
          const pos = findPositionInPage(pd, idx)
          result = { pageIndex: pd.pageIndex, ...pos, matchKind: 'normalized' as MatchKind, confidence: 0.85 }
          break
        }
      }
    }
  }

  // ── Tier 3: fuzzy (token overlap across pages) ──────────────────────────────
  if (!result && queryToks.length >= 3) {
    let bestScore  = 0
    let bestPage   = -1
    for (const pd of pageTexts) {
      const score = fuzzyScore(queryToks, pd.normText)
      if (score > bestScore) {
        bestScore = score
        bestPage  = pd.pageIndex
      }
    }
    if (bestScore >= FUZZY_THRESHOLD && bestPage !== -1) {
      const pd  = pageTexts[bestPage]
      // Use first token match position as anchor y
      const tok = queryToks.find(t => pd.normText.includes(t))
      if (tok) {
        const idx = pd.normText.indexOf(tok)
        const pos = findPositionInPage(pd, idx)
        result = {
          pageIndex: bestPage,
          ...pos,
          matchKind: 'fuzzy' as MatchKind,
          confidence: bestScore,
        }
      }
    }
  }

  // ── Tier 4: fallback (distribute evenly across pages) ───────────────────────
  if (!result) {
    const frac    = totalClauses > 1 ? fallbackIndex / (totalClauses - 1) : 0.5
    const pageIdx = Math.min(
      pageTexts.length - 1,
      Math.floor(frac * pageTexts.length),
    )
    const yFrac   = (frac * pageTexts.length) % 1 || 0.5
    result = {
      pageIndex: pageIdx,
      yFraction: Math.max(0.05, Math.min(0.95, yFrac)),
      xFraction: 0.05,
      wFraction: 0.9,
      hFraction: 0.02,
      matchKind: 'fallback' as MatchKind,
      confidence: 0,
    }
  }

  cache.set(clauseText, result)
  return result
}

/** Convenience: resolve all clauses at once. */
export async function resolveAllClauses(
  clauses: string[],
  pdfDoc: pdfjsLib.PDFDocumentProxy,
): Promise<{ anchors: TextAnchor[]; pageTexts: PageTextData[] }> {
  const pageTexts = await extractPageTexts(pdfDoc)
  const anchors   = clauses.map((c, i) =>
    anchorClause(c, pageTexts, pdfDoc, i, clauses.length),
  )
  return { anchors, pageTexts }
}
