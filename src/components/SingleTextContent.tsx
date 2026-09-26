'use client'
import Link from 'next/link'
import TextBody from '@/components/TextBody'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { Text, TextLink } from '@/lib/texte'

interface Props {
  text: Text
  older: TextLink | null
  newer: TextLink | null
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

export default function SingleTextContent({ text, older, newer }: Props) {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`"${text.title}" wirklich löschen?`)) return
    const res = await fetch(`/api/admin/texte/${text.slug}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/texte')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(`Fehler beim Löschen: ${data.error ?? res.status}`)
    }
  }

  return (
    <div>
      {isLoggedIn && (
        <div className="admin-bar">
          <Link href={`/texte/${text.slug}/bearbeiten`} className="admin-link">bearbeiten</Link>
          <button onClick={handleDelete} className="admin-link delete-link">löschen</button>
        </div>
      )}
      <article>
        <h2 className="text-title">{text.title}</h2>
        <TextBody content={text.content} />
        <StackedDate dateStr={text.date} />
      </article>
      {(older || newer) && (
        <nav className="text-nav">
          {newer ? (
            <Link href={`/texte/${newer.slug}`} className="text-nav-link text-nav-newer" title={newer.title}>
              <span className="text-nav-arrow">←</span>
              <span className="text-nav-title">{newer.short}</span>
            </Link>
          ) : <span />}
          {older && (
            <Link href={`/texte/${older.slug}`} className="text-nav-link text-nav-older" title={older.title}>
              <span className="text-nav-title">{older.short}</span>
              <span className="text-nav-arrow">→</span>
            </Link>
          )}
        </nav>
      )}
      <Link href="/texte" className="back-link">← alle texte</Link>
    </div>
  )
}
