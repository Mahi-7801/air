import { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import FlightModeModal from '../components/FlightModeModal';
import { Plane, Activity, Clock, MapPin, Search, Wind, Globe, LogOut, Radar, Zap, Navigation, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const [flights, setFlights] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [aqSearch, setAqSearch] = useState('');
  const [aqStateFilter, setAqStateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [user, setUser] = useState(null);
  const [apCounts, setApCounts] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [lastFlightUpdate, setLastFlightUpdate] = useState(null);
  const navigate = useNavigate();

  const LOCATIONS = [
    { label: 'All Locations', value: '', icon: '🌏' },
    { label: 'Visakhapatnam', value: 'VTZ', icon: '✈️' },
    { label: 'Vijayawada', value: 'VGA', icon: '✈️' },
    { label: 'Tirupati', value: 'TIR', icon: '✈️' },
    { label: 'Rajahmundry', value: 'RJA', icon: '✈️' },
    { label: 'Kadapa', value: 'CDP', icon: '✈️' },
    { label: 'Kurnool', value: 'KJB', icon: '✈️' }
  ];

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (!u) { navigate('/login'); return; }
    setUser(u);
    
    const loadAq = () => {
      api.getAPLiveCounts().then(data => { if (!data.error) setApCounts(data); }).catch(console.error);
      api.getAirQuality({ limit: 200 }).then(data => setAirQuality(data)).catch(console.error);
    };
    loadAq();
    const aqInterval = setInterval(loadAq, 15000);
    return () => clearInterval(aqInterval);
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    const fetchFlights = async () => {
      try {
        const data = await api.getLiveFlights(locationFilter);
        if (data.error) throw new Error(data.error.info || data.error);
        setFlights(data.data || []);
        setLastFlightUpdate(new Date());
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchFlights();
    const interval = setInterval(fetchFlights, 30000);
    return () => clearInterval(interval);
  }, [locationFilter]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filtered = flights.filter(f => {
    const ms = (f.flight?.iata || '').toLowerCase().includes(search.toLowerCase()) ||
               (f.airline?.name || '').toLowerCase().includes(search.toLowerCase()) ||
               (f.departure?.airport || '').toLowerCase().includes(search.toLowerCase()) ||
               (f.arrival?.airport || '').toLowerCase().includes(search.toLowerCase());
    const ml = locationFilter === '' || f.departure?.iata === locationFilter || f.arrival?.iata === locationFilter ||
               (f.departure?.airport || '').includes(locationFilter);
    return ms && ml;
  });

  const totalActive = apCounts ? Object.values(apCounts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #060a13 0%, #0a0f1a 50%, #0d1321 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <header style={{
        background: 'rgba(6,10,19,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="header-inner" style={{ maxWidth: 1400, margin: '0 auto', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 25px rgba(99,102,241,0.4), 0 0 50px rgba(99,102,241,0.1)',
              animation: 'motion-glow-pulse 3s ease-in-out infinite',
            }}>
              <Radar size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--c-text)', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
                AP Transport Intelligence
              </h1>
              <p style={{ fontSize: '0.6rem', color: '#818cf8', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Viewer Dashboard · Live Monitoring
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 2s infinite' }} />
              <span style={{ fontSize: '0.65rem', color: '#34d399', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>LIVE</span>
            </div>
            <a href="/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 8, fontSize: '0.7rem', color: '#818cf8', textDecoration: 'none',
            }}><Globe size={12} /> Public View</a>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 8, fontSize: '0.7rem', color: '#f87171', cursor: 'pointer', fontWeight: 600,
            }}><LogOut size={12} /> Sign Out</button>
          </div>
        </div>
      </header>

      {/* HERO STATS BAR */}
      <div style={{ background: 'rgba(15,23,42,0.5)', borderBottom: '1px solid var(--c-border)', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Active Flights', value: filtered.length, color: '#06b6d4', icon: Plane },
              { label: 'AP Airports Live', value: totalActive, color: '#6366f1', icon: Radar },
              { label: 'Unique Airlines', value: new Set(flights.map(f => f.airline?.name).filter(Boolean)).size, color: '#10b981', icon: Navigation },
              { label: 'Air Quality Stations', value: airQuality?.records?.length || 0, color: '#f59e0b', icon: Wind },
            ].map((s, i) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={15} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          {lastFlightUpdate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
              <Clock size={11} />
              Updated {lastFlightUpdate.toLocaleTimeString()} · Auto-refresh 30s
            </div>
          )}
        </div>
      </div>

      <main style={{ flex: 1, padding: '1.5rem 2rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        
        {/* AIRPORT LIVE CARDS */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <Zap size={16} color="#f59e0b" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>Andhra Pradesh Live Activity</h2>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--c-border), transparent)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            {LOCATIONS.filter(l => l.value !== '').map((loc, idx) => {
              const code = loc.value;
              const count = apCounts ? (apCounts[code] || 0) : null;
              const isActive = locationFilter === code;
              const hasFlights = count > 0;
              return (
                <div key={code} onClick={() => setLocationFilter(isActive ? '' : code)} style={{
                  background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))' : 'rgba(15,23,42,0.6)',
                  border: isActive ? '1px solid rgba(99,102,241,0.5)' : hasFlights ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--c-border)',
                  borderRadius: 14, padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative', overflow: 'hidden',
                  animation: `motion-stagger 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.05 + idx * 0.05}s both`,
                }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}}
                >
                  {hasFlights && <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 2s infinite' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: '1rem' }}>{loc.icon}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{code}</span>
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: hasFlights ? '#6366f1' : 'var(--c-text-muted)', fontFamily: 'Space Grotesk', lineHeight: 1, marginBottom: 2 }}>
                    {count !== null ? count : '...'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: hasFlights ? '#34d399' : 'var(--c-text-muted)', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
                    {hasFlights ? 'ACTIVE FLIGHTS' : 'NO FLIGHTS'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--c-text-muted)', marginTop: 2 }}>{loc.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* FLIGHTS SECTION */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: 'rgba(15,23,42,0.6)', padding: '1rem 1.25rem', borderRadius: 14, border: '1px solid var(--c-border)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plane size={16} color="#06b6d4" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>Live Flights</h2>
                <p style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>{filtered.length} flights tracked via OpenSky ADS-B</p>
              </div>
            </div>
            <div className="filter-bar-inner" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} style={{
                background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text)',
                padding: '8px 12px', borderRadius: 8, fontSize: '0.75rem', outline: 'none', cursor: 'pointer',
              }}>
                {LOCATIONS.map(loc => <option key={loc.value} value={loc.value}>{loc.icon} {loc.label}</option>)}
              </select>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--c-text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Search flights..." value={search} onChange={e => setSearch(e.target.value)} style={{
                  background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text)',
                  padding: '8px 12px 8px 32px', borderRadius: 8, fontSize: '0.75rem', width: 180, outline: 'none',
                }} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.875rem', borderRadius: 12, color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>
              <strong>API Error:</strong> {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
              <div className="spinner" />
              <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>Fetching live satellite data...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-text-muted)', background: 'rgba(15,23,42,0.4)', borderRadius: 16, border: '1px dashed var(--c-border)' }}>
              <Plane size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>No active flights found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
              {filtered.map((f, i) => (
                <div key={i} onClick={() => setSelectedFlight(f)} style={{
                  background: 'rgba(15,23,42,0.7)', border: '1px solid var(--c-border)', borderRadius: 14,
                  padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
                  animation: `motion-stagger 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.min(i * 0.03, 0.5)}s both`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plane size={16} color="#06b6d4" />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--c-text)', fontSize: '0.95rem' }}>
                          {f.flight?.iata || f.flight?.icao || '---'}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--c-text-muted)' }}>{f.airline?.name || 'Unknown'}</div>
                      </div>
                    </div>
                    <StatusBadge status={f.flight_status === 'active' ? 'Active' : 'Pending'} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.4rem', alignItems: 'center', background: 'var(--c-surface-2)', padding: '0.6rem 0.75rem', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.5rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>FROM</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>{f.departure?.iata || 'AP'}</div>
                      <div style={{ fontSize: '0.55rem', color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }} title={f.departure?.airport}>{f.departure?.airport || 'Region'}</div>
                    </div>
                    <Plane size={12} color="#6366f1" style={{ transform: 'rotate(90deg)' }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.5rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>TO</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>{f.arrival?.iata || '---'}</div>
                      <div style={{ fontSize: '0.55rem', color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100, marginLeft: 'auto' }} title={f.arrival?.airport}>{f.arrival?.airport || 'En Route'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-text-muted)' }}>
                      <Navigation size={10} />
                      {f.live?.altitude ? `${Math.round(f.live.altitude * 3.28084).toLocaleString()} ft` : 'En Route'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-text-muted)' }}>
                      <Zap size={10} />
                      {f.live?.speed_horizontal ? `${f.live.speed_horizontal} km/h` : '---'}
                    </div>
                  </div>

                  <div style={{ marginTop: 6, fontSize: '0.5rem', color: 'rgba(6,182,212,0.5)', fontFamily: 'JetBrains Mono', textAlign: 'center', opacity: 0.6 }}>
                    Click for Flight Mode
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AIR QUALITY */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <Wind size={16} color="#f59e0b" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>Air Quality Index</h2>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--c-border), transparent)' }} />
            <span style={{ fontSize: '0.6rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>{airQuality?.records?.length || 0} stations</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {airQuality?.states && (
              <select value={aqStateFilter} onChange={e => setAqStateFilter(e.target.value)} style={{
                background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)',
                padding: '6px 12px', borderRadius: 8, fontSize: '0.7rem', outline: 'none',
              }}>
                <option value="">All States</option>
                {airQuality.states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <div style={{ position: 'relative' }}>
              <Search size={12} color="var(--c-text-muted)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search city..." value={aqSearch} onChange={e => setAqSearch(e.target.value)} style={{
                background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)',
                padding: '6px 10px 6px 28px', borderRadius: 8, fontSize: '0.7rem', width: 160, outline: 'none',
              }} />
            </div>
          </div>

          {airQuality?.records ? (() => {
            const filteredAq = airQuality.records.filter(r => {
              const ms = !aqSearch || (r.city || '').toLowerCase().includes(aqSearch.toLowerCase()) || (r.station || '').toLowerCase().includes(aqSearch.toLowerCase());
              const ms2 = !aqStateFilter || r.state === aqStateFilter;
              return ms && ms2;
            });
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                {filteredAq.slice(0, 24).map((r, i) => {
                  const avg = parseFloat(r.avg_value) || 0;
                  const aqiColor = avg > 100 ? '#ef4444' : avg > 50 ? '#f59e0b' : '#10b981';
                  const aqiLabel = avg > 100 ? 'Poor' : avg > 50 ? 'Moderate' : 'Good';
                  return (
                    <div key={i} style={{
                      background: 'rgba(15,23,42,0.6)', border: '1px solid var(--c-border)', borderRadius: 12,
                      padding: '0.875rem', transition: 'all 0.2s', cursor: 'pointer',
                      animation: `motion-stagger 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.min(i * 0.02, 0.4)}s both`,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: `${aqiColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wind size={12} color={aqiColor} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--c-text)', fontSize: '0.8rem' }}>{r.city}</div>
                            <div style={{ fontSize: '0.5rem', color: 'var(--c-text-muted)' }}>{r.state}</div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.5rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: `${aqiColor}15`, color: aqiColor, fontFamily: 'JetBrains Mono',
                        }}>{aqiLabel}</span>
                      </div>
                      <div style={{ fontSize: '0.55rem', color: 'var(--c-text-muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.station}>
                        <MapPin size={8} style={{ display: 'inline', marginRight: 2 }} />{r.station}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, background: 'var(--c-surface-2)', padding: '8px', borderRadius: 8 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.45rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>MIN</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', fontFamily: 'JetBrains Mono' }}>{r.min_value}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.45rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>AVG</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: aqiColor, fontFamily: 'JetBrains Mono' }}>{r.avg_value}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.45rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>MAX</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', fontFamily: 'JetBrains Mono' }}>{r.max_value}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 4, fontSize: '0.5rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>{r.pollutant_id} · {r.last_update}</div>
                    </div>
                  )
                })}
              </div>
            );
          })() : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-text-muted)', background: 'rgba(15,23,42,0.4)', borderRadius: 16, border: '1px solid var(--c-border)' }}>
              Loading air quality data...
            </div>
          )}
        </div>
      </main>

      {selectedFlight && <FlightModeModal flight={selectedFlight} onClose={() => setSelectedFlight(null)} />}
    </div>
  );
}
