'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="site-header">
      <div className="site-title">
        <Link href="/">eskotese!</Link>
      </div>
      <p className="site-subtitle">
        ich fuge worte zusammen, eine mauer entsteht.<br />
        sie die mauer sagt stop genug aua
      </p>
      <nav className="site-nav">
        <Link href="/" className={`nav-link${pathname === '/' ? ' active' : ''}`}>
          recent
        </Link>
        <span className="nav-sep">·</span>
        <Link href="/texte" className={`nav-link${pathname.startsWith('/texte') ? ' active' : ''}`}>
          texte
        </Link>
        <span className="nav-sep">·</span>
        <Link href="/ueber" className={`nav-link${pathname === '/ueber' ? ' active' : ''}`}>
          über
        </Link>
      </nav>
    </header>
  )
}
