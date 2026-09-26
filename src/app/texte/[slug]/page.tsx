import { notFound } from 'next/navigation'
import { getAllTexte, getNeighbors, getTextBySlug } from '@/lib/texte'
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
  const text = getTextBySlug(slug)
  if (!text) notFound()
  const { older, newer } = getNeighbors(slug)
  return <SingleTextContent text={text} older={older} newer={newer} />
}
