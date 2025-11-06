import { ImageResponse } from 'next/og';

export async function GET() {
  const title = 'Second Horse Dating';
  const subtitle = 'Saddle up! Swipe your perfect pasture partner.';
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#111,#222)',
          color: '#fff',
          fontFamily: 'ui-sans-serif, system-ui',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, background:
            'radial-gradient(600px 300px at 20% 20%, rgba(255,215,0,0.15), transparent), radial-gradient(600px 300px at 80% 80%, rgba(255,105,180,0.15), transparent)'
        }} />
        <div style={{ fontSize: 64, fontWeight: 800 }}>🏇 {title}</div>
        <div style={{ fontSize: 28, marginTop: 16, color: '#ffd700' }}>{subtitle}</div>
        <div style={{ fontSize: 20, marginTop: 24, color: '#ddd' }}>samvannoord.nl</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

