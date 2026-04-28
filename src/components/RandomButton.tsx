'use client'
import { useRouter } from 'next/navigation'

export default function RandomButton() {
  const router = useRouter()

  const handleClick = async () => {
    const res = await fetch('/api/random')
    const data = await res.json()
    if (data.slug) router.push(`/texte/${data.slug}`)
  }

  return (
    <button onClick={handleClick} className="nav-link nav-random">
      zufällig
    </button>
  )
}
