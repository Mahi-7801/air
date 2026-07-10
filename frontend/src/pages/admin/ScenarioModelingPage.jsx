import { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { Sliders, TrendingUp, GitCompare, BarChart3 } from 'lucide-react';

const COLORS = [
  '#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16',
];

const fmt = (v) => {
  if (!v) return '0';
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
  return v.toLocaleString();
};

const pct = (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
const TABLE_YEARS = [2026, 2028, 2030, 2035];

const axisStyle = {
  fontFamily: 'JetBrains Mono',
  fontSize: 11,
  fill: '#64748b',
};

const gridStyle = { stroke: 'rgba(148,163,184,0.06)', strokeDasharray: '4 4' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      fontFamily: 'JetBrains Mono',
    }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: 6, fontFamily: 'Space Grotesk' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: '0.7rem', color: entry.color, marginBottom: 2 }}>
          {entry.name}: <strong>{fmt(entry.value)}</strong>
          {entry.payload?.scenario && (
            <span style={{ color: 'var(--c-text-muted)', fontSize: '0.65rem' }}> ({entry.payload.scenario})</span>
          )}
        </p>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div style={{
    display: 'flex', gap: 16, justifyContent: 'flex-end',
    padding: '0 12px 8px', flexWrap: 'wrap', maxHeight: 60, overflowY: 'auto',
  }}>
    {payload?.map((entry, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: entry.payload?.scenario === 'baseline' ? 16 : 24, height: 3,
          borderRadius: 2, background: entry.color,
          borderTop: entry.payload?.scenario === 'baseline' ? '2px dashed ' + entry.color : 'none',
          background: entry.payload?.scenario === 'baseline' ? 'transparent' : entry.color,
          borderBottom: entry.payload?.scenario === 'baseline' ? '2px dashed ' + entry.color : 'none',
        }} />
        <span style={{
          fontSize: '0.65rem', color: 'var(--c-text-muted)',
          fontFamily: 'JetBrains Mono',
          textDecoration: entry.payload?.scenario === 'baseline' ? 'line-through' : 'none',
          opacity: entry.payload?.scenario === 'baseline' ? 0.6 : 1,
        }}>
          {entry.value}
        </span>
      </div>
    ))}
  </div>
);

