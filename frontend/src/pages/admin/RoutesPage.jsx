import { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import { Edit2, Save, X, Filter } from 'lucide-react';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getRoutes().then(setRoutes).catch(console.error).finally(() => setLoading(false));
  }, []);

  const startEdit = (route) => {
    setEditingId(route.id);
    setEditData({ destination: route.destination, demand_score: route.demand_score, reasoning: route.reasoning, status: route.status });
  };

  const saveEdit = async () => {
    try {
      await api.updateRoute(editingId, editData);
      setRoutes(prev => prev.map(r => r.id === editingId ? { ...r, ...editData } : r));
      setEditingId(null);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const filtered = filter === 'all' ? routes : routes.filter(r => r.status === filter);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <div className="spinner" />
      <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>Loading routes…</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>Route Recommendations</h1>
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>AI-recommended routes based on demand analysis</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <Filter size={16} color="var(--c-text-muted)" style={{ marginRight: 8 }} />
        {['all', 'Approved', 'Under Review', 'Proposed'].map(f => {
          const count = f === 'all' ? routes.length : routes.filter(r => r.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: filter === f ? 'rgba(99,102,241,0.15)' : 'var(--c-surface)',
                border: `1px solid ${filter === f ? 'rgba(99,102,241,0.3)' : 'var(--c-border)'}`,
                color: filter === f ? '#818cf8' : 'var(--c-text-muted)',
              }}
            >
              {f === 'all' ? 'All Routes' : f}
              <span style={{ marginLeft: 6, opacity: 0.6, fontFamily: 'JetBrains Mono' }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Airport</th>
              <th>Destination</th>
              <th>Demand Score</th>
              <th>Reasoning</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>
                  <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: '0.8rem', fontWeight: 600 }}>{r.airport_code}</span>
                  <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--c-text-muted)', display: 'none' }} className="sm:inline">{r.airport_name}</span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--c-text)' }}>
                  {editingId === r.id ? (
                    <input value={editData.destination} onChange={e => setEditData({ ...editData, destination: e.target.value })} className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} />
                  ) : r.destination}
                </td>
                <td>
                  {editingId === r.id ? (
                    <input type="number" value={editData.demand_score} onChange={e => setEditData({ ...editData, demand_score: parseFloat(e.target.value) })} className="form-input" style={{ width: 70, padding: '6px 10px', fontSize: '0.8rem' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 64, height: 6, background: 'var(--c-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: r.demand_score >= 80 ? '#6366f1' : '#f59e0b', width: `${r.demand_score}%`, borderRadius: 3, boxShadow: `0 0 8px ${r.demand_score >= 80 ? 'rgba(99,102,241,0.4)' : 'rgba(245,158,11,0.4)'}` }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700, color: r.demand_score >= 80 ? '#818cf8' : '#fbbf24' }}>{r.demand_score}%</span>
                    </div>
                  )}
                </td>
                <td style={{ maxWidth: 300 }}>
                  {editingId === r.id ? (
                    <textarea value={editData.reasoning} onChange={e => setEditData({ ...editData, reasoning: e.target.value })} className="form-input" rows={2} style={{ padding: '6px 10px', fontSize: '0.8rem' }} />
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reasoning}</p>
                  )}
                </td>
                <td>
                  {editingId === r.id ? (
                    <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })} className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                      <option>Proposed</option>
                      <option>Under Review</option>
                      <option>Approved</option>
                    </select>
                  ) : (
                    <StatusBadge status={r.status} />
                  )}
                </td>
                <td>
                  {editingId === r.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={saveEdit} style={{ padding: 6, borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'none', cursor: 'pointer' }}><Save size={16} /></button>
                      <button onClick={() => setEditingId(null)} style={{ padding: 6, borderRadius: 6, background: 'var(--c-surface-2)', color: 'var(--c-text-muted)', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(r)} style={{ padding: 6, borderRadius: 6, background: 'transparent', color: 'var(--c-text-muted)', border: 'none', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-surface-2)'; e.currentTarget.style.color = 'var(--c-text)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}>
                      <Edit2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
