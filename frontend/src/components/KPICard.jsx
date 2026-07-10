import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  navy:   { bg: '#6366f1', text: '#818cf8', glow: 'rgba(99,102,241,0.2)', soft: 'rgba(99,102,241,0.1)' },
  amber:  { bg: '#f59e0b', text: '#fbbf24', glow: 'rgba(245,158,11,0.2)',  soft: 'rgba(245,158,11,0.1)' },
  green:  { bg: '#10b981', text: '#34d399', glow: 'rgba(16,185,129,0.2)',  soft: 'rgba(16,185,129,0.1)' },
  red:    { bg: '#ef4444', text: '#f87171', glow: 'rgba(239,68,68,0.2)',   soft: 'rgba(239,68,68,0.1)'  },
  cyan:   { bg: '#06b6d4', text: '#22d3ee', glow: 'rgba(6,182,212,0.2)',   soft: 'rgba(6,182,212,0.1)'  },
};

export default function KPICard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = 'navy' }) {
  const c = colorMap[color] || colorMap.navy;

  return (
    <div style={{
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: 16,
      padding: '1.375rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = c.bg + '50';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${c.bg}20`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--c-border)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: c.glow, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: 600, color: 'var(--c-text-muted)',
          fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: c.soft, border: `1px solid ${c.bg}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={17} color={c.text} />
          </div>
        )}
      </div>

      <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0.5rem' }}>
        {value}
      </div>

      {subtitle && (
        <p style={{ fontSize: '0.775rem', color: 'var(--c-text-muted)', lineHeight: 1.4 }}>{subtitle}</p>
      )}

      {trend !== undefined && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          marginTop: '0.625rem', padding: '3px 8px', borderRadius: 6,
          background: trend >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${trend >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          fontSize: '0.7rem', fontWeight: 600, fontFamily: 'JetBrains Mono',
          color: trend >= 0 ? '#34d399' : '#f87171',
        }}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend >= 0 ? '+' : ''}{trend}% {trendLabel || 'vs last year'}
        </div>
      )}
    </div>
  );
}
