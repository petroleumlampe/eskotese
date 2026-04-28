import { getAllTexte } from '@/lib/texte'
import TexteList from '@/components/TexteList'

export const dynamic = 'force-dynamic'

export default function TextePage() {
  const texte = getAllTexte()
  return <TexteList texte={texte} />
}
