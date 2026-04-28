'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { Text } from '@/lib/texte'

interface Props {
  text: Text
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
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
        <p className="text-date">{formatDate(text.date)}</p>
        <h2 className="text-title">{text.title}</h2>
        <div className="text-content">{text.content}</div>
      </article>
      <Link href="/texte" className="back-link">← alle texte</Link>
    </div>
  )
}
