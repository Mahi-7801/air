import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Settings, Bell, Shield, Database, Globe, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30,
    defaultView: 'overview',
    dataRetention: 90,
    exportFormat: 'xlsx',
  });

  useEffect(() => {
    api.getLogs().then(setLogs).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <div className="spinner" />
      <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>Loading settings…</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>Settings</h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>Configure system preferences and view audit logs</p>
        </div>
        <button onClick={handleSave} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
          {saved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> Save Settings</>}
        </button>
      </div>

      {saved && (
        <div style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
          color: '#34d399', fontSize: '0.875rem', fontWeight: 500,
        }}>
          <CheckCircle size={18} /> Settings saved successfully.
        </div>
      )}

      <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* System Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} color="#818cf8" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>System Preferences</h2>
          </div>

          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Notifications */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bell size={16} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--c-text)', fontSize: '0.9rem' }}>Email Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Receive alerts for feedback and queries</div>
                </div>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, notifications: !s.notifications }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                  background: settings.notifications ? '#6366f1' : 'var(--c-surface-2)',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3,
                  left: settings.notifications ? 23 : 3, transition: 'left 0.2s',
                }} />
              </button>
            </div>

            {/* Auto Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Globe size={16} color="#06b6d4" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--c-text)', fontSize: '0.9rem' }}>Auto Refresh</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Automatically refresh live data</div>
                </div>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, autoRefresh: !s.autoRefresh }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                  background: settings.autoRefresh ? '#6366f1' : 'var(--c-surface-2)',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3,
                  left: settings.autoRefresh ? 23 : 3, transition: 'left 0.2s',
                }} />
              </button>
            </div>

            {/* Refresh Interval */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Refresh Interval (seconds)
              </label>
              <select
                value={settings.refreshInterval}
                onChange={e => setSettings(s => ({ ...s, refreshInterval: parseInt(e.target.value) }))}
                className="form-input"
              >
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>

            {/* Default View */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Default Dashboard View
              </label>
              <select
                value={settings.defaultView}
                onChange={e => setSettings(s => ({ ...s, defaultView: e.target.value }))}
                className="form-input"
              >
                <option value="overview">Overview</option>
                <option value="demand">Demand Forecasting</option>
                <option value="airports">Airports</option>
                <option value="ports">Ports</option>
              </select>
            </div>

            {/* Export Format */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Default Export Format
              </label>
              <select
                value={settings.exportFormat}
                onChange={e => setSettings(s => ({ ...s, exportFormat: e.target.value }))}
                className="form-input"
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            {/* Data Retention */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Log Retention (days)
              </label>
              <input
                type="number"
                value={settings.dataRetention}
                onChange={e => setSettings(s => ({ ...s, dataRetention: parseInt(e.target.value) || 90 }))}
                className="form-input"
                min={30}
                max={365}
              />
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="#10b981" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>Audit Trail</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', background: 'var(--c-surface-2)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--c-border)' }}>
              {logs.length} entries
            </span>
          </div>
          <div style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: 16, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
            maxHeight: 500, overflowY: 'auto'
          }}>
            {logs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>No activity logs yet</div>
            ) : (
              logs.slice(0, 30).map(log => (
                <div key={log.id} style={{
                  padding: '1rem', borderRadius: 10, background: 'var(--c-surface-2)',
                  border: '1px solid rgba(148,163,184,0.06)', display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--c-text-2)', lineHeight: 1.5, margin: 0 }}>
                      <span style={{ fontWeight: 600, color: 'var(--c-text)' }}>{log.admin_email}</span> updated{' '}
                      <span style={{ color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '0 4px', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{log.field_changed}</span> for{' '}
                      <span style={{ fontWeight: 600, color: 'var(--c-text)' }}>{log.airport_name}</span>
                    </p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', whiteSpace: 'nowrap', paddingTop: 2, fontFamily: 'JetBrains Mono' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem',
                    fontFamily: 'JetBrains Mono', background: 'rgba(0,0,0,0.2)',
                    padding: '6px 10px', borderRadius: 6, color: 'var(--c-text-muted)'
                  }}>
                    <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{log.old_value}</span>
                    <span>→</span>
                    <span style={{ color: '#10b981' }}>{log.new_value}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
