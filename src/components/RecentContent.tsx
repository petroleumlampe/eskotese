'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import type { Text } from '@/lib/texte'

interface Props {
  text: Text | null
}

function StackedDate({ dateStr }: { dateStr: string }) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear()).slice(-2)
  return (
    <div className="text-date-stacked">
      <span>{day}</span>
      <span>{month}</span>
      <span>{year}</span>
    </div>
  )
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
        <h2 className="text-title">{text.title}</h2>
        <div className="text-content">{text.content}</div>
        <StackedDate dateStr={text.date} />
      </article>
    </div>
  )
}
