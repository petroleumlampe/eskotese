export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAllTexte } from '@/lib/texte'

const STOPWORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'eines',
  'und', 'oder', 'aber', 'denn', 'weil', 'wenn', 'als', 'wie', 'dass', 'ob',
  'in', 'an', 'auf', 'von', 'zu', 'mit', 'bei', 'nach', 'aus', 'für', 'um',
  'über', 'unter', 'vor', 'hinter', 'zwischen', 'durch', 'gegen', 'ohne',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'sich',
  'mein', 'dein', 'sein', 'ihr', 'unser', 'euer',
  'ist', 'bin', 'bist', 'sind', 'seid', 'war', 'waren', 'wird', 'werden',
  'hat', 'haben', 'hatte', 'hatten', 'nicht', 'noch', 'schon', 'auch', 'nur',
  'dann', 'da', 'hier', 'so', 'ja', 'nein', 'wo', 'was', 'wer', 'wie',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/["""„‟]/g, '')
    .split(/[\s\n\r]+/)
    .map(w => w.replace(/^[–—\-.,!?;:()\[\]]+|[–—\-.,!?;:()\[\]]+$/g, ''))
    .filter(w => w.length > 1)
}

function buildMarkov(texts: string[]): {
  bigrams: Map<string, string[]>
  starters: string[]
  wordPool: string[]
} {
  const bigrams = new Map<string, string[]>()
  const freq = new Map<string, number>()
  const rawStarters: string[] = []

  for (const text of texts) {
    const lines = text.split(/\n+/)
    for (const line of lines) {
      const words = tokenize(line)
      if (words.length === 0) continue

      // Track ALL tokens for frequency (including last word of each line)
      for (const w of words) {
        freq.set(w, (freq.get(w) ?? 0) + 1)
      }

      if (!STOPWORDS.has(words[0]) && words[0].length >= 3) {
        rawStarters.push(words[0])
      }

      for (let i = 0; i < words.length - 1; i++) {
        const cur = words[i]
        const next = words[i + 1]
        if (!bigrams.has(cur)) bigrams.set(cur, [])
        bigrams.get(cur)!.push(next)
      }
    }
  }

  // starters: line-starting words, inverse-frequency weighted
  const starters: string[] = []
  const seenStarters = new Set<string>()
  for (const w of rawStarters) {
    // Deduplicate: each unique starter appears at most once in rawStarters loop
    // but weight it by inverse corpus frequency
    if (!seenStarters.has(w)) {
      seenStarters.add(w)
      const count = freq.get(w) ?? 1
      const weight = count <= 2 ? 3 : count <= 5 ? 2 : 1
      for (let i = 0; i < weight; i++) starters.push(w)
    }
  }

  // wordPool: ALL non-stopwords with length >= 3, inverse-frequency weighted
  // This includes words that only appear at line endings (never bigram keys)
  const wordPool: string[] = []
  for (const [w, count] of freq.entries()) {
    if (STOPWORDS.has(w) || w.length < 3) continue
    const weight = count <= 2 ? 3 : count <= 5 ? 2 : 1
    for (let i = 0; i < weight; i++) wordPool.push(w)
  }

  return { bigrams, starters, wordPool }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Weighted: 1→2%, 2→5%, 3→6%, 4→22%, 5→44%, 6→21%
function pickLineLength(): number {
  const r = Math.random()
  if (r < 0.02) return 1
  if (r < 0.07) return 2
  if (r < 0.13) return 3
  if (r < 0.35) return 4
  if (r < 0.79) return 5
  return 6
}

const PUNCT_ATTACHED = ['.', ',', '!', '?']
const PUNCT_STANDALONE = ['&', '–']
const ALL_PUNCT = [...PUNCT_ATTACHED, ...PUNCT_STANDALONE]

function addPunctuation(words: string[]): string {
  if (words.length < 2) return words.join(' ')
  const result = [...words]
  const inserts: { pos: number; punct: string }[] = []
  for (let i = 0; i < result.length - 1; i++) {
    if (Math.random() < 0.22) {
      inserts.push({ pos: i, punct: ALL_PUNCT[Math.floor(Math.random() * ALL_PUNCT.length)] })
    }
  }
  for (let j = inserts.length - 1; j >= 0; j--) {
    const { pos, punct } = inserts[j]
    if (PUNCT_ATTACHED.includes(punct)) {
      result[pos] = result[pos] + punct
    } else {
      result.splice(pos + 1, 0, punct)
    }
  }
  return result.join(' ')
}

function isFree(w: string, lineUsed: Set<string>, globalUsed: Set<string>): boolean {
  if (lineUsed.has(w)) return false
  if (STOPWORDS.has(w)) return true
  return !globalUsed.has(w)
}

function pickUnused(candidates: string[], lineUsed: Set<string>, globalUsed: Set<string>, fallback: string[]): string {
  for (let i = 0; i < 12; i++) {
    const w = pick(candidates)
    if (isFree(w, lineUsed, globalUsed)) return w
  }
  const fresh = fallback.filter(w => isFree(w, lineUsed, globalUsed))
  return fresh.length > 0 ? pick(fresh) : pick(candidates)
}

function generateLine(
  bigrams: Map<string, string[]>,
  starters: string[],
  wordPool: string[],
  length: number,
  globalUsed: Set<string>,
  useParens: boolean
): string {
  const lineUsed = new Set<string>()

  const first = pickUnused(starters.length > 0 ? starters : wordPool, lineUsed, globalUsed, wordPool)
  lineUsed.add(first)
  if (!STOPWORDS.has(first)) globalUsed.add(first)
  const words: string[] = [first]

  for (let i = 1; i < length; i++) {
    const jump = Math.random() < 0.7
    const candidates = !jump ? bigrams.get(words[words.length - 1]) : undefined
    let next: string
    if (candidates && candidates.length > 0) {
      next = pickUnused(candidates, lineUsed, globalUsed, wordPool)
    } else {
      next = pickUnused(wordPool, lineUsed, globalUsed, wordPool)
    }
    lineUsed.add(next)
    if (!STOPWORDS.has(next)) globalUsed.add(next)
    words.push(next)
  }

  const line = addPunctuation(words)
  return useParens ? `(${line})` : line
}

export async function GET() {
  const texte = getAllTexte()
  if (texte.length === 0) {
    return NextResponse.json({ lines: ['keine texte gefunden'] })
  }

  const contents = texte.map(t => t.content)
  const { bigrams, starters, wordPool } = buildMarkov(contents)

  if (wordPool.length < 5) {
    return NextResponse.json({ lines: ['zu wenig worte'] })
  }

  const globalUsed = new Set<string>()
  const parensIndex = Math.random() < 0.05 ? Math.floor(Math.random() * 4) : -1
  const lines = Array.from({ length: 4 }, (_, i) =>
    generateLine(bigrams, starters, wordPool, pickLineLength(), globalUsed, i === parensIndex)
  )

  return NextResponse.json({ lines })
}
