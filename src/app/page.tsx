import { getAllTexte } from '@/lib/texte'
import RecentContent from '@/components/RecentContent'

export const dynamic = 'force-dynamic'

export default function RecentPage() {
  const texte = getAllTexte()
  const newest = texte[0] ?? null
  return <RecentContent text={newest} />
}
