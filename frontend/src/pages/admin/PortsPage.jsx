import { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Ship, ArrowLeft } from 'lucide-react';

const fmt = (v) => {
  if (!v) return '0';
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
  return v.toLocaleString();
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'JetBrains Mono' }}>
      <p style={{ fontWeight: 700, color: 'var(--c-text)', marginBottom: 6, fontFamily: 'Space Grotesk', fontSize: '0.8rem' }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ fontSize: '0.75rem', color: e.color }}>{e.name}: {fmt(e.value)} MT</p>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', paddingBottom: 8, flexWrap: 'wrap' }}>
    {payload?.map((e, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 20, height: 3, background: e.color, borderRadius: 2 }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>{e.value}</span>
      </div>
    ))}
  </div>
);

export default function PortsPage() {
  const [ports, setPorts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [portForecasts, setPortForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPorts().then(setPorts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const selectPort = async (port) => {
    setSelected(port);
    const data = await api.getPortForecasts(port.id);
    setPortForecasts(data);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>Loading ports…</span>
      </div>
    );
  }

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-surface)', border: '1px solid var(--c-border)', cursor: 'pointer', color: 'var(--c-text-muted)' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em' }}>{selected.name}</h1>
            <p style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>
              {selected.code} &nbsp;·&nbsp; Capacity: {(selected.cargo_capacity_mt / 1e6).toFixed(0)}M MT
            </p>
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem 1rem 0.75rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
            Cargo Forecast by Mode (MT)
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={portForecasts} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gRoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gRail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gSea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.06)" strokeDasharray="4 4" />
              <XAxis dataKey="year" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Area type="monotone" dataKey="road_cargo_mt" name="Road" stroke="#6366f1" fill="url(#gRoad)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="rail_cargo_mt" name="Rail" stroke="#f59e0b" fill="url(#gRail)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="sea_cargo_mt" name="Sea" stroke="#10b981" fill="url(#gSea)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {['Year', 'Road (MT)', 'Rail (MT)', 'Sea (MT)', 'Total (MT)', 'Confidence'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Year' ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portForecasts.map(f => (
                <tr key={f.year}>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>{f.year}</td>
                  <td style={{ textAlign: 'right' }} className="data-tag">{fmt(f.road_cargo_mt)}</td>
                  <td style={{ textAlign: 'right' }} className="data-tag">{fmt(f.rail_cargo_mt)}</td>
                  <td style={{ textAlign: 'right' }} className="data-tag">{fmt(f.sea_cargo_mt)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }} className="data-tag">{fmt(f.total_cargo_mt)}</td>
                  <td style={{ textAlign: 'right', color: '#34d399' }} className="data-tag">{f.confidence_low}–{f.confidence_high}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>Ports & Freight</h1>
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>Manage port cargo forecasts by transport mode</p>
      </div>
      <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {ports.map(p => (
          <button
            key={p.id}
            onClick={() => selectPort(p)}
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.875rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ship size={20} color="#22d3ee" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>{p.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#22d3ee' }}>{p.code}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <StatusBadge status={p.status} />
              <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
                {(p.cargo_capacity_mt / 1e6).toFixed(0)}M MT capacity
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
