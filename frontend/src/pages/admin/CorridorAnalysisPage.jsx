import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Route, Truck, Ship, Train, AlertTriangle, MapPin, Filter, ArrowUpDown } from 'lucide-react';

const modeColors = {
  Road: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)', icon: Truck },
  Rail: { bg: 'rgba(6,182,212,0.15)', text: '#22d3ee', border: 'rgba(6,182,212,0.3)', icon: Train },
  Sea: { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', border: 'rgba(99,102,241,0.3)', icon: Ship },
  'Road+Rail': { bg: 'rgba(168,85,247,0.15)', text: '#c084fc', border: 'rgba(168,85,247,0.3)', icon: Route },
};

const congestionColor = (idx) => {
  if (idx < 0.5) return { bg: 'rgba(16,185,129,0.12)', fill: '#10b981', text: '#34d399', label: 'Low' };
  if (idx < 0.7) return { bg: 'rgba(245,158,11,0.12)', fill: '#f59e0b', text: '#fbbf24', label: 'Moderate' };
  if (idx < 0.85) return { bg: 'rgba(251,146,60,0.12)', fill: '#fb923c', text: '#fdba74', label: 'High' };
  return { bg: 'rgba(239,68,68,0.12)', fill: '#ef4444', text: '#f87171', label: 'Critical' };
};

const statusConfig = {
  Low: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
  Moderate: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
  'High Density': { bg: 'rgba(251,146,60,0.12)', text: '#fdba74', border: 'rgba(251,146,60,0.25)', dot: '#fb923c' },
  Critical: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.25)', dot: '#ef4444' },
};

const fmtNum = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
  return v.toLocaleString();
};

