import { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import {
  AlertTriangle, CheckCircle, Building2, Anchor, ArrowUpRight, BarChart3
} from 'lucide-react';

const severityColor = (sev) => {
  const s = (sev || '').toLowerCase();
  if (s === 'critical') return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', text: '#f87171', dot: '#ef4444' };
  if (s === 'warning') return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24', dot: '#f59e0b' };
  return { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#34d399', dot: '#10b981' };
};

const SeverityBadge = ({ severity }) => {
  const c = severityColor(severity);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 6,
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: '0.7rem', fontWeight: 600, fontFamily: 'JetBrains Mono',
      color: c.text, textTransform: 'capitalize',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
      {severity || 'N/A'}
    </span>
  );
};

const fmt = (v) => {
  if (v == null) return 'N/A';
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toLocaleString();
};

const tableHeaderStyle = {
  padding: '8px 12px',
  textAlign: 'right',
  fontSize: '0.65rem',
  fontFamily: 'JetBrains Mono',
  fontWeight: 600,
  color: 'var(--c-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderBottom: '1px solid var(--c-border)',
  whiteSpace: 'nowrap',
};

const tableCellStyle = {
  padding: '10px 12px',
  textAlign: 'right',
  fontSize: '0.78rem',
  fontFamily: 'JetBrains Mono',
  color: 'var(--c-text-2)',
  whiteSpace: 'nowrap',
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--c-surface-2, #1e293b)',
      border: '1px solid var(--c-border)',
      borderRadius: 10, padding: '10px 14px',
      fontFamily: 'JetBrains Mono',
    }}>
      <p style={{ fontWeight: 700, color: 'var(--c-text)', marginBottom: 6, fontFamily: 'Space Grotesk', fontSize: '0.8rem' }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ fontSize: '0.75rem', color: e.fill || e.color }}>
          {e.name}: {fmt(e.value)}
        </p>
      ))}
    </div>
  );
};

