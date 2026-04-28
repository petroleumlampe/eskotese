'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import type { Text } from '@/lib/texte'

interface Props {
  text: Text | null
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function RecentContent({ text }: Props) {
  const { isLoggedIn } = useAuth()

  if (!text) {
    return (
      <div>
        {isLoggedIn && (
          <div className="admin-bar">
            <Link href="/neu" className="admin-btn">+ neuer text</Link>
          </div>
        )}
        <p className="empty-state">noch keine texte.</p>
      </div>
    )
  }

  return (
    <div className="recent-page">
      {isLoggedIn && (
        <div className="admin-bar">
          <Link href={`/texte/${text.slug}/bearbeiten`} className="admin-link">bearbeiten</Link>
          <Link href="/neu" className="admin-btn">+ neuer text</Link>
        </div>
      )}
      <article>
        <p className="text-date">{formatDate(text.date)}</p>
        <h2 className="text-title">{text.title}</h2>
        <div className="text-content">{text.content}</div>
      </article>
    </div>
  )
}