export default function ScenarioModelingPage() {
  const [growthRate, setGrowthRate] = useState(8);
  const [cargoGrowth, setCargoGrowth] = useState(6);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compareBase, setCompareBase] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.simulateScenario({ growth_rate: growthRate, cargo_growth: cargoGrowth })
      .then(data => { if (!cancelled) setResults(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [growthRate, cargoGrowth]);

  const airports = useMemo(() => {
    const map = new Map();
    results.forEach(r => {
      if (!map.has(r.airport_id)) {
        map.set(r.airport_id, {
          id: r.airport_id,
          name: r.airport_name,
          code: r.airport_code,
          capacity_2035: r.capacity_2035,
        });
      }
    });
    return Array.from(map.values());
  }, [results]);

  const { chartData, baselineChartData } = useMemo(() => {
    const scenarioRows = results.filter(r => r.scenario !== 'baseline');
    const baseRows = results.filter(r => r.scenario === 'baseline');

    const buildMap = (rows) => {
      const byYear = {};
      YEARS.forEach(y => { byYear[y] = { year: y }; });
      rows.forEach(r => {
        if (byYear[r.year]) {
          byYear[r.year][r.airport_code] = (r.domestic_passengers || 0) + (r.international_passengers || 0);
        }
      });
      return YEARS.map(y => byYear[y]);
    };

    return {
      chartData: buildMap(scenarioRows),
      baselineChartData: buildMap(baseRows),
    };
  }, [results]);

  const combinedChartData = useMemo(() => {
    if (!compareBase) return chartData;
    return YEARS.map(y => {
      const scenario = chartData.find(d => d.year === y) || {};
      const baseline = baselineChartData.find(d => d.year === y) || {};
      const merged = { year: y };
      const allKeys = new Set([...Object.keys(scenario), ...Object.keys(baseline)]);
      allKeys.forEach(k => {
        if (k === 'year') return;
        merged[k + '_scenario'] = scenario[k];
        merged[k + '_baseline'] = baseline[k];
      });
      return merged;
    });
  }, [chartData, baselineChartData, compareBase]);

  const airportColors = useMemo(() => {
    const map = {};
    airports.forEach((a, i) => { map[a.code] = COLORS[i % COLORS.length]; });
    return map;
  }, [airports]);

  const kpi = useMemo(() => {
    const scenario2035 = results.filter(r => r.scenario !== 'baseline' && r.year === 2035);
    const baseline2035 = results.filter(r => r.scenario === 'baseline' && r.year === 2035);

    const scenarioTotal = scenario2035.reduce((s, r) => s + (r.domestic_passengers || 0) + (r.international_passengers || 0), 0);
    const baselineTotal = baseline2035.reduce((s, r) => s + (r.domestic_passengers || 0) + (r.international_passengers || 0), 0);

    const change = baselineTotal ? ((scenarioTotal - baselineTotal) / baselineTotal) * 100 : 0;
    return { baselineTotal, scenarioTotal, change };
  }, [results]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <BarChart3 size={22} color="var(--c-secondary)" />
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em' }}>
              Scenario Modeling
            </h1>
          </div>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>
            What-if analysis for Andhra Pradesh transport demand
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', background: 'var(--c-surface)',
          border: '1px solid var(--c-border)', borderRadius: 8,
          fontSize: '0.75rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono',
        }}>
          <Sliders size={12} />
          Interactive Mode
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <SliderCard
          label="Passenger Growth Rate"
          value={growthRate}
          min={2} max={15} step={0.5}
          unit="%"
          onChange={setGrowthRate}
          color="#6366f1"
        />
        <SliderCard
          label="Cargo Growth Rate"
          value={cargoGrowth}
          min={2} max={12} step={0.5}
          unit="%"
          onChange={setCargoGrowth}
          color="#f59e0b"
        />
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="kpi-card" style={{
          background: 'linear-gradient(135deg, var(--c-surface) 0%, var(--c-surface-2) 100%)',
          border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.375rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.625rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={15} color="#818cf8" />
            </div>
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, color: 'var(--c-text-muted)',
              fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Baseline 2035
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
            {fmt(kpi.baselineTotal)}
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--c-text-muted)', marginTop: 4 }}>
            Total projected passengers (baseline)
          </p>
        </div>

        <div className="kpi-card" style={{
          background: 'linear-gradient(135deg, var(--c-surface) 0%, var(--c-surface-2) 100%)',
          border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.375rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.625rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BarChart3 size={15} color="#22d3ee" />
            </div>
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, color: 'var(--c-text-muted)',
              fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Scenario 2035
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
            {fmt(kpi.scenarioTotal)}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: '0.5rem',
            padding: '3px 8px', borderRadius: 6,
            background: kpi.change >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${kpi.change >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            fontSize: '0.7rem', fontWeight: 600, fontFamily: 'JetBrains Mono',
            color: kpi.change >= 0 ? '#34d399' : '#f87171',
          }}>
            <TrendingUp size={12} />
            {pct(kpi.change)} vs baseline
          </div>
        </div>
      </div>

      {/* Compare toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0.75rem 1.25rem', background: 'var(--c-surface)',
        border: '1px solid var(--c-border)', borderRadius: 12,
      }}>
        <GitCompare size={16} color="var(--c-text-muted)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--c-text)', flex: 1 }}>
          Compare to Base
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
          Show original forecast overlay
        </span>
        <button
          onClick={() => setCompareBase(!compareBase)}
          style={{
            position: 'relative', width: 44, height: 24, borderRadius: 12,
            background: compareBase ? 'var(--c-primary)' : 'var(--c-surface-3)',
            border: '1px solid var(--c-border)', cursor: 'pointer',
            transition: 'background 0.2s', padding: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 2, left: compareBase ? 22 : 2,
            width: 18, height: 18, borderRadius: '50%',
            background: 'white', transition: 'left 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }} />
        </button>
      </div>

      {/* Chart */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
          <TrendingUp size={16} color="var(--c-text-muted)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text)' }}>
            {compareBase ? 'Scenario vs Baseline — Passenger Projections' : 'Scenario Passenger Projections'}
          </h2>
          {loading && <div className="spinner" style={{ width: 14, height: 14 }} />}
        </div>
        <div style={{
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: 16, padding: '1.25rem 1rem 0.75rem',
        }}>
          {combinedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={combinedChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="year" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={axisStyle} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                {compareBase ? (
                  <>
                    {airports.map((a, i) => (
                      <Line
                        key={`${a.code}_scenario`}
                        type="monotone"
                        dataKey={`${a.code}_scenario`}
                        name={`${a.code} (Scenario)`}
                        stroke={airportColors[a.code]}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, fill: airportColors[a.code] }}
                      />
                    ))}
                    {airports.map((a, i) => (
                      <Line
                        key={`${a.code}_baseline`}
                        type="monotone"
                        dataKey={`${a.code}_baseline`}
                        name={`${a.code} (Baseline)`}
                        stroke={airportColors[a.code]}
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={false}
                        opacity={0.5}
                        activeDot={{ r: 3, fill: airportColors[a.code] }}
                      />
                    ))}
                  </>
                ) : (
                  airports.map((a, i) => (
                    <Line
                      key={a.code}
                      type="monotone"
                      dataKey={a.code}
                      name={a.code}
                      stroke={airportColors[a.code]}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, fill: airportColors[a.code] }}
                    />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--c-text-muted)', fontSize: '0.875rem', fontFamily: 'JetBrains Mono',
            }}>
              {loading ? 'Simulating scenario...' : 'No scenario data available. Adjust sliders to generate projections.'}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)' }}>
            Airport Scenario Breakdown
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
            {loading ? 'Updating...' : `${airports.length} airports`}
          </span>
        </div>
        <div className="table-container table-scroll" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Airport</th>
                <th>Code</th>
                {TABLE_YEARS.map(y => <th key={y}>{y}</th>)}
                <th>Growth %</th>
              </tr>
            </thead>
            <tbody>
              {airports.map(a => {
                const rows = results.filter(r => r.scenario !== 'baseline' && r.airport_id === a.id);
                const getYearTotal = (year) => {
                  const r = rows.find(x => x.year === year);
                  if (!r) return null;
                  return (r.domestic_passengers || 0) + (r.international_passengers || 0);
                };
                const v2026 = getYearTotal(2026);
                const v2035 = getYearTotal(2035);
                const grow = v2026 && v2035 ? ((v2035 - v2026) / v2026) * 100 : null;
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: 'var(--c-text)' }}>{a.name}</td>
                    <td>
                      <span style={{
                        fontFamily: 'JetBrains Mono', fontSize: '0.8rem', fontWeight: 600,
                        background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: 6,
                      }}>
                        {a.code}
                      </span>
                    </td>
                    {TABLE_YEARS.map(y => (
                      <td key={y} className="data-tag">
                        {getYearTotal(y) !== null ? fmt(getYearTotal(y)) : '—'}
                      </td>
                    ))}
                    <td>
                      {grow !== null ? (
                        <span style={{
                          fontFamily: 'JetBrains Mono', fontSize: '0.8rem', fontWeight: 700,
                          color: grow >= 0 ? '#34d399' : '#f87171',
                        }}>
                          {pct(grow)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SliderCard({ label, value, min, max, step, unit, onChange, color }) {
  const pctPos = ((value - min) / (max - min)) * 100;
  return (
    <div style={{
      background: 'var(--c-surface)', border: '1px solid var(--c-border)',
      borderRadius: 16, padding: '1.25rem 1.5rem',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{
          fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-muted)',
          fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-text)',
          fontFamily: 'Space Grotesk', letterSpacing: '-0.02em',
        }}>
          {value}{unit}
        </span>
      </div>
      <style>{`
        input[type=range].scenario-slider-${label.replace(/\s/g, '')} {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          background: var(--c-surface-3);
          cursor: pointer;
          transition: background 0.2s;
        }
        input[type=range].scenario-slider-${label.replace(/\s/g, '')}::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${color};
          cursor: pointer;
          border: 2px solid var(--c-surface);
          box-shadow: 0 0 0 4px ${color}40, 0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.15s;
        }
        input[type=range].scenario-slider-${label.replace(/\s/g, '')}::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type=range].scenario-slider-${label.replace(/\s/g, '')}::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${color};
          cursor: pointer;
          border: 2px solid var(--c-surface);
          box-shadow: 0 0 0 4px ${color}40, 0 2px 8px rgba(0,0,0,0.4);
        }
        input[type=range].scenario-slider-${label.replace(/\s/g, '')}::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: var(--c-surface-3);
        }
      `}</style>
      <div style={{ position: 'relative' }}>
        <input
          type="range"
          className={`scenario-slider-${label.replace(/\s/g, '')}`}
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{
          position: 'absolute', top: 0, left: 0, height: 6,
          width: `${pctPos}%`, borderRadius: '3px 0 0 3px',
          background: `linear-gradient(90deg, ${color}00, ${color})`,
          pointerEvents: 'none', opacity: 0.5,
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem',
        fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono',
      }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
