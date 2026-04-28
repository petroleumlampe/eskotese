import { notFound } from 'next/navigation'
import { getTextBySlug } from '@/lib/texte'
import EditorPage from '@/components/EditorPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BearbeitenPage({ params }: Props) {
  const { slug } = await params
  const text = getTextBySlug(slug)
  if (!text) notFound()
  return <EditorPage initialText={text} />
}
