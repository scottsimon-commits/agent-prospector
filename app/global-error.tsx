'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="flex flex-col items-center justify-center min-h-screen gap-5 text-center p-4 font-sans">
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Application error</h2>
        <p style={{ color: '#666', maxWidth: 360, margin: 0 }}>
          {error.message || 'An unexpected error occurred. Please refresh the page.'}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
