import { useId } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const fmt = (v) => {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
  return v;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      fontFamily: 'JetBrains Mono', minWidth: 160,
    }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: 6, fontFamily: 'Space Grotesk' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: '0.75rem', color: entry.color, marginBottom: 2 }}>
          {entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', padding: '0 12px 8px', flexWrap: 'wrap' }}>
    {payload?.map((entry, i) => {
      const isCI = entry.value?.includes('Confidence');
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isCI ? (
            <div style={{ width: 18, height: 10, borderRadius: 2, background: entry.color, opacity: 0.3 }} />
          ) : (
            <div style={{ width: 24, height: 3, borderRadius: 2, background: entry.color }} />
          )}
          <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>{entry.value}</span>
        </div>
      );
    })}
  </div>
);

export default function ForecastChart({ data, height = 350, showConfidence = false }) {
  const uid = useId();
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderRadius: 16, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--c-text-muted)', fontSize: '0.875rem', fontFamily: 'JetBrains Mono',
      }}>
        No forecast data available
      </div>
    );
  }

  const axisStyle = { fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#64748b' };
  const gridStyle = { stroke: 'rgba(148,163,184,0.06)', strokeDasharray: '4 4' };

  const hasCI = data[0]?.confidence_low !== undefined && data[0]?.confidence_high !== undefined;

  const normalizedData = data.map(d => ({
    ...d,
    domestic_passengers: d.domestic_passengers ?? d.total_domestic ?? 0,
    international_passengers: d.international_passengers ?? d.total_international ?? 0,
  }));

  const chartData = hasCI ? normalizedData.map(d => {
    const total = (d.domestic_passengers || 0) + (d.international_passengers || 0);
    const low = d.confidence_low || 90;
    const high = d.confidence_high || 95;
    return {
      ...d,
      ci_low: Math.round(total * (low / 100)),
      ci_high: Math.round(total * (high / 100)),
    };
  }) : normalizedData;

  return (
    <div style={{
      background: 'var(--c-surface)', border: '1px solid var(--c-border)',
      borderRadius: 16, padding: '1.25rem 1rem 0.75rem',
    }}>
      <ResponsiveContainer width="100%" height={height}>
        {showConfidence ? (
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`${uid}-gradCI`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`${uid}-gradDomestic`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`${uid}-gradIntl`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="year" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={axisStyle} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {hasCI && (
              <>
                <Area type="monotone" dataKey="ci_high" name="Confidence High" stroke="none" fill={`url(#${uid}-gradCI)`} strokeWidth={0} dot={false} />
                <Area type="monotone" dataKey="ci_low" name="Confidence Low" stroke="none" fill="#0f172a" strokeWidth={0} dot={false} />
              </>
            )}
            <Area type="monotone" dataKey="domestic_passengers" name="Domestic" stroke="#6366f1" fill={`url(#${uid}-gradDomestic)`} strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5, fill: '#6366f1' }} />
            <Area type="monotone" dataKey="international_passengers" name="International" stroke="#06b6d4" fill={`url(#${uid}-gradIntl)`} strokeWidth={2.5} dot={{ r: 3, fill: '#06b6d4' }} activeDot={{ r: 5, fill: '#06b6d4' }} />
          </AreaChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`${uid}-gradDomestic2`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`${uid}-gradIntl2`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="year" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={axisStyle} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Area type="monotone" dataKey="total_domestic" name="Domestic" stroke="#6366f1" fill={`url(#${uid}-gradDomestic2)`} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
            <Area type="monotone" dataKey="total_international" name="International" stroke="#f59e0b" fill={`url(#${uid}-gradIntl2)`} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
