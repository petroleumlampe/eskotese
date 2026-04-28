'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Text } from '@/lib/texte'

interface Props {
  texte: Text[]
}

function getRandomWords(content: string, count: number): string {
  const words = content
    .replace(/[.,!?;:—–\-\n\r]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2)
  if (words.length === 0) return ''
  const shuffled = [...words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length)).join(' ')
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
