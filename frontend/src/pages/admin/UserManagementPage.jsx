import { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import { Users, UserPlus, X, Mail, Shield } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'viewer' });

  useEffect(() => { load(); }, []);

  const load = () => {
    api.getUsers().then(setUsers).catch(() => {});
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.register(form);
      setShowForm(false);
      setForm({ email: '', password: '', full_name: '', role: 'viewer' });
      load();
    } catch (err) {
      alert(err.message || 'Registration failed');
    }
  };

  const roleColor = { admin: '#6366f1', viewer: '#10b981' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em' }}>User Management</h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.85rem' }}>{users.length} registered users</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
          <UserPlus size={14} /> Register User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Users', count: users.length, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Admins', count: users.filter(u => u.role === 'admin').length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Viewers', count: users.filter(u => u.role === 'viewer').length, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: '1px solid var(--c-border)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.count}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Register Form */}
      {showForm && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.5rem', animation: 'motion-slide-up 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--c-text)' }}>Register New User</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <input className="form-input" placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
              <input className="form-input" type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <input className="form-input" type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
              <select className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}><UserPlus size={14} /> Register</button>
          </form>
        </div>
      )}

      {/* User Table */}
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: 500 }}>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${roleColor[u.role]}80, ${roleColor[u.role]}40)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.8rem', color: 'white',
                    }}>
                      {(u.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--c-text)' }}>{u.full_name || 'Unknown'}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={12} color="var(--c-text-muted)" />
                    <span style={{ fontSize: '0.85rem' }}>{u.email}</span>
                  </div>
                </td>
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                    fontFamily: 'JetBrains Mono', textTransform: 'uppercase',
                    background: `${roleColor[u.role]}15`, color: roleColor[u.role],
                    border: `1px solid ${roleColor[u.role]}30`,
                  }}>
                    <Shield size={10} /> {u.role}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
