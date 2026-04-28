'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function RandomButton() {
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = async () => {
    const currentSlug = pathname.startsWith('/texte/') ? pathname.split('/')[2] : ''
    const res = await fetch(`/api/random?exclude=${currentSlug}`)
    const data = await res.json()
    if (data.slug) router.push(`/texte/${data.slug}`)
  }

  return (
    <button onClick={handleClick} className="nav-link nav-random">
      zufällig
    </button>
  )
}
