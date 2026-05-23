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
} {
  const bigrams = new Map<string, string[]>()
  const freq = new Map<string, number>()
  const rawStarters: string[] = []

  for (const text of texts) {
    const lines = text.split(/\n+/)
    for (const line of lines) {
      const words = tokenize(line)
      if (words.length === 0) continue

      if (!STOPWORDS.has(words[0]) && words[0].length >= 3) {
        rawStarters.push(words[0])
      }

      for (let i = 0; i < words.length - 1; i++) {
        const cur = words[i]
        const next = words[i + 1]
        if (!bigrams.has(cur)) bigrams.set(cur, [])
        bigrams.get(cur)!.push(next)
        freq.set(cur, (freq.get(cur) ?? 0) + 1)
      }
    }
  }

  // Weight rare starters more heavily (inverse frequency)
  const starters: string[] = []
  for (const w of rawStarters) {
    const count = freq.get(w) ?? 1
    const weight = count <= 2 ? 3 : 1
    for (let i = 0; i < weight; i++) starters.push(w)
  }

  return { bigrams, starters }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Weighted: 3→5%, 4→25%, 5→50%, 6→20%
function pickLineLength(): number {
  const r = Math.random()
  if (r < 0.05) return 3
  if (r < 0.30) return 4
  if (r < 0.80) return 5
  return 6
}

function pickUnused<T extends string>(candidates: T[], used: Set<string>, fallback: T[]): T {
  for (let i = 0; i < 8; i++) {
    const w = pick(candidates)
    if (!used.has(w)) return w
  }
  const fresh = (fallback as T[]).filter(w => !used.has(w))
  return fresh.length > 0 ? pick(fresh) : pick(candidates)
}

function generateLine(
  bigrams: Map<string, string[]>,
  starters: string[],
  allWords: string[],
  length: number
): string {
  const pool = starters.length > 0 ? starters : allWords.filter(w => !STOPWORDS.has(w) && w.length >= 3)
  const used = new Set<string>()

  const first = pickUnused(pool.length > 0 ? pool : allWords, used, allWords)
  used.add(first)
  const words: string[] = [first]

  for (let i = 1; i < length; i++) {
    const jump = Math.random() < 0.4
    const candidates = !jump ? bigrams.get(words[words.length - 1]) : undefined
    let next: string
    if (candidates && candidates.length > 0) {
      next = pickUnused(candidates, used, allWords)
    } else {
      next = pickUnused(pool.length > 0 ? pool : allWords, used, allWords)
    }
    used.add(next)
    words.push(next)
  }

  return words.join(' ')
}

export async function GET() {
  const texte = getAllTexte()
  if (texte.length === 0) {
    return NextResponse.json({ lines: ['keine texte gefunden'] })
  }

  const contents = texte.map(t => t.content)
  const { bigrams, starters } = buildMarkov(contents)
  const allWords = Array.from(bigrams.keys())

  if (allWords.length < 5) {
    return NextResponse.json({ lines: ['zu wenig worte'] })
  }

  const lines = Array.from({ length: 4 }, () =>
    generateLine(bigrams, starters, allWords, pickLineLength())
  )

  return NextResponse.json({ lines })
}
