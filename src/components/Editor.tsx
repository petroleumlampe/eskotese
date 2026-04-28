'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Text } from '@/lib/texte'

interface Props {
  initialText?: Text
}

export default function Editor({ initialText }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialText?.title || '')
  const [date, setDate] = useState(initialText?.date || new Date().toISOString().split('T')[0])
  const [content, setContent] = useState(initialText?.content || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('titel und text dürfen nicht leer sein.')
      return
    }
    setSaving(true)
    setError('')

    try {
      if (initialText) {
        const res = await fetch(`/api/admin/texte/${initialText.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, date, content }),
        })
        if (!res.ok) throw new Error()
        router.push(`/texte/${initialText.slug}`)
        router.refresh()
      } else {
        const res = await fetch('/api/admin/texte', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, date, content }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        router.push(`/texte/${data.slug}`)
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'etwas ist schiefgelaufen.')
      setSaving(false)
    }
  }

  return (
    <div className="editor">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="titel"
        className="editor-input editor-title"
      />
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="editor-input editor-date"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="text..."
        className="editor-textarea"
        rows={15}
      />
      {error && <p className="editor-error">{error}</p>}
      <div className="editor-actions">
        <button onClick={handleSave} disabled={saving} className="btn-save">
          {saving ? '...' : initialText ? 'speichern' : 'veröffentlichen'}
        </button>
        <button onClick={() => router.back()} className="btn-cancel">
          abbrechen
        </button>
      </div>
    </div>
  )
}
