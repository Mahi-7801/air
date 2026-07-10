export default function StatusBadge({ status }) {
  const map = {
    Connected:          { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
    Active:             { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
    Approved:           { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
    Pending:            { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
    'Under Review':     { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
    Planned:            { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)', dot: '#6366f1' },
    'Under Construction': { bg: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: 'rgba(6,182,212,0.25)', dot: '#06b6d4' },
    Proposed:           { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)', dot: '#64748b' },
    Error:              { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)',  dot: '#ef4444' },
  };

  const s = map[status] || map.Pending;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: '0.68rem', fontWeight: 600, color: s.color,
      fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}
