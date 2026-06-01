import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { slugify, saveText, textExists } from '@/lib/texte'
import { githubSaveText, isGithubConfigured, triggerDeploy } from '@/lib/github'

export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'nicht eingeloggt.' }, { status: 401 })
  }

  const { title, date, content } = await request.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'titel und text sind pflicht.' }, { status: 400 })
  }

  const base = slugify(title)
  const slug = textExists(base) ? `${base}-${Date.now()}` : base
  const finalDate = date || new Date().toISOString().split('T')[0]

  if (isGithubConfigured()) {
    const fileContent = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndate: "${finalDate}"\n---\n${content}`
    const result = await githubSaveText(slug, fileContent)
    if (!result.ok) return NextResponse.json({ error: result.error ?? 'Fehler beim Speichern auf GitHub.' }, { status: 500 })
    triggerDeploy()
    return NextResponse.json({ success: true, slug, pending: true })
  }

  saveText(slug, title, finalDate, content)
  return NextResponse.json({ success: true, slug, pending: false })
}
