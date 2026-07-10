import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import KPICard from '../../components/KPICard';
import ForecastChart from '../../components/ForecastChart';
import RouteCard from '../../components/RouteCard';
import StatusBadge from '../../components/StatusBadge';
import Footer from '../../components/Footer';
import FlightModeModal from '../../components/FlightModeModal';
import { Users, Package, Plane, Calendar, ExternalLink, Download, ArrowLeft, Wind, MapPin, X, Gauge, Clock } from 'lucide-react';

const fmt = (v) => {
  if (!v) return '0';
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
  return v.toLocaleString();
};

export default function PublicDashboard() {
  const [airports, setAirports] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [liveFlights, setLiveFlights] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [aqSearch, setAqSearch] = useState('');
  const [aqStateFilter, setAqStateFilter] = useState('');
  const [flightsLoading, setFlightsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedAqRecord, setSelectedAqRecord] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const LOCATIONS = [
    { label: 'All Locations', value: '' },
    { label: 'Visakhapatnam (VTZ)', value: 'VTZ' },
    { label: 'Vijayawada (VGA)', value: 'VGA' },
    { label: 'Tirupati (TIR)', value: 'TIR' },
    { label: 'Rajahmundry (RJA)', value: 'RJA' },
    { label: 'Kadapa (CDP)', value: 'CDP' },
    { label: 'Kurnool (KJB)', value: 'KJB' }
  ];

  useEffect(() => {
    const loadStatic = () => {
      api.getAirports().then(setAirports).catch(() => {});
      api.getDatasets().then(setDatasets).catch(() => {});
      api.getAirQuality({ limit: 200 }).then(setAirQuality).catch(() => {});
    };
    loadStatic();
    const interval = setInterval(loadStatic, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = () => {
      setFlightsLoading(true);
      api.getLiveFlights(locationFilter)
        .then(f => {
          if (f && f.data) setLiveFlights(f.data);
          else setLiveFlights([]);
          setLastUpdated(new Date());
        })
        .catch(console.error)
        .finally(() => setFlightsLoading(false));
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [locationFilter]);

  const exportJSON = async () => {
    try {
      const blob = new Blob([JSON.stringify({ airports, datasets, liveFlights }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AP_Transport_Live.json';
      a.click();
    } catch (err) { alert('Export failed'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <header style={{
        background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--c-border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="header-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'color 0.2s', fontSize: '0.8rem', whiteSpace: 'nowrap' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-muted)'}>
              <ArrowLeft size={14} /> Back
            </Link>
            <div style={{ width: 1, height: 24, background: 'var(--c-border)', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 15px rgba(99,102,241,0.3)',
              }}>
                <Plane size={16} color="white" />
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--c-text)', fontFamily: 'Space Grotesk', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>AP Transport Intelligence</h1>
                <p style={{ fontSize: '0.65rem', color: '#818cf8', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Public Dashboard</p>
              </div>
            </div>
          </div>
          <Link to="/login" style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'color 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-muted)'}>
            Admin Login →
          </Link>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content" style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '2.5rem 2rem' }}>
        {/* KPI Cards (Live Data) */}
        <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          <KPICard title="Total Active Flights" value={liveFlights.length.toLocaleString()} subtitle="Across monitored airspace" icon={Plane} color="cyan" />
          <KPICard title="Unique Airlines" value={new Set(liveFlights.map(f => f.airline?.name).filter(Boolean)).size} subtitle="Operating currently" icon={Users} color="navy" />
          <KPICard title="Avg Altitude" value={(() => {
            const withAlt = liveFlights.filter(f => f.live?.altitude && f.live.altitude > 0 && !f.live?.is_ground);
            if (withAlt.length === 0) return '—';
            const avgMeters = withAlt.reduce((acc, f) => acc + f.live.altitude, 0) / withAlt.length;
            return Math.round(avgMeters * 3.28084).toLocaleString() + ' ft';
          })()} subtitle="Real-time ADS-B cruise altitude" icon={Plane} color="amber" />
          <KPICard title="Tracked Facilities" value={airports.length} subtitle="Airports & heliports" icon={Calendar} color="green" />
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'var(--c-surface)', padding: '1rem', borderRadius: 12, border: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: 'pulse-glow 2s infinite', flexShrink: 0 }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>Live Flights</h2>
            {lastUpdated && (
              <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', background: 'var(--c-surface-2)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--c-border)' }}>
                Updated {lastUpdated.toLocaleTimeString()} • Refreshes every 30s
              </span>
            )}
          </div>
          
          <div className="filter-bar-inner" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              style={{
                background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text)',
                padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', outline: 'none', cursor: 'pointer'
              }}
            >
              {LOCATIONS.map(loc => (
                <option key={loc.value} value={loc.value}>{loc.label}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Search flight, airline..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text)',
                padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', width: 200, outline: 'none', minWidth: 0, flex: 1
              }}
            />
          </div>
        </div>

        {/* Live Flights Table */}
        <div style={{ marginBottom: '2.5rem' }}>
          {liveFlights.length > 0 ? (() => {
            const filtered = liveFlights.filter(f => {
              const matchS = (f.flight?.iata || '').toLowerCase().includes(search.toLowerCase()) || 
                             (f.airline?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                             (f.departure?.airport || '').toLowerCase().includes(search.toLowerCase()) ||
                             (f.arrival?.airport || '').toLowerCase().includes(search.toLowerCase());
              const matchL = locationFilter === '' || f.departure?.iata === locationFilter || f.arrival?.iata === locationFilter || 
                             f.departure?.airport?.includes(locationFilter) || f.arrival?.airport?.includes(locationFilter);
              return matchS && matchL;
            });
            return (
              <div className="table-container table-scroll" style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--c-border)', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--c-surface)' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Flight</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Airline</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Departure</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Arrival</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Location</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--c-text-muted)' }}>
                        No flights match your filters.
                      </td>
                    </tr>
                  ) : filtered.map((f, i) => (
                    <tr key={i} onClick={() => setSelectedFlight(f)} style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px', fontWeight: 600, color: '#818cf8', fontFamily: 'JetBrains Mono', borderBottom: '1px solid var(--c-border-light)' }}>{f.flight?.iata || f.flight?.icao || '---'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--c-border-light)', color: 'var(--c-text)' }}>{f.airline?.name || 'Unknown'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--c-border-light)', color: 'var(--c-text)' }}>
                        {f.departure?.iata ? <span style={{ fontWeight: 700, color: '#818cf8', marginRight: 6 }}>{f.departure.iata}</span> : null}
                        {f.departure?.airport || 'AP Region'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--c-border-light)', color: 'var(--c-text)' }}>
                        {f.arrival?.iata ? <span style={{ fontWeight: 700, color: '#34d399', marginRight: 6 }}>{f.arrival.iata}</span> : null}
                        {f.arrival?.airport || (f.live?.latitude ? 'In Transit' : 'En Route')}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--c-text-muted)', borderBottom: '1px solid var(--c-border-light)' }}>
                        {f.live?.latitude && f.live?.longitude ? 
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                            {f.live.latitude.toFixed(2)}, {f.live.longitude.toFixed(2)}
                          </span> : 
                          (f.departure?.gate || f.departure?.terminal ? 
                            `T-${f.departure?.terminal || '?'} / Gate ${f.departure?.gate || '?'}` : 
                            'En Route')}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--c-border-light)' }}><StatusBadge status={f.flight_status === 'active' ? 'Active' : 'Pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            );
          })() : (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--c-surface)', borderRadius: 16, border: '1px solid var(--c-border)', color: 'var(--c-text-muted)' }}>
              No live flights found at this moment.
            </div>
          )}
        </div>

        {/* Air Quality Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'var(--c-surface)', padding: '1rem', borderRadius: 12, border: '1px solid var(--c-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse-glow 2s infinite', flexShrink: 0 }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>Air Quality Index (India)</h2>
            </div>
            <div className="filter-bar-inner" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {airQuality?.states && (
                <select
                  value={aqStateFilter}
                  onChange={e => setAqStateFilter(e.target.value)}
                  style={{
                    background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text)',
                    padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="">All States</option>
                  {airQuality.states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <input
                type="text"
                placeholder="Search city, station..."
                value={aqSearch}
                onChange={e => setAqSearch(e.target.value)}
                style={{
                  background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text)',
                  padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', width: 200, outline: 'none'
                }}
              />
            </div>
          </div>

          {airQuality?.records ? (() => {
            const filtered = airQuality.records.filter(r => {
              const matchSearch = !aqSearch ||
                (r.city || '').toLowerCase().includes(aqSearch.toLowerCase()) ||
                (r.station || '').toLowerCase().includes(aqSearch.toLowerCase()) ||
                (r.state || '').toLowerCase().includes(aqSearch.toLowerCase());
              const matchState = !aqStateFilter || r.state === aqStateFilter;
              return matchSearch && matchState;
            });
            return (
              <div className="table-container table-scroll" style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--c-border)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--c-surface)' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>State</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>City</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Station</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Pollutant</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Min</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Max</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Avg</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--c-text-muted)' }}>
                          No air quality data matches your filters.
                        </td>
                      </tr>
                    ) : filtered.slice(0, 50).map((r, i) => (
                      <tr key={i} onClick={() => setSelectedAqRecord(r)} style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--c-border-light)' }}>{r.state}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--c-text)', borderBottom: '1px solid var(--c-border-light)' }}>{r.city}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--c-text-muted)', borderBottom: '1px solid var(--c-border-light)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.station}>{r.station}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--c-border-light)' }}>
                          <span style={{
                            fontFamily: 'JetBrains Mono', fontSize: '0.75rem', fontWeight: 600,
                            background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                            border: '1px solid rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: 6,
                          }}>{r.pollutant_id}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', borderBottom: '1px solid var(--c-border-light)' }}>{r.min_value}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', borderBottom: '1px solid var(--c-border-light)' }}>{r.max_value}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', borderBottom: '1px solid var(--c-border-light)' }}>{r.avg_value}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--c-text-muted)', borderBottom: '1px solid var(--c-border-light)' }}>{r.last_update}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })() : (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--c-surface)', borderRadius: 16, border: '1px solid var(--c-border)', color: 'var(--c-text-muted)' }}>
              Loading air quality data from Data.gov.in...
            </div>
          )}
        </div>

        {/* Export */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={exportJSON} className="btn-secondary" style={{ padding: '14px 28px' }}>
            <Download size={18} />
            Export Live Data (JSON)
          </button>
        </div>
      </main>

      <Footer />

      {selectedFlight && <FlightModeModal flight={selectedFlight} onClose={() => setSelectedFlight(null)} />}

      {/* Air Quality Detail Modal */}
      {selectedAqRecord && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fm-fadein 0.3s ease', padding: '1rem',
        }} onClick={e => { if (e.target === e.currentTarget) setSelectedAqRecord(null); }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: 480,
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 0 60px rgba(245,158,11,0.12), 0 20px 40px rgba(0,0,0,0.4)',
            animation: 'motion-spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem', borderBottom: '1px solid var(--c-border)',
              background: 'var(--c-surface-2)',
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>
                {selectedAqRecord.city} - Air Quality
              </h3>
              <button onClick={() => setSelectedAqRecord(null)} style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(148,163,184,0.1)', border: '1px solid var(--c-border)',
                color: 'var(--c-text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wind size={18} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>{selectedAqRecord.city}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)' }}>{selectedAqRecord.state}</div>
                </div>
              </div>

              <div style={{ background: 'var(--c-surface-2)', borderRadius: 10, padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <MapPin size={12} color="var(--c-text-muted)" />
                  <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Station</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--c-text)', fontWeight: 600 }}>{selectedAqRecord.station}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'JetBrains Mono', fontSize: '0.75rem', fontWeight: 600,
                  background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                  border: '1px solid rgba(245,158,11,0.2)', padding: '4px 12px', borderRadius: 8,
                }}>{selectedAqRecord.pollutant_id}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                {[
                  { label: 'Min', value: selectedAqRecord.min_value, color: '#34d399' },
                  { label: 'Max', value: selectedAqRecord.max_value, color: '#ef4444' },
                  { label: 'Avg', value: selectedAqRecord.avg_value, color: '#f59e0b' },
                ].map((item, idx) => (
                  <div key={item.label} style={{
                    background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
                    borderRadius: 10, padding: '0.75rem', textAlign: 'center',
                    animation: `motion-stagger 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.2 + idx * 0.08}s both`,
                  }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: item.color, fontFamily: 'Space Grotesk' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', borderTop: '1px solid var(--c-border)', paddingTop: '0.6rem' }}>
                <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />{selectedAqRecord.last_update}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