export default function InfrastructureGapPage() {
  const [data, setData] = useState({ airports: [], ports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getInfrastructureGaps()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>
          Loading infrastructure gap data…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#f87171' }}>
        <AlertTriangle size={20} />
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>Failed to load: {error}</span>
      </div>
    );
  }

  const { airports = [], ports = [] } = data;

  const totalAirports = airports.length;
  const needsExpansion = airports.filter(a => a.needs_expansion).length;
  const criticalGaps = airports.filter(a => (a.gap_severity || '').toLowerCase() === 'critical').length;
  const adequateAirports = totalAirports - needsExpansion;

  const chartData = airports
    .filter(a => a.projected_passengers_2035 != null)
    .map(a => ({
      name: a.code,
      projected: a.projected_passengers_2035,
      capacity: a.capacity_2035,
    }));

  const recommendations = [];
  airports.filter(a => (a.gap_severity || '').toLowerCase() === 'critical').forEach(a => {
    recommendations.push({
      severity: 'critical',
      icon: AlertTriangle,
      text: `${a.name} (${a.code}): Terminal expansion critical — projected ${(a.projected_passengers_2035 / a.capacity_2035 * 100).toFixed(0)}% utilization by 2035. Immediate capacity investment required.`,
    });
  });
  airports.filter(a => (a.gap_severity || '').toLowerCase() === 'warning').forEach(a => {
    recommendations.push({
      severity: 'warning',
      icon: AlertTriangle,
      text: `${a.name} (${a.code}): Approaching capacity limits — ${a.capacity_utilization?.toFixed(0)}% utilization. Plan phased expansion.`,
    });
  });
  ports.filter(p => p.needs_expansion).forEach(p => {
    recommendations.push({
      severity: (p.gap_severity || '').toLowerCase() === 'critical' ? 'critical' : 'warning',
      icon: Anchor,
      text: `${p.name} (${p.code}): Port capacity expansion needed to meet 2035 cargo projections of ${fmt(p.projected_cargo_2035)} MT.`,
    });
  });
  if (recommendations.length === 0) {
    recommendations.push({
      severity: 'adequate',
      icon: CheckCircle,
      text: 'All infrastructure meets projected 2035 demand. Continue monitoring.',
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <BarChart3 size={22} color="#818cf8" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em' }}>
            Infrastructure Gap Analysis
          </h1>
        </div>
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>
          Capacity vs. projected demand for AP airports &amp; ports through 2035
        </p>
      </div>

      {/* Airport KPIs */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
          <Building2 size={16} color="#818cf8" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk', letterSpacing: '-0.01em' }}>
            Airports Overview
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Total Airports', value: totalAirports, color: '#6366f1', soft: 'rgba(99,102,241,0.1)' },
            { label: 'Needs Expansion', value: needsExpansion, color: '#f59e0b', soft: 'rgba(245,158,11,0.1)' },
            { label: 'Critical Gaps', value: criticalGaps, color: '#ef4444', soft: 'rgba(239,68,68,0.1)' },
            { label: 'Adequate', value: adequateAirports, color: '#10b981', soft: 'rgba(16,185,129,0.1)' },
          ].map(k => (
            <div key={k.label} style={{
              background: 'var(--c-surface)', border: '1px solid var(--c-border)',
              borderRadius: 14, padding: '1.125rem 1.25rem', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20, width: 90, height: 90,
                borderRadius: '50%', background: k.color + '18', pointerEvents: 'none',
              }} />
              <div style={{
                fontSize: '0.65rem', fontFamily: 'JetBrains Mono', fontWeight: 600,
                color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
              }}>
                {k.label}
              </div>
              <div style={{
                fontSize: '1.75rem', fontWeight: 800, color: k.color,
                fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Airports Table */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem', overflow: 'hidden' }}>
        <h3 style={{
          fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-muted)',
          fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem',
        }}>
          Airport Capacity Gap Details
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Airport', 'Code', 'Status', 'Projected 2035', 'Capacity 2035', 'Utilization %', 'Gap Severity', 'Action Needed'].map(h => (
                  <th key={h} style={{ ...tableHeaderStyle, textAlign: h === 'Airport' ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {airports.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.04)' }}>
                  <td style={{ ...tableCellStyle, textAlign: 'left', fontWeight: 600, color: 'var(--c-text)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={14} color="#818cf8" style={{ flexShrink: 0 }} />
                      {a.name}
                    </div>
                  </td>
                  <td style={{ ...tableCellStyle, color: '#818cf8', fontWeight: 700 }}>{a.code}</td>
                  <td style={{ ...tableCellStyle, textTransform: 'capitalize' }}>{a.status}</td>
                  <td style={tableCellStyle}>{fmt(a.projected_passengers_2035)}</td>
                  <td style={tableCellStyle}>{fmt(a.capacity_2035)}</td>
                  <td style={{ ...tableCellStyle, fontWeight: 700 }}>
                    {a.capacity_utilization != null ? `${a.capacity_utilization.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                    <SeverityBadge severity={a.gap_severity} />
                  </td>
                  <td style={{
                    ...tableCellStyle, textAlign: 'right',
                    color: a.needs_expansion ? '#fbbf24' : '#34d399',
                    fontWeight: 600, fontSize: '0.72rem',
                  }}>
                    {a.needs_expansion ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ArrowUpRight size={12} /> Terminal expansion needed
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={12} /> Adequate capacity
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {airports.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...tableCellStyle, textAlign: 'center', padding: '2rem', color: 'var(--c-text-muted)' }}>
                    No airport data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem' }}>
          <h3 style={{
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-muted)',
            fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem',
          }}>
            Projected Passengers vs Capacity (2035)
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 52)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.06)" strokeDasharray="4 4" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={fmt}
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#64748b' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#818cf8', fontWeight: 700 }}
                axisLine={false} tickLine={false} width={60}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--c-text-muted)' }}
              />
              <Bar dataKey="projected" name="Projected" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.projected > entry.capacity ? '#ef4444' : '#6366f1'} />
                ))}
              </Bar>
              <Bar dataKey="capacity" name="Capacity" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={14} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ports Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem', marginTop: '0.5rem' }}>
          <Anchor size={16} color="#22d3ee" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk', letterSpacing: '-0.01em' }}>
            Ports Overview
          </h2>
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Port', 'Code', 'Status', 'Projected 2035 Cargo', 'Capacity', 'Utilization %', 'Gap Severity'].map(h => (
                    <th key={h} style={{ ...tableHeaderStyle, textAlign: h === 'Port' ? 'left' : 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ports.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.04)' }}>
                    <td style={{ ...tableCellStyle, textAlign: 'left', fontWeight: 600, color: 'var(--c-text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Anchor size={14} color="#22d3ee" style={{ flexShrink: 0 }} />
                        {p.name}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, color: '#22d3ee', fontWeight: 700 }}>{p.code}</td>
                    <td style={{ ...tableCellStyle, textTransform: 'capitalize' }}>{p.status}</td>
                    <td style={tableCellStyle}>{fmt(p.projected_cargo_2035)} MT</td>
                    <td style={tableCellStyle}>{fmt(p.cargo_capacity_mt)} MT</td>
                    <td style={{ ...tableCellStyle, fontWeight: 700 }}>
                      {p.capacity_utilization != null ? `${p.capacity_utilization.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                      <SeverityBadge severity={p.gap_severity} />
                    </td>
                  </tr>
                ))}
                {ports.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center', padding: '2rem', color: 'var(--c-text-muted)' }}>
                      No port data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem' }}>
        <h3 style={{
          fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-muted)',
          fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem',
        }}>
          Recommendations
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recommendations.map((rec, i) => {
            const c = severityColor(rec.severity);
            const Icon = rec.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '0.875rem 1rem', borderRadius: 12,
                background: c.bg, border: `1px solid ${c.border}`,
              }}>
                <Icon size={16} color={c.text} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--c-text-2)', lineHeight: 1.55, margin: 0 }}>
                  {rec.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
