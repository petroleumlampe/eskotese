'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import LoginModal from '@/components/LoginModal'

export default function UeberPage() {
  const { isLoggedIn, logout } = useAuth()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="ueber-page">
      <div className="ueber-text">
        <p>
          hell und lodernd brennt die fackel – sie zögert nicht: wo sie ist, wird licht
        </p>
        <p>
          hier werden texte in form gegossen! mein traum ist ein buch zu schreiben,
          aber nur, damit das cover schön sein kann. kleinschreiben ist rebellion, natürlich.
        </p>
        <p className="ueber-signature">&lt;3, ben</p>
      </div>

      <div className="ueber-login-area">
        {isLoggedIn ? (
          <span className="logged-in-indicator">
            eingeloggt · <button onClick={logout} className="logout-btn">ausloggen</button>
          </span>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="login-dot"
            aria-label="admin login"
          >
            ·
          </button>
        )}
      </div>

      {showModal && <LoginModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
