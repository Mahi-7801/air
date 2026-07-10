import { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import KPICard from '../../components/KPICard';
import {
  TrendingUp, Plane, Package, BarChart3, RefreshCw, ChevronDown, Filter,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

const fmt = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return v.toLocaleString();
};

const fmtFull = (v) => {
  if (!v && v !== 0) return '—';
  return Number(v).toLocaleString('en-IN');
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--c-bg, #0f1117)',
      border: '1px solid var(--c-border, #1e2235)',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
    }}>
      <p style={{
        fontFamily: 'Space Grotesk',
        fontWeight: 700,
        fontSize: '0.8rem',
        color: 'var(--c-text, #e2e8f0)',
        marginBottom: 8,
      }}>
        Year {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: 3, background: entry.color }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--c-text-muted, #8892a4)', flex: 1 }}>
            {entry.name}
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--c-text, #e2e8f0)',
          }}>
            {fmt(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function DemandForecastingPage() {
  const [demand, setDemand] = useState([]);
  const [cargo, setCargo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAirport, setSelectedAirport] = useState('all');

  useEffect(() => {
    api.getDemandForecast().then(setDemand).catch(() => {}).finally(() => setLoading(false));
    api.getCargoForecast().then(setCargo).catch(() => {});
  }, []);

  const airportNames = useMemo(() => {
    const names = new Set(demand.map(d => d.airport_name).filter(Boolean));
    return ['all', ...Array.from(names)];
  }, [demand]);

  const filteredDemand = useMemo(() => {
    if (selectedAirport === 'all') return demand;
    return demand.filter(d => d.airport_name === selectedAirport);
  }, [demand, selectedAirport]);

  const filteredCargo = useMemo(() => {
    if (selectedAirport === 'all') return cargo;
    return cargo.filter(c => c.port_name === selectedAirport);
  }, [cargo, selectedAirport]);

  const kpis = useMemo(() => {
    const latest = filteredDemand.filter(d => d.year === 2035);
    const cargoLatest = filteredCargo.filter(c => c.year === 2035);
    const totalPax2035 = latest.reduce((s, r) => s + (r.domestic_passengers || 0) + (r.international_passengers || 0), 0);
    const totalCargo2035 = cargoLatest.reduce((s, r) => s + (r.total_cargo_mt || 0), 0);
    const airportCount = new Set(filteredDemand.map(d => d.airport_name).filter(Boolean)).size;
    const firstYear = filteredDemand.length ? Math.min(...filteredDemand.map(d => d.year)) : 2025;
    const basePax = filteredDemand.filter(d => d.year === firstYear).reduce((s, r) => s + (r.domestic_passengers || 0) + (r.international_passengers || 0), 0);
    const years = 2035 - firstYear;
    const avgGrowth = basePax > 0 && years > 0
      ? ((Math.pow(totalPax2035 / basePax, 1 / years) - 1) * 100).toFixed(1)
      : '0.0';
    return { totalPax2035, totalCargo2035, airportCount, avgGrowth };
  }, [filteredDemand, filteredCargo]);

  const passengerChartData = useMemo(() => {
    const byYear = {};
    filteredDemand.forEach(d => {
      if (!byYear[d.year]) byYear[d.year] = { year: d.year, domestic: 0, international: 0 };
      byYear[d.year].domestic += d.domestic_passengers || 0;
      byYear[d.year].international += d.international_passengers || 0;
    });
    return Object.values(byYear).sort((a, b) => a.year - b.year);
  }, [filteredDemand]);

  const cargoChartData = useMemo(() => {
    const byYear = {};
    filteredCargo.forEach(c => {
      if (!byYear[c.year]) byYear[c.year] = { year: c.year, road: 0, rail: 0, sea: 0, total: 0 };
      byYear[c.year].road += c.road_cargo_mt || 0;
      byYear[c.year].rail += c.rail_cargo_mt || 0;
      byYear[c.year].sea += c.sea_cargo_mt || 0;
      byYear[c.year].total += c.total_cargo_mt || 0;
    });
    return Object.values(byYear).sort((a, b) => a.year - b.year);
  }, [filteredCargo]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>
          Loading demand forecasts…
        </span>
      </div>
    );
  }

  const selectStyle = {
    background: 'var(--c-surface)',
    border: '1px solid var(--c-border)',
    borderRadius: 10,
    padding: '8px 32px 8px 12px',
    color: 'var(--c-text)',
    fontFamily: 'JetBrains Mono',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238892a4' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  };

  const chartCard = {
    background: 'var(--c-surface)',
    border: '1px solid var(--c-border)',
    borderRadius: 16,
    padding: '1.5rem',
  };

  const sectionHeader = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
  };

  const axisStyle = {
    fontSize: '0.7rem',
    fontFamily: 'JetBrains Mono',
    fill: 'var(--c-text-muted, #8892a4)',
  };

  const cartesianGridProps = {
    strokeDasharray: '3 3',
    stroke: 'var(--c-border, #1e2235)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4, fontFamily: 'Space Grotesk' }}>
            Demand Forecasting
          </h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>
            Passenger &amp; cargo growth projections for Andhra Pradesh airports and ports through 2035
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <Filter size={13} color="var(--c-text-muted)" style={{ position: 'absolute', left: 10, pointerEvents: 'none', zIndex: 1 }} />
            <select
              value={selectedAirport}
              onChange={e => setSelectedAirport(e.target.value)}
              style={{ ...selectStyle, paddingLeft: 30 }}
            >
              {airportNames.map(name => (
                <option key={name} value={name}>{name === 'all' ? 'All Airports' : name}</option>
              ))}
            </select>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', background: 'var(--c-surface)',
            border: '1px solid var(--c-border)', borderRadius: 8,
            fontSize: '0.75rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono',
          }}>
            <RefreshCw size={12} />
            Updated {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KPICard
          title="Projected Passengers 2035"
          value={fmt(kpis.totalPax2035)}
          subtitle="Total domestic + international"
          icon={Plane}
          color="cyan"
          trend={Number(kpis.avgGrowth)}
          trendLabel="CAGR"
        />
        <KPICard
          title="Projected Cargo 2035"
          value={kpis.totalCargo2035 >= 1000 ? fmt(kpis.totalCargo2035) + ' MT' : fmtFull(kpis.totalCargo2035) + ' MT'}
          subtitle="Road + rail + sea combined"
          icon={Package}
          color="amber"
        />
        <KPICard
          title="Airports Tracked"
          value={kpis.airportCount}
          subtitle="Demand forecast coverage"
          icon={BarChart3}
          color="green"
        />
        <KPICard
          title="Avg Growth Rate"
          value={kpis.avgGrowth + '%'}
          subtitle="Compound annual growth"
          icon={TrendingUp}
          color="navy"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Passenger Growth Chart */}
        <div style={chartCard}>
          <div style={sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plane size={16} color="#22d3ee" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>
                Passenger Growth Forecast
              </h2>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
              {selectedAirport === 'all' ? 'All Airports' : selectedAirport}
            </span>
          </div>
          {passengerChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={passengerChartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDomestic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradInternational" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...cartesianGridProps} />
                <XAxis dataKey="year" tick={axisStyle} axisLine={{ stroke: 'var(--c-border, #1e2235)' }} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={fmt} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', paddingTop: 12 }}
                  iconType="square"
                  iconSize={10}
                />
                <Area
                  type="monotone"
                  dataKey="domestic"
                  name="Domestic"
                  stackId="1"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradDomestic)"
                />
                <Area
                  type="monotone"
                  dataKey="international"
                  name="International"
                  stackId="1"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#gradInternational)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-muted)', fontSize: '0.85rem' }}>
              No passenger forecast data available
            </div>
          )}
        </div>

        {/* Cargo Growth Chart */}
        <div style={chartCard}>
          <div style={sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={16} color="#f59e0b" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>
                Cargo Growth Forecast
              </h2>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
              {selectedAirport === 'all' ? 'All Ports' : selectedAirport}
            </span>
          </div>
          {cargoChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cargoChartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradRail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradSea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...cartesianGridProps} />
                <XAxis dataKey="year" tick={axisStyle} axisLine={{ stroke: 'var(--c-border, #1e2235)' }} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={fmt} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono', paddingTop: 12 }}
                  iconType="square"
                  iconSize={10}
                />
                <Area type="monotone" dataKey="road" name="Road" stackId="1" stroke="#f59e0b" strokeWidth={2} fill="url(#gradRoad)" />
                <Area type="monotone" dataKey="rail" name="Rail" stackId="1" stroke="#10b981" strokeWidth={2} fill="url(#gradRail)" />
                <Area type="monotone" dataKey="sea" name="Sea" stackId="1" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradSea)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-muted)', fontSize: '0.85rem' }}>
              No cargo forecast data available
            </div>
          )}
        </div>
      </div>

      {/* Airport Forecast Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>
            Detailed Airport Forecasts
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
            {filteredDemand.length} forecast rows
          </span>
        </div>
        <div style={{
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
            <table style={{ minWidth: 820, width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--c-surface-2, #141824)', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  {['Airport', 'Code', 'Year', 'Domestic Passengers', 'Intl Passengers', 'Cargo MT', 'Confidence Range'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      fontSize: '0.7rem',
                      color: 'var(--c-text-muted)',
                      fontWeight: 600,
                      fontFamily: 'JetBrains Mono',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: '1px solid var(--c-border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDemand.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid var(--c-border)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--c-text)', fontSize: '0.84rem' }}>
                      {row.airport_name}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono', fontSize: '0.78rem', fontWeight: 600,
                        background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: 6,
                      }}>
                        {row.airport_code}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'JetBrains Mono', fontSize: '0.82rem', fontWeight: 600, color: 'var(--c-text)' }}>
                      {row.year}
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'JetBrains Mono', fontSize: '0.82rem', fontWeight: 500 }}>
                      {fmtFull(row.domestic_passengers)}
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'JetBrains Mono', fontSize: '0.82rem', fontWeight: 500 }}>
                      {fmtFull(row.international_passengers)}
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'JetBrains Mono', fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b' }}>
                      {fmtFull(row.cargo_mt)}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono', fontSize: '0.72rem', fontWeight: 500,
                        color: 'var(--c-text-muted)',
                      }}>
                        {fmtFull(row.confidence_low)} – {fmtFull(row.confidence_high)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredDemand.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: '0.85rem' }}>
                      No forecast data for the selected filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
