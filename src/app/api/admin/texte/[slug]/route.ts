import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { saveText, deleteText, textExists } from '@/lib/texte'
import { githubSaveText, githubDeleteText, isGithubConfigured, triggerDeploy } from '@/lib/github'

interface Params { params: Promise<{ slug: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'nicht eingeloggt.' }, { status: 401 })
  }

  const { slug } = await params
  const { title, date, content } = await request.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'titel und text sind pflicht.' }, { status: 400 })
  }

  if (isGithubConfigured()) {
    const fileContent = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndate: "${date}"\n---\n${content}`
    const ok = await githubSaveText(slug, fileContent)
    if (!ok) return NextResponse.json({ error: 'Fehler beim Speichern auf GitHub.' }, { status: 500 })
    triggerDeploy()
    return NextResponse.json({ success: true, pending: true })
  }

  if (!textExists(slug)) {
    return NextResponse.json({ error: 'text nicht gefunden.' }, { status: 404 })
  }
  saveText(slug, title, date, content)
  return NextResponse.json({ success: true, pending: false })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'nicht eingeloggt.' }, { status: 401 })
  }

  const { slug } = await params

  if (isGithubConfigured()) {
    const result = await githubDeleteText(slug)
    if (!result.ok) return NextResponse.json({ error: result.error ?? 'Fehler beim Löschen auf GitHub.' }, { status: 500 })
    triggerDeploy()
    return NextResponse.json({ success: true })
  }

  if (!textExists(slug)) {
    return NextResponse.json({ error: 'text nicht gefunden.' }, { status: 404 })
  }
  deleteText(slug)
  return NextResponse.json({ success: true })
}
