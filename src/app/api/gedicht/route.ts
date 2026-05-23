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
  const starters: string[] = []

  for (const text of texts) {
    const lines = text.split(/\n+/)
    for (const line of lines) {
      const words = tokenize(line)
      if (words.length === 0) continue

      if (!STOPWORDS.has(words[0])) starters.push(words[0])

      for (let i = 0; i < words.length - 1; i++) {
        const cur = words[i]
        const next = words[i + 1]
        if (!bigrams.has(cur)) bigrams.set(cur, [])
        bigrams.get(cur)!.push(next)
      }
    }
  }

  return { bigrams, starters }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateLine(
  bigrams: Map<string, string[]>,
  starters: string[],
  allWords: string[],
  length: number
): string {
  const pool = starters.length > 0 ? starters : allWords.filter(w => !STOPWORDS.has(w))
  const words: string[] = [pick(pool.length > 0 ? pool : allWords)]

  for (let i = 1; i < length; i++) {
    const next = bigrams.get(words[words.length - 1])
    if (next && next.length > 0) {
      words.push(pick(next))
    } else {
      words.push(pick(pool.length > 0 ? pool : allWords))
    }
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
    generateLine(bigrams, starters, allWords, 5)
  )

  return NextResponse.json({ lines })
}
