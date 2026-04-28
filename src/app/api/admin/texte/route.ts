import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { slugify, saveText, textExists } from '@/lib/texte'

export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'nicht eingeloggt.' }, { status: 401 })
  }

  const { title, date, content } = await request.json()

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'titel und text sind pflicht.' }, { status: 400 })
  }

  const slug = slugify(title)

  if (textExists(slug)) {
    const uniqueSlug = `${slug}-${Date.now()}`
    saveText(uniqueSlug, title, date || new Date().toISOString().split('T')[0], content)
    return NextResponse.json({ success: true, slug: uniqueSlug })
  }

  saveText(slug, title, date || new Date().toISOString().split('T')[0], content)
  return NextResponse.json({ success: true, slug })
}
