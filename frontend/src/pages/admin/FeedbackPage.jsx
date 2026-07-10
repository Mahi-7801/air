import { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import { MessageSquare, Send, Star, X } from 'lucide-react';

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', category: 'general', subject: '', message: '', rating: 5 });

  useEffect(() => { load(); }, []);

  const load = () => {
    api.getFeedback().then(setFeedback).catch(() => {});
  };

  const handleReply = async (id) => {
    if (!reply.trim()) return;
    await api.updateFeedback(id, { status: 'resolved', admin_reply: reply });
    setReply('');
    setSelected(null);
    load();
  };

  const handleStatus = async (id, status) => {
    await api.updateFeedback(id, { status });
    load();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.submitFeedback(form);
    setShowForm(false);
    setForm({ name: '', email: '', category: 'general', subject: '', message: '', rating: 5 });
    alert('Feedback submitted! Thank you.');
  };

  const filtered = filter ? feedback.filter(f => f.status === filter) : feedback;
  const counts = { new: feedback.filter(f => f.status === 'new').length, read: feedback.filter(f => f.status === 'read').length, resolved: feedback.filter(f => f.status === 'resolved').length };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em' }}>User Feedback</h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.85rem' }}>{feedback.length} total submissions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
          <MessageSquare size={14} /> Submit Feedback
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'New', count: counts.new, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Read', count: counts.read, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Resolved', count: counts.resolved, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map(s => (
          <div key={s.label} onClick={() => setFilter(filter === s.label.toLowerCase() ? '' : s.label.toLowerCase())} style={{
            background: s.bg, border: filter === s.label.toLowerCase() ? `2px solid ${s.color}` : '1px solid var(--c-border)',
            borderRadius: 12, padding: '1rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.count}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Submit Form */}
      {showForm && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.5rem', animation: 'motion-slide-up 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--c-text)' }}>Submit Feedback</h3>
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
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)' }}>Rating:</span>
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={20} fill={n <= form.rating ? '#f59e0b' : 'none'} color={n <= form.rating ? '#f59e0b' : 'var(--c-text-muted)'}
                    style={{ cursor: 'pointer' }} onClick={() => setForm({...form, rating: n})} />
                ))}
              </div>
            </div>
            <input className="form-input" placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
            <textarea className="form-input" placeholder="Your feedback..." rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} required style={{ resize: 'vertical' }} />
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}><Send size={14} /> Submit</button>
          </form>
        </div>
      )}

      {/* Feedback List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-text-muted)', background: 'var(--c-surface)', borderRadius: 16, border: '1px solid var(--c-border)' }}>
            No feedback submissions yet.
          </div>
        ) : filtered.map(f => (
          <div key={f.id} onClick={() => setSelected(selected?.id === f.id ? null : f)} style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12,
            padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all 0.2s',
            borderColor: selected?.id === f.id ? 'rgba(99,102,241,0.4)' : 'var(--c-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <StatusBadge status={f.status === 'new' ? 'Pending' : f.status === 'read' ? 'Under Review' : 'Connected'} />
                <span style={{ fontWeight: 600, color: 'var(--c-text)', fontSize: '0.9rem' }}>{f.subject}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>{new Date(f.created_at).toLocaleDateString()}</span>
                <div style={{ display: 'flex', gap: 1 }}>
                  {[1,2,3,4,5].map(n => <Star key={n} size={12} fill={n <= f.rating ? '#f59e0b' : 'none'} color={n <= f.rating ? '#f59e0b' : 'var(--c-text-muted)'} />)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', marginTop: 4 }}>{f.name} ({f.email}) - {f.category}</div>
            {selected?.id === f.id && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--c-border)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', lineHeight: 1.6 }}>{f.message}</p>
                {f.admin_reply && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(99,102,241,0.06)', borderRadius: 8, borderLeft: '3px solid #6366f1' }}>
                    <div style={{ fontSize: '0.65rem', color: '#818cf8', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 4 }}>Admin Reply</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--c-text-2)' }}>{f.admin_reply}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
                  {f.status !== 'read' && <button onClick={(e) => { e.stopPropagation(); handleStatus(f.id, 'read'); }} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Mark Read</button>}
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    <input className="form-input" placeholder="Write reply..." value={reply} onChange={e => setReply(e.target.value)} style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }} onClick={e => e.stopPropagation()} />
                    <button onClick={(e) => { e.stopPropagation(); handleReply(f.id); }} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.75rem' }}><Send size={12} /></button>
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
