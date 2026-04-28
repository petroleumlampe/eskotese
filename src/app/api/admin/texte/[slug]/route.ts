import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { saveText, deleteText, textExists } from '@/lib/texte'

interface Params { params: Promise<{ slug: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'nicht eingeloggt.' }, { status: 401 })
  }

  const { slug } = await params
  if (!textExists(slug)) {
    return NextResponse.json({ error: 'text nicht gefunden.' }, { status: 404 })
  }

  const { title, date, content } = await request.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'titel und text sind pflicht.' }, { status: 400 })
  }

  saveText(slug, title, date, content)
  return NextResponse.json({ success: true })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'nicht eingeloggt.' }, { status: 401 })
  }

  const { slug } = await params
  if (!textExists(slug)) {
    return NextResponse.json({ error: 'text nicht gefunden.' }, { status: 404 })
  }

  deleteText(slug)
  return NextResponse.json({ success: true })
}
