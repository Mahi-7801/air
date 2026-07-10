import { useState, useEffect } from 'react';
import { api } from '../../api';
import { FileText, Download, CheckCircle, Info } from 'lucide-react';

export default function ReportsPage() {
  const [airports, setAirports] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState('');
  const [yearFrom, setYearFrom] = useState('2026');
  const [yearTo, setYearTo] = useState('2035');
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getAirports().then(setAirports);
  }, []);

  const exportExcel = async () => {
    setGenerating(true); setSuccess('');
    try {
      const params = { format: 'xlsx', year_from: yearFrom, year_to: yearTo };
      if (selectedAirport) params.airport_id = selectedAirport;
      const res = await api.exportReport(params);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AP_Transport_Forecast_Report.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Excel report downloaded successfully.');
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const exportJSON = async () => {
    setGenerating(true); setSuccess('');
    try {
      const params = { format: 'json', year_from: yearFrom, year_to: yearTo };
      if (selectedAirport) params.airport_id = selectedAirport;
      const data = await api.exportReport(params);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AP_Transport_Forecast_Report.json';
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('JSON report downloaded successfully.');
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>Reports</h1>
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>Generate and export forecast reports</p>
      </div>

      {success && (
        <div style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
          color: '#34d399', fontSize: '0.875rem', fontWeight: 500, maxWidth: 600,
        }}>
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <div style={{ maxWidth: 600 }}>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Select Airport (Optional)
              </label>
              <select value={selectedAirport} onChange={e => setSelectedAirport(e.target.value)} className="form-input">
                <option value="">All Airports (System-wide)</option>
                {airports.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
              </select>
            </div>

            <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Year From
                </label>
                <select value={yearFrom} onChange={e => setYearFrom(e.target.value)} className="form-input">
                  {Array.from({ length: 10 }, (_, i) => 2026 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Year To
                </label>
                <select value={yearTo} onChange={e => setYearTo(e.target.value)} className="form-input">
                  {Array.from({ length: 10 }, (_, i) => 2026 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="stack-mobile" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button onClick={exportExcel} disabled={generating} className="btn-primary" style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                <Download size={18} />
                {generating ? 'Generating...' : 'Export Excel (.xlsx)'}
              </button>
              <button onClick={exportJSON} disabled={generating} className="btn-secondary" style={{ flex: 1, padding: '14px' }}>
                <FileText size={18} />
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: '1.5rem', display: 'flex', gap: 16 }}>
        <Info size={24} color="#818cf8" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk', marginBottom: 6 }}>Report Contents</h4>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: 'var(--c-text-2)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>Airport metadata and IATA/ICAO codes</li>
            <li>Year-wise domestic & international passenger forecasts</li>
            <li>Cargo volume projections (metric tonnes)</li>
            <li>Confidence interval ranges (low-high) and historical accuracy</li>
            <li>Forecast methodology notes (DGCA modeling parameters)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
