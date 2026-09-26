import { notFound } from 'next/navigation'
import { getAllTexte, getTextWithNeighbors } from '@/lib/texte'
import SingleTextContent from '@/components/SingleTextContent'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const texte = getAllTexte()
  return texte.map(t => ({ slug: t.slug }))
}

export default async function SingleTextPage({ params }: Props) {
  const { slug } = await params
  const found = getTextWithNeighbors(slug)
  if (!found) notFound()
  return <SingleTextContent {...found} />
}
