import { useState, useEffect } from 'react';
import { api } from '../../api';
import KPICard from '../../components/KPICard';
import ForecastChart from '../../components/ForecastChart';
import StatusBadge from '../../components/StatusBadge';
import FlightModeModal from '../../components/FlightModeModal';
import { Users, Package, Plane, AlertTriangle, Activity, RefreshCw, Calendar, Clock, Wind, TrendingUp, X, MapPin, Gauge } from 'lucide-react';

const fmt = (v) => {
  if (!v) return '0';
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
  return v.toLocaleString();
};

const systemHealth = [
  { label: 'API Gateway', status: 'Connected' },
  { label: 'Database', status: 'Connected' },
  { label: 'DGCA Data Feed', status: 'Connected' },
  { label: 'FASTag Integration', status: 'Pending' },
  { label: 'E-Way Bill API', status: 'Pending' },
];

function DetailModal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fm-fadein 0.3s ease', padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520,
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)',
        animation: 'motion-spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: '1px solid var(--c-border)',
          background: 'var(--c-surface-2)', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(148,163,184,0.1)', border: '1px solid var(--c-border)',
            color: 'var(--c-text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '1.25rem' }}>{children}</div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [overview, setOverview] = useState(null);
  const [airportsTable, setAirportsTable] = useState([]);
  const [liveFlights, setLiveFlights] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [selectedAqRecord, setSelectedAqRecord] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const load = () => {
      api.getOverview().then(setOverview).catch(console.error);
      api.getOverviewAirportsTable().then(setAirportsTable).catch(console.error);
      api.getLiveFlights().then(f => {
        if (f && f.data) setLiveFlights(f.data);
      }).catch(console.error);
      api.getAirQuality({ limit: 100 }).then(setAirQuality).catch(console.error);
      api.getOverviewTrend().then(td => {
        if (td) setTrendData(td);
      }).catch(console.error);
      setLastUpdated(new Date());
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Dashboard Overview
          </h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>
            System-wide demand forecasting summary for Andhra Pradesh
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', background: 'var(--c-surface)',
          border: '1px solid var(--c-border)', borderRadius: 8,
          fontSize: '0.75rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono',
        }}>
          <RefreshCw size={12} />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()} • Auto-refresh 30s` : 'Loading…'}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="overview-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KPICard
          title="Active Live Flights"
          value={liveFlights.length}
          subtitle="Currently tracked in airspace"
          icon={Activity}
          color="cyan"
        />
        <KPICard
          title="Unique Airlines"
          value={new Set(liveFlights.map(f => f.airline?.name).filter(Boolean)).size}
          subtitle="Operating right now"
          icon={Users}
          color="navy"
        />
        <KPICard
          title="Avg Cruise Altitude"
          value={(() => {
            const withAlt = liveFlights.filter(f => f.live?.altitude && f.live.altitude > 0 && !f.live?.is_ground);
            if (withAlt.length === 0) return '—';
            const avgMeters = withAlt.reduce((acc, f) => acc + f.live.altitude, 0) / withAlt.length;
            return Math.round(avgMeters * 3.28084).toLocaleString() + ' ft';
          })()}
          subtitle="Real-time ADS-B telemetry"
          icon={Plane}
          color="amber"
        />
        <KPICard
          title="Airports Tracked"
          value={overview?.total_airports || 0}
          subtitle={`${overview?.total_ports || 0} ports monitored`}
          icon={AlertTriangle}
          color="green"
        />
      </div>

      {/* Charts row */}
      <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
            <Activity size={16} color="var(--c-text-muted)" />
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--c-text)' }}>Live Aviation Feed</h2>
          </div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, height: 300, overflow: 'auto' }}>
            {liveFlights.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--c-surface-2)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--c-text-muted)', fontWeight: 600 }}>Flight</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--c-text-muted)', fontWeight: 600 }}>Departure</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--c-text-muted)', fontWeight: 600 }}>Arrival</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--c-text-muted)', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveFlights.slice(0, 50).map((f, i) => (
                    <tr key={i} onClick={() => setSelectedFlight(f)} style={{ borderBottom: '1px solid var(--c-border)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#818cf8', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>{f.flight?.iata || f.flight?.icao || '---'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--c-text)' }}>
                        {f.departure?.iata ? <span style={{ fontWeight: 700, color: '#818cf8', marginRight: 4 }}>{f.departure.iata}</span> : null}
                        {f.departure?.airport || 'AP Region'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--c-text)' }}>
                        {f.arrival?.iata ? <span style={{ fontWeight: 700, color: '#34d399', marginRight: 4 }}>{f.arrival.iata}</span> : null}
                        {f.arrival?.airport || (f.live?.latitude ? 'In Transit' : 'En Route')}
                      </td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge status={f.flight_status === 'active' ? 'Active' : 'Pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>No live flight data available</div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 2s infinite' }} />
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--c-text)' }}>System Health</h2>
          </div>
          <div style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: 16, padding: '1.25rem', height: '100%',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {systemHealth.map(h => (
                <div key={h.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--c-text-2)' }}>{h.label}</span>
                  <StatusBadge status={h.status} />
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--c-border)', marginTop: '1rem', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
                Last check: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Airport table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)' }}>Airport Performance Summary</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>{airportsTable.length} airports</span>
        </div>
        <div className="table-container table-scroll" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>Airport</th>
                <th>Code</th>
                <th>Status</th>
                <th>2035 Capacity</th>
                <th>Accuracy</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {airportsTable.map(a => (
                <tr key={a.id} onClick={() => setSelectedAirport(a)} style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ fontWeight: 600, color: 'var(--c-text)' }}>{a.name}</td>
                  <td>
                    <span style={{
                      fontFamily: 'JetBrains Mono', fontSize: '0.8rem', fontWeight: 600,
                      background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                      border: '1px solid rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: 6,
                    }}>{a.code}</span>
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="data-tag">{fmt(a.capacity_2035)}</td>
                  <td>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
                      {a.hindcast_accuracy}%
                    </span>
                  </td>
                  <td style={{ color: 'var(--c-text-muted)', fontSize: '0.8rem' }}>
                    {a.last_updated ? new Date(a.last_updated).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demand Trend Chart */}
      {trendData.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
            <TrendingUp size={16} color="#818cf8" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)' }}>Passenger Demand Trend (2026-2035)</h2>
          </div>
          <ForecastChart data={trendData} showConfidence height={280} />
        </div>
      )}

      {/* Air Quality Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wind size={16} color="#f59e0b" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)' }}>Air Quality Index (Data.gov.in)</h2>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
            {airQuality?.total || airQuality?.records?.length || 0} total records
          </span>
        </div>
        {airQuality?.records && airQuality.records.length > 0 ? (
          <div className="table-container table-scroll" style={{ maxHeight: 350, overflow: 'auto', overflowX: 'auto' }}>
            <table style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>State</th>
                  <th>City</th>
                  <th>Station</th>
                  <th>Pollutant</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Avg</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {airQuality.records.slice(0, 30).map((r, i) => (
                  <tr key={i} onClick={() => setSelectedAqRecord(r)} style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ fontSize: '0.8rem' }}>{r.state}</td>
                    <td style={{ fontWeight: 600, color: 'var(--c-text)' }}>{r.city}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.station}>{r.station}</td>
                    <td>
                      <span style={{
                        fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 600,
                        background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                        border: '1px solid rgba(245,158,11,0.2)', padding: '2px 6px', borderRadius: 6,
                      }}>{r.pollutant_id}</span>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{r.min_value}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{r.max_value}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>{r.avg_value}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{r.last_update}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : airQuality === null ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-text-muted)', background: 'var(--c-surface)', borderRadius: 16, border: '1px solid var(--c-border)' }}>
            <Wind size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>Loading air quality data…</p>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-text-muted)', background: 'var(--c-surface)', borderRadius: 16, border: '1px solid var(--c-border)' }}>
            <Wind size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>No air quality data available from Data.gov.in</p>
            {airQuality?.message && <p style={{ fontSize: '0.7rem', marginTop: 4, color: '#f87171' }}>{airQuality.message}</p>}
          </div>
        )}
      </div>

      {selectedFlight && <FlightModeModal flight={selectedFlight} onClose={() => setSelectedFlight(null)} />}

      {/* Airport Detail Modal */}
      {selectedAirport && (
        <DetailModal title={`${selectedAirport.name} (${selectedAirport.code})`} onClose={() => setSelectedAirport(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusBadge status={selectedAirport.status} />
              <span style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
                Code: {selectedAirport.code}
              </span>
            </div>

            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: '2035 Capacity', value: fmt(selectedAirport.capacity_2035), color: '#818cf8', icon: Package },
                { label: 'Forecast Accuracy', value: `${selectedAirport.hindcast_accuracy}%`, color: '#34d399', icon: Gauge },
                { label: 'Projected Passengers', value: fmt(selectedAirport.passengers_2035), color: '#22d3ee', icon: Users },
                { label: 'Projected Cargo', value: `${fmt(selectedAirport.cargo_2035)} MT`, color: '#f59e0b', icon: Package },
              ].map((item, idx) => (
                <div key={item.label} style={{
                  background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
                  borderRadius: 10, padding: '0.875rem', textAlign: 'center',
                  animation: `motion-stagger 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.15 + idx * 0.07}s both`,
                }}>
                  <item.icon size={16} color={item.color} style={{ marginBottom: 4 }} />
                  <div style={{ fontSize: '0.6rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: item.color, fontFamily: 'Space Grotesk' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Utilization bar */}
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 6 }}>Capacity Utilization</div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--c-surface-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${Math.min(((selectedAirport.passengers_2035 || 0) / (selectedAirport.capacity_2035 || 1)) * 100, 100)}%`,
                  background: ((selectedAirport.passengers_2035 || 0) / (selectedAirport.capacity_2035 || 1)) > 0.8
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', marginTop: 4 }}>
                {Math.round(((selectedAirport.passengers_2035 || 0) / (selectedAirport.capacity_2035 || 1)) * 100)}% of capacity
              </div>
            </div>

            {/* Last updated */}
            <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', borderTop: '1px solid var(--c-border)', paddingTop: '0.75rem' }}>
              Last forecast update: {selectedAirport.last_updated ? new Date(selectedAirport.last_updated).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </DetailModal>
      )}

      {/* Air Quality Detail Modal */}
      {selectedAqRecord && (
        <DetailModal title={`${selectedAqRecord.city} - Air Quality`} onClose={() => setSelectedAqRecord(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Station info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wind size={18} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>{selectedAqRecord.city}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)' }}>{selectedAqRecord.state}</div>
              </div>
            </div>

            {/* Station details */}
            <div style={{ background: 'var(--c-surface-2)', borderRadius: 10, padding: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <MapPin size={12} color="var(--c-text-muted)" />
                <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Station</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--c-text)', fontWeight: 600 }}>{selectedAqRecord.station}</div>
            </div>

            {/* Pollutant badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'JetBrains Mono', fontSize: '0.75rem', fontWeight: 600,
                background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.2)', padding: '4px 12px', borderRadius: 8,
              }}>{selectedAqRecord.pollutant_id}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>Pollutant ID</span>
            </div>

            {/* Values grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Min Value', value: selectedAqRecord.min_value, color: '#34d399' },
                { label: 'Max Value', value: selectedAqRecord.max_value, color: '#ef4444' },
                { label: 'Avg Value', value: selectedAqRecord.avg_value, color: '#f59e0b' },
              ].map((item, idx) => (
                <div key={item.label} style={{
                  background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
                  borderRadius: 10, padding: '0.875rem', textAlign: 'center',
                  animation: `motion-stagger 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.15 + idx * 0.08}s both`,
                }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.color, fontFamily: 'Space Grotesk' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Visual bar */}
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>Value Range</div>
              <div style={{ height: 10, borderRadius: 5, background: 'var(--c-surface-2)', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: `${(parseFloat(selectedAqRecord.min_value) / parseFloat(selectedAqRecord.max_value)) * 100}%`,
                  width: `${((parseFloat(selectedAqRecord.avg_value) - parseFloat(selectedAqRecord.min_value)) / parseFloat(selectedAqRecord.max_value)) * 100}%`,
                  height: '100%', borderRadius: 5,
                  background: 'linear-gradient(90deg, #34d399, #f59e0b, #ef4444)',
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', marginTop: 3 }}>
                <span>{selectedAqRecord.min_value}</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>avg: {selectedAqRecord.avg_value}</span>
                <span>{selectedAqRecord.max_value}</span>
              </div>
            </div>

            {/* Updated */}
            <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', borderTop: '1px solid var(--c-border)', paddingTop: '0.75rem' }}>
              Last update: {selectedAqRecord.last_update}
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
