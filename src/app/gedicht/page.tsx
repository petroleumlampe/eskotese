'use client'
import { useState, useEffect, useCallback } from 'react'

export default function GedichtPage() {
  const [lines, setLines] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const generate = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/gedicht')
    const data = await res.json()
    setLines(data.lines ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { generate() }, [generate])

  return (
    <div className="gedicht-page">
      <div className="gedicht-lines">
        {loading ? (
          <span className="gedicht-loading">·  ·  ·</span>
        ) : (
          lines.map((line, i) => (
            <p key={i} className="gedicht-line">{line}</p>
          ))
        )}
      </div>
      <button
        className="gedicht-neu-btn"
        onClick={generate}
        disabled={loading}
      >
        neu
      </button>
    </div>
  )
}
