import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Agent Prospector — Discover, build and deploy AI agents'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            🤖
          </div>
          <span style={{ color: '#a1a1aa', fontSize: '24px', fontWeight: 500 }}>Agent Prospector</span>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: '#ffffff',
            fontSize: '72px',
            fontWeight: 800,
            lineHeight: 1.1,
            margin: '0 0 24px 0',
            maxWidth: '900px',
          }}
        >
          Discover, build &amp;{'\n'}deploy AI agents
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: '#a1a1aa',
            fontSize: '28px',
            margin: '0 0 48px 0',
            maxWidth: '700px',
            lineHeight: 1.5,
          }}
        >
          Chat with AI to find opportunities, scaffold TypeScript code, and ship to GitHub + Vercel in one click.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {['Prospect', 'Build', 'Deploy'].map((label, i) => (
            <div
              key={label}
              style={{
                padding: '10px 24px',
                borderRadius: '100px',
                background: i === 0 ? '#6366f1' : 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 600,
                border: i !== 0 ? '1px solid rgba(255,255,255,0.2)' : 'none',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
