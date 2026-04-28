'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Editor from '@/components/Editor'
import type { Text } from '@/lib/texte'

interface Props {
  initialText?: Text
}

export default function EditorPage({ initialText }: Props) {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) {
      // Wait a moment to allow auth check to complete before redirecting
      const timer = setTimeout(() => {
        if (!isLoggedIn) router.push('/')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn) {
    return <p className="empty-state">einen moment...</p>
  }

  return (
    <div>
      <p className="editor-heading">
        {initialText ? `bearbeiten: ${initialText.title}` : 'neuer text'}
      </p>
      <Editor initialText={initialText} />
    </div>
  )
}
