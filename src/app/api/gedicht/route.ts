export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAllTexte } from '@/lib/texte'
import { generateGedicht } from '@/lib/gedicht'
import { generateGedichtAlt } from '@/lib/gedicht-alt'

export async function GET() {
  const texte = getAllTexte()
  if (texte.length === 0) {
    return NextResponse.json({ lines: ['keine texte gefunden'] })
  }

  // Bei jedem Aufruf entscheidet der Zufall, welcher Algorithmus dichtet
  const contents = texte.map(t => t.content)
  const lines = Math.random() < 0.5 ? generateGedicht(contents) : generateGedichtAlt(contents)
  return NextResponse.json({ lines })
}
