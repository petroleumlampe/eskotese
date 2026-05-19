'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { Text } from '@/lib/texte'

interface Props {
  text: Text
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

export default function SingleTextContent({ text }: Props) {
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
        <div className="text-content">{text.content}</div>
        <StackedDate dateStr={text.date} />
      </article>
      <Link href="/texte" className="back-link">← alle texte</Link>
    </div>
  )
}
