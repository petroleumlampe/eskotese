'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function WorteButton() {
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = () => {
    if (pathname === '/gedicht') {
      window.dispatchEvent(new CustomEvent('gedicht-refresh'))
    } else {
      router.push('/gedicht')
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`nav-link${pathname === '/gedicht' ? ' active' : ''}`}
    >
      worte
    </button>
  )
}
