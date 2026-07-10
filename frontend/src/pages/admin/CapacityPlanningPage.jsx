import { useState, useEffect } from 'react';
import { api } from '../../api';
import { AlertTriangle, CheckCircle, Gauge, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const getUtilColor = (pct) => {
  if (pct > 95) return '#ef4444';
  if (pct > 80) return '#f97316';
  if (pct > 60) return '#eab308';
  return '#22c55e';
};

const fmt = (v) => {
  if (!v) return '0';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toLocaleString();
};

const THRESHOLD_LEVELS = [50, 60, 70, 80, 90, 100];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--c-surface)', border: '1px solid var(--c-border)',
      borderRadius: 10, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontFamily: 'JetBrains Mono', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--c-text-muted)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function CapacityPlanningPage() {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCapacityThresholds()
      .then(setThresholds)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>Loading capacity data…</span>
      </div>
    );
  }

  const atRisk = thresholds.filter(t => t.utilization_pct > 80 && t.utilization_pct <= 100);
  const adequate = thresholds.filter(t => t.utilization_pct < 60);
  const critical = thresholds.filter(t => t.utilization_pct > 100);

  const chartData = thresholds.map(t => ({
    name: t.code,
    'Projected 2035': t.projected_2035 || 0,
    'Capacity 2035': t.capacity_2035 || 0,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4, fontFamily: 'Space Grotesk' }}>
          Capacity Planning
        </h1>
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>
          Terminal expansion threshold analysis for Andhra Pradesh airports
        </p>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Airports at Risk', sub: '>80% utilization', count: atRisk.length, color: '#f97316', icon: AlertTriangle },
          { label: 'Airports Adequate', sub: '<60% utilization', count: adequate.length, color: '#22c55e', icon: CheckCircle },
          { label: 'Critical', sub: '>100% utilization', count: critical.length, color: '#ef4444', icon: Gauge },
        ].map(k => (
          <div key={k.label} style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: 14, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${k.color}15`, border: `1px solid ${k.color}30`, flexShrink: 0,
            }}>
              <k.icon size={22} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: k.color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{k.count}</div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', marginTop: 2 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Airport Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {thresholds.map(t => {
          const pct = Math.min(t.utilization_pct || 0, 100);
          const barColor = getUtilColor(t.utilization_pct || 0);
          const needsExpansion = (t.utilization_pct || 0) > 80;

          return (
            <div key={t.id} style={{
              background: 'var(--c-surface)', border: '1px solid var(--c-border)',
              borderRadius: 16, padding: '1.25rem', transition: 'all 0.25s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))',
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Gauge size={18} color="#818cf8" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk', fontSize: '0.95rem' }}>{t.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#818cf8', marginTop: 1 }}>{t.code}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, fontFamily: 'JetBrains Mono',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '4px 10px', borderRadius: 8,
                  background: needsExpansion ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                  color: needsExpansion ? '#ef4444' : '#22c55e',
                  border: `1px solid ${needsExpansion ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
                }}>
                  {needsExpansion ? 'Needs Expansion' : 'Adequate'}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', color: 'var(--c-text-muted)', fontWeight: 600 }}>Utilization</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', fontWeight: 700, color: barColor }}>
                    {(t.utilization_pct || 0).toFixed(1)}%
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--c-surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 4,
                    background: barColor, transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>

              {/* Numbers */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, background: 'var(--c-surface-2)', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Projected</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#06b6d4', fontFamily: 'JetBrains Mono' }}>{fmt(t.projected_2035)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--c-text-muted)' }}>
                  <ArrowRight size={14} />
                </div>
                <div style={{ flex: 1, background: 'var(--c-surface-2)', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Capacity 2035</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#818cf8', fontFamily: 'JetBrains Mono' }}>{fmt(t.capacity_2035)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts BarChart */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
          Projected Passengers vs Capacity (2035)
        </h3>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: 11 }} axisLine={{ stroke: 'var(--c-border)' }} />
            <YAxis tick={{ fill: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: 11 }} axisLine={{ stroke: 'var(--c-border)' }} tickFormatter={fmt} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }} />
            <Bar dataKey="Projected 2035" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry['Projected 2035'] > entry['Capacity 2035'] ? '#ef4444' : '#06b6d4'} />
              ))}
            </Bar>
            <Bar dataKey="Capacity 2035" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline: Threshold years */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>
          Threshold Timeline
        </h3>
        {thresholds.map(t => (
          <div key={t.id} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk', fontSize: '0.85rem' }}>{t.name}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#818cf8' }}>{t.code}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(t.thresholds || []).map((th, i) => {
                const reached = (t.utilization_pct || 0) >= th.percentage;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 8,
                    background: reached ? `${getUtilColor(th.percentage)}18` : 'var(--c-surface-2)',
                    border: `1px solid ${reached ? getUtilColor(th.percentage) + '40' : 'var(--c-border)'}`,
                    transition: 'all 0.2s',
                  }}>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, fontFamily: 'JetBrains Mono',
                      color: reached ? getUtilColor(th.percentage) : 'var(--c-text-muted)',
                      textTransform: 'uppercase',
                    }}>
                      {th.percentage}%
                    </span>
                    <ArrowRight size={10} color={reached ? getUtilColor(th.percentage) : 'var(--c-text-muted)'} />
                    <span style={{
                      fontSize: '0.7rem', fontFamily: 'JetBrains Mono', fontWeight: 600,
                      color: reached ? 'var(--c-text)' : 'var(--c-text-muted)',
                    }}>
                      {fmt(th.target_passengers)}
                    </span>
                  </div>
                );
              })}
              {(!t.thresholds || t.thresholds.length === 0) && THRESHOLD_LEVELS.map(pct => (
                <div key={pct} style={{
                  padding: '5px 10px', borderRadius: 8,
                  background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--c-text-muted)', textTransform: 'uppercase' }}>{pct}%</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>—</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
