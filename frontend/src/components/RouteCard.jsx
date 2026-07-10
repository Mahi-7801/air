import StatusBadge from './StatusBadge';
import { Plane, ArrowRight, TrendingUp } from 'lucide-react';

export default function RouteCard({ route }) {
  const score = route.demand_score || 0;
  const scoreColor = score >= 80 ? '#6366f1' : score >= 60 ? '#f59e0b' : '#64748b';
  const scoreGlow = score >= 80 ? 'rgba(99,102,241,0.3)' : score >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(100,116,139,0.2)';

  return (
    <div style={{
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: 16,
      padding: '1.25rem',
      transition: 'all 0.25s ease',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--c-border)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plane size={15} color="#818cf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9rem', color: 'var(--c-text)' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.875rem', color: '#818cf8' }}>
                {route.airport_code || 'AP'}
              </span>
              <ArrowRight size={13} color="var(--c-text-muted)" />
              <span>{route.destination}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={route.status} />
      </div>

      {/* Demand score */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Demand Score
          </span>
          <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.875rem', color: scoreColor }}>
            {score}%
          </span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'var(--c-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)`,
            width: `${score}%`,
            boxShadow: `0 0 8px ${scoreGlow}`,
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* Reasoning */}
      <p style={{
        fontSize: '0.8rem', color: 'var(--c-text-muted)', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {route.reasoning}
      </p>
    </div>
  );
}
