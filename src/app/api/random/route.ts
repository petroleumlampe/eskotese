import { NextResponse, NextRequest } from 'next/server'
import { getAllTexte } from '@/lib/texte'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const exclude = req.nextUrl.searchParams.get('exclude') ?? ''
  const texte = getAllTexte()
  if (texte.length === 0) return NextResponse.json({ slug: null })
  const pool = texte.length > 1 ? texte.filter(t => t.slug !== exclude) : texte
  const random = pool[Math.floor(Math.random() * pool.length)]
  return NextResponse.json({ slug: random.slug })
}
