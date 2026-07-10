import { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import { HelpCircle, Send, X, Trash2 } from 'lucide-react';

export default function QueriesPage() {
  const [queries, setQueries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', category: 'general', subject: '', message: '', priority: 'medium' });

  useEffect(() => { load(); }, []);

  const load = () => { api.getQueries().then(setQueries).catch(() => {}); };

  const handleReply = async (id) => {
    if (!reply.trim()) return;
    await api.updateQuery(id, { status: 'answered', admin_response: reply });
    setReply('');
    setSelected(null);
    load();
  };

  const handleStatus = async (id, status) => {
    await api.updateQuery(id, { status });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this query?')) return;
    await api.deleteQuery(id);
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.submitQuery(form);
    setShowForm(false);
    setForm({ name: '', email: '', category: 'general', subject: '', message: '', priority: 'medium' });
    alert('Query submitted! We will respond soon.');
  };

  const filtered = filter ? queries.filter(q => q.status === filter) : queries;
  const counts = { open: queries.filter(q => q.status === 'open').length, in_progress: queries.filter(q => q.status === 'in_progress').length, answered: queries.filter(q => q.status === 'answered').length, closed: queries.filter(q => q.status === 'closed').length };

  const priorityColor = { low: '#34d399', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em' }}>User Queries</h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.85rem' }}>{queries.length} total queries</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
          <HelpCircle size={14} /> Submit Query
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'Open', count: counts.open, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'In Progress', count: counts.in_progress, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Answered', count: counts.answered, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Closed', count: counts.closed, color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
        ].map(s => (
          <div key={s.label} onClick={() => setFilter(filter === s.label.toLowerCase().replace(' ', '_') ? '' : s.label.toLowerCase().replace(' ', '_'))} style={{
            background: s.bg, border: filter === s.label.toLowerCase().replace(' ', '_') ? `2px solid ${s.color}` : '1px solid var(--c-border)',
            borderRadius: 12, padding: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.count}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Submit Form */}
      {showForm && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.5rem', animation: 'motion-slide-up 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--c-text)' }}>Submit a Query</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <input className="form-input" placeholder="Your Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input className="form-input" type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="general">General</option>
                <option value="data_request">Data Request</option>
                <option value="technical">Technical Issue</option>
                <option value="partnership">Partnership</option>
              </select>
              <select className="form-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <input className="form-input" placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
            <textarea className="form-input" placeholder="Describe your query..." rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} required style={{ resize: 'vertical' }} />
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}><Send size={14} /> Submit Query</button>
          </form>
        </div>
      )}

      {/* Query List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-text-muted)', background: 'var(--c-surface)', borderRadius: 16, border: '1px solid var(--c-border)' }}>
            No queries found.
          </div>
        ) : filtered.map(q => (
          <div key={q.id} onClick={() => setSelected(selected?.id === q.id ? null : q)} style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12,
            padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all 0.2s',
            borderColor: selected?.id === q.id ? 'rgba(99,102,241,0.4)' : 'var(--c-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <StatusBadge status={q.status === 'open' ? 'Pending' : q.status === 'in_progress' ? 'Under Review' : q.status === 'answered' ? 'Connected' : 'Error'} />
                <span style={{ fontWeight: 600, color: 'var(--c-text)', fontSize: '0.9rem' }}>{q.subject}</span>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: `${priorityColor[q.priority]}20`, color: priorityColor[q.priority],
                  border: `1px solid ${priorityColor[q.priority]}40`, fontFamily: 'JetBrains Mono', textTransform: 'uppercase',
                }}>{q.priority}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>{new Date(q.created_at).toLocaleDateString()}</span>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} style={{ background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer', padding: 4 }}><Trash2 size={13} /></button>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', marginTop: 4 }}>{q.name} ({q.email}) - {q.category}</div>

            {selected?.id === q.id && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--c-border)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', lineHeight: 1.6 }}>{q.message}</p>
                {q.admin_response && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(99,102,241,0.06)', borderRadius: 8, borderLeft: '3px solid #6366f1' }}>
                    <div style={{ fontSize: '0.65rem', color: '#818cf8', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 4 }}>Admin Response</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--c-text-2)' }}>{q.admin_response}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {q.status === 'open' && <button onClick={(e) => { e.stopPropagation(); handleStatus(q.id, 'in_progress'); }} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>Start Progress</button>}
                  {q.status !== 'closed' && <button onClick={(e) => { e.stopPropagation(); handleStatus(q.id, 'closed'); }} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>Close</button>}
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    <input className="form-input" placeholder="Write response..." value={reply} onChange={e => setReply(e.target.value)} style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }} onClick={e => e.stopPropagation()} />
                    <button onClick={(e) => { e.stopPropagation(); handleReply(q.id); }} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.75rem' }}><Send size={12} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
