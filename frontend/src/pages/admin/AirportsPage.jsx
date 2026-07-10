import { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import ForecastChart from '../../components/ForecastChart';
import { Plane, ArrowLeft, RefreshCw, Edit2, Save, X, TrendingUp } from 'lucide-react';

export default function AirportsPage() {
  const [airports, setAirports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAirports().then(setAirports).catch(console.error).finally(() => setLoading(false));
  }, []);

  const selectAirport = async (airport) => {
    setSelected(airport);
    setEditData({ capacity_2035: airport.capacity_2035, status: airport.status });
    const data = await api.getForecasts(airport.id);
    setForecasts(data);
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      await api.updateAirport(selected.id, { ...selected, ...editData });
      setAirports(prev => prev.map(a => a.id === selected.id ? { ...a, ...editData } : a));
      setSelected({ ...selected, ...editData });
      setEditing(false);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const triggerReforecast = () => {
    alert('Re-forecast triggered! In production, this would call the forecasting engine.');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>Loading airports…</span>
      </div>
    );
  }

  if (selected) {
    const latest = forecasts[forecasts.length - 1];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Back header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setSelected(null)}
            style={{
              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--c-surface)', border: '1px solid var(--c-border)', cursor: 'pointer', color: 'var(--c-text-muted)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#818cf8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em' }}>{selected.name}</h1>
            <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem', fontFamily: 'JetBrains Mono' }}>
              {selected.code} &nbsp;·&nbsp; {selected.status}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="overview-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: '2035 Capacity', value: (selected.capacity_2035 || 0).toLocaleString(), color: '#6366f1' },
            { label: '2035 Passengers', value: latest ? ((latest.domestic_passengers + latest.international_passengers) / 1e6).toFixed(1) + 'M' : 'N/A', color: '#06b6d4' },
            { label: '2035 Cargo', value: latest ? (latest.cargo_mt / 1000).toFixed(1) + 'K MT' : 'N/A', color: '#f59e0b' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: k.color, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>{k.value}</div>
            </div>
          ))}
        </div>

        <ForecastChart data={forecasts} height={340} showConfidence />

        <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Assumptions */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Forecast Assumptions
              </h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {!editing ? (
                  <button onClick={() => setEditing(true)} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7,
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                    <Edit2 size={12} /> Edit
                  </button>
                ) : (
                  <>
                    <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      <Save size={12} /> Save
                    </button>
                    <button onClick={() => setEditing(false)} style={{ padding: '5px 10px', borderRadius: 7, background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  </>
                )}
                <button onClick={triggerReforecast} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                  <RefreshCw size={12} /> Re-forecast
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                {
                  label: 'Capacity (2035)',
                  display: editing ? (
                    <input type="number" value={editData.capacity_2035} onChange={e => setEditData({ ...editData, capacity_2035: parseInt(e.target.value) })}
                      className="form-input" style={{ width: 130, padding: '4px 10px', textAlign: 'right', fontSize: '0.8rem' }} />
                  ) : (
                    <span className="data-tag" style={{ color: 'var(--c-text)' }}>{(selected.capacity_2035 || 0).toLocaleString()}</span>
                  )
                },
                {
                  label: 'Status',
                  display: editing ? (
                    <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })} className="form-input" style={{ width: 160, padding: '4px 10px', fontSize: '0.8rem' }}>
                      <option value="active">Active</option>
                      <option value="planned">Planned</option>
                      <option value="under_construction">Under Construction</option>
                    </select>
                  ) : <StatusBadge status={selected.status} />
                },
                { label: 'Coordinates', display: <span className="data-tag" style={{ fontSize: '0.78rem', color: 'var(--c-text-muted)' }}>{selected.latitude}, {selected.longitude}</span> },
              ].map((row, i) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--c-border)' : 'none' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--c-text-2)' }}>{row.label}</span>
                  {row.display}
                </div>
              ))}
            </div>
          </div>

          {/* Year-by-year table */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
              Year-by-Year Forecast
            </h3>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Year', 'Domestic', 'Intl', 'Cargo MT'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Year' ? 'left' : 'right', fontSize: '0.65rem', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--c-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map(f => (
                    <tr key={f.year} style={{ borderBottom: '1px solid rgba(148,163,184,0.04)' }}>
                      <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.8rem', color: '#818cf8' }}>{f.year}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: 'var(--c-text-2)' }}>{(f.domestic_passengers / 1e6).toFixed(2)}M</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: 'var(--c-text-2)' }}>{(f.international_passengers / 1e6).toFixed(2)}M</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: 'var(--c-text-2)' }}>{(f.cargo_mt / 1000).toFixed(1)}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>Airports</h1>
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>Manage Andhra Pradesh airport forecasts and assumptions</p>
      </div>

      <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {airports.map(a => (
          <button
            key={a.id}
            onClick={() => selectAirport(a)}
            style={{
              background: 'var(--c-surface)', border: '1px solid var(--c-border)',
              borderRadius: 16, padding: '1.25rem', textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.875rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plane size={20} color="#818cf8" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#818cf8', marginTop: 2 }}>{a.code}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <StatusBadge status={a.status} />
              <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
                Cap: {a.capacity_2035?.toLocaleString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
