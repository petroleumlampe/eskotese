'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Text } from '@/lib/texte'

interface Props {
  texte: Text[]
}

const STOPWORDS = new Set([
  'das', 'die', 'der', 'des', 'dem', 'den',
  'ein', 'eine', 'einer', 'einem', 'einen', 'eines',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
  'und', 'oder', 'aber', 'doch', 'auch', 'noch',
  'ist', 'bin', 'bist', 'war', 'hat', 'haben',
  'nicht', 'kein', 'keine', 'mit', 'auf', 'in',
  'an', 'zu', 'von', 'aus', 'bei', 'wie', 'als',
  'so', 'dann', 'wenn', 'weil', 'dass', 'mir',
])

function getWeight(word: string): number {
  const w = word.toLowerCase()
  if (STOPWORDS.has(w)) return 0.33
  if (word.length < 3) return 0.5
  return 1.0
}

function getRandomWords(content: string, count: number): string {
  const words = content
    .replace(/[.,!?;:—–\-\n\r]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 0)
  if (words.length === 0) return ''

  const weighted = words.map(w => ({ word: w, sort: Math.random() * getWeight(w) }))
  weighted.sort((a, b) => b.sort - a.sort)
  return weighted.slice(0, Math.min(count, weighted.length)).map(w => w.word).join(' ')
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function TexteList({ texte }: Props) {
  const [previews, setPreviews] = useState<Record<string, string>>({})

  useEffect(() => {
    const p: Record<string, string> = {}
    texte.forEach(t => { p[t.slug] = getRandomWords(t.content, 5) })
    setPreviews(p)
  }, [texte])

  if (texte.length === 0) {
    return <p className="empty-state">noch keine texte.</p>
  }

  return (
    <div className="texte-list">
      {texte.map(t => (
        <Link key={t.slug} href={`/texte/${t.slug}`} className="texte-item">
          <p className="text-date">{formatDate(t.date)}</p>
          <h2 className="texte-item-title">{t.title}</h2>
          {previews[t.slug] && (
            <p className="texte-item-preview">{previews[t.slug]}</p>
          )}
        </Link>
      ))}
    </div>
  )
}
