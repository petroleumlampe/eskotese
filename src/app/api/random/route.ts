import { NextResponse } from 'next/server'
import { getAllTexte } from '@/lib/texte'

export async function GET() {
  const texte = getAllTexte()
  if (texte.length === 0) return NextResponse.json({ slug: null })
  const random = texte[Math.floor(Math.random() * texte.length)]
  return NextResponse.json({ slug: random.slug })
}