export default function CorridorAnalysisPage() {
  const [corridors, setCorridors] = useState([]);
  const [odFlows, setOdFlows] = useState({ flows: [], locations: [] });
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('congestion');

  useEffect(() => {
    api.getCorridors().then(setCorridors).catch(console.error).finally(() => setLoading(false));
    api.getODFlows().then(setOdFlows).catch(console.error);
  }, []);

  const filtered = corridors
    .filter(c => modeFilter === 'All' || c.mode === modeFilter)
    .sort((a, b) => {
      if (sortBy === 'congestion') return (b.congestion_index || 0) - (a.congestion_index || 0);
      return (b.cargo_mt_day || 0) - (a.cargo_mt_day || 0);
    });

  const totalCorridors = corridors.length;
  const highDensityCount = corridors.filter(c => c.status === 'High Density').length;
  const criticalCount = corridors.filter(c => c.status === 'Critical').length;
  const totalCargo = corridors.reduce((s, c) => s + (c.cargo_mt_day || 0), 0);
  const avgCongestion = corridors.length
    ? corridors.reduce((s, c) => s + (c.congestion_index || 0), 0) / corridors.length
    : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>Loading corridor analysis…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Corridor Analysis
          </h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>
            Freight corridor performance, congestion metrics &amp; origin–destination flows for Andhra Pradesh
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {[
          { title: 'Total Corridors', value: totalCorridors, subtitle: 'Active freight routes', color: 'navy', icon: Route },
          { title: 'High Density', value: highDensityCount, subtitle: 'Corridors at risk', color: 'amber', icon: AlertTriangle },
          { title: 'Critical', value: criticalCount, subtitle: 'Immediate attention', color: 'red', icon: AlertTriangle },
          { title: 'Daily Cargo Volume', value: fmtNum(totalCargo) + ' MT', subtitle: 'Total goods moved/day', color: 'cyan', icon: Truck },
          { title: 'Avg Congestion', value: (avgCongestion * 100).toFixed(0) + '%', subtitle: 'System-wide average', color: 'green', icon: Route },
        ].map((kpi, i) => {
          const cMap = {
            navy: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', glow: 'rgba(99,102,241,0.2)', soft: 'rgba(99,102,241,0.1)' },
            amber: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', glow: 'rgba(245,158,11,0.2)', soft: 'rgba(245,158,11,0.1)' },
            red: { bg: 'rgba(239,68,68,0.1)', text: '#f87171', glow: 'rgba(239,68,68,0.2)', soft: 'rgba(239,68,68,0.1)' },
            cyan: { bg: 'rgba(6,182,212,0.1)', text: '#22d3ee', glow: 'rgba(6,182,212,0.2)', soft: 'rgba(6,182,212,0.1)' },
            green: { bg: 'rgba(16,185,129,0.1)', text: '#34d399', glow: 'rgba(16,185,129,0.2)', soft: 'rgba(16,185,129,0.1)' },
          };
          const c = cMap[kpi.color];
          return (
            <div key={i} style={{
              background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16,
              padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.bg + '80'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${c.bg}40`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', background: c.glow, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.title}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: c.soft, border: `1px solid ${c.bg}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <kpi.icon size={15} color={c.text} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0.375rem' }}>{kpi.value}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', lineHeight: 1.3 }}>{kpi.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Mode Filter + Sort */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={16} color="var(--c-text-muted)" />
          {['All', 'Road', 'Rail', 'Sea'].map(m => {
            const count = m === 'All' ? corridors.length : corridors.filter(c => c.mode === m).length;
            return (
              <button key={m} onClick={() => setModeFilter(m)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: modeFilter === m ? 'rgba(99,102,241,0.15)' : 'var(--c-surface)',
                border: `1px solid ${modeFilter === m ? 'rgba(99,102,241,0.3)' : 'var(--c-border)'}`,
                color: modeFilter === m ? '#818cf8' : 'var(--c-text-muted)',
              }}>
                {m === 'All' ? 'All Modes' : m}
                <span style={{ marginLeft: 6, opacity: 0.6, fontFamily: 'JetBrains Mono', fontSize: '0.7rem' }}>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowUpDown size={14} color="var(--c-text-muted)" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '6px 12px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8,
              color: 'var(--c-text-2)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', outline: 'none', cursor: 'pointer',
            }}>
            <option value="congestion">Congestion Index</option>
            <option value="cargo">Cargo Volume</option>
          </select>
        </div>
      </div>

      {/* Corridor Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
        {filtered.map(c => {
          const mc = modeColors[c.mode] || modeColors.Road;
          const ModeIcon = mc.icon;
          const cg = congestionColor(c.congestion_index || 0);
          const st = statusConfig[c.status] || statusConfig.Low;
          const pct = Math.min((c.congestion_index || 0) * 100, 100);

          return (
            <div key={c.id} style={{
              background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16,
              padding: '1.5rem', position: 'relative', overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${mc.text}, ${cg.fill})`, opacity: 0.5 }} />

              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk', letterSpacing: '-0.01em', marginBottom: 6, lineHeight: 1.3 }}>
                    {c.name}
                  </h3>
                  {/* Mode Badge */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
                    background: mc.bg, border: `1px solid ${mc.border}`, color: mc.text,
                    fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    <ModeIcon size={13} />
                    {c.mode}
                  </span>
                </div>
                {/* Status Badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600,
                  background: st.bg, border: `1px solid ${st.border}`, color: st.text,
                  fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                  {c.status}
                </span>
              </div>

              {/* Metrics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distance</span>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'JetBrains Mono' }}>{c.distance_km?.toLocaleString()} km</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily Traffic</span>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'JetBrains Mono' }}>
                    {c.mode === 'Road' ? fmtNum(c.daily_trucks) + ' trucks' : c.mode === 'Rail' ? fmtNum(c.daily_trains) + ' trains' : c.mode === 'Sea' ? fmtNum(c.daily_vessels) + ' vessels' : fmtNum(c.daily_trucks) + ' trucks'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cargo / Day</span>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'JetBrains Mono' }}>{fmtNum(c.cargo_mt_day)} MT</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Congestion</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--c-surface-2)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cg.fill, borderRadius: 3, boxShadow: `0 0 8px ${cg.fill}60`, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: cg.text, fontFamily: 'JetBrains Mono', minWidth: 40, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Bottlenecks */}
              {c.bottlenecks && c.bottlenecks.length > 0 && (
                <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <MapPin size={12} color="var(--c-text-muted)" />
                    <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bottlenecks</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {c.bottlenecks.map((b, i) => (
                      <span key={i} style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 500,
                        background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)',
                        fontFamily: 'JetBrains Mono',
                      }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* O-D Flows Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
          <Route size={16} color="var(--c-text-muted)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)' }}>Origin–Destination Flows</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', marginLeft: 'auto' }}>
            {odFlows.flows?.length || 0} records
          </span>
        </div>
        <div className="table-container table-scroll" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>Origin</th>
                <th>Destination</th>
                <th>Mode</th>
                <th>Volume (MT)</th>
                <th>Commodity</th>
              </tr>
            </thead>
            <tbody>
              {odFlows.flows?.length > 0 ? odFlows.flows.map((f, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--c-text)' }}>{f.origin}</td>
                  <td style={{ fontWeight: 600, color: 'var(--c-text)' }}>{f.dest}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                      fontFamily: 'JetBrains Mono',
                      background: (modeColors[f.mode] || modeColors.Road).bg,
                      color: (modeColors[f.mode] || modeColors.Road).text,
                      border: `1px solid ${(modeColors[f.mode] || modeColors.Road).border}`,
                    }}>
                      {f.mode === 'Road' ? <Truck size={11} /> : f.mode === 'Rail' ? <Train size={11} /> : f.mode === 'Sea' ? <Ship size={11} /> : <Route size={11} />}
                      {f.mode}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#34d399', fontSize: '0.85rem' }}>{fmtNum(f.volume_mt)}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--c-text-2)' }}>{f.commodity}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--c-text-muted)' }}>No O-D flow data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
