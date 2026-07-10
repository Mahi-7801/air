import { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import { Database, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});

  useEffect(() => {
    api.getDatasets().then(setDatasets).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSync = async (id) => {
    setSyncing(prev => ({ ...prev, [id]: true }));
    try {
      await api.syncDataset(id);
      setDatasets(prev => prev.map(d => d.id === id ? { ...d, status: 'Connected', last_synced: new Date().toISOString() } : d));
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setSyncing(prev => ({ ...prev, [id]: false }));
    }
  };

  const connected = datasets.filter(d => d.status === 'Connected').length;
  const pending = datasets.filter(d => d.status === 'Pending').length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <div className="spinner" />
      <span style={{ color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.875rem' }}>Loading datasets…</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>Datasets</h1>
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>Manage data source connections and sync status</p>
      </div>

      <div className="kpi-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle size={18} color="#10b981" />
            <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Connected</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', fontFamily: 'Space Grotesk' }}>{connected}</h3>
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Clock size={18} color="#f59e0b" />
            <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pending</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'Space Grotesk' }}>{pending}</h3>
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertCircle size={18} color="#ef4444" />
            <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Error</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444', fontFamily: 'Space Grotesk' }}>0</h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {datasets.map(ds => (
          <div key={ds.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '1.25rem', transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: ds.status === 'Connected' ? 'rgba(16,185,129,0.12)' : ds.status === 'Pending' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)' }}>
                <Database size={20} color={ds.status === 'Connected' ? '#34d399' : ds.status === 'Pending' ? '#fbbf24' : '#f87171'} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--c-text)', fontFamily: 'Space Grotesk', fontSize: '0.95rem' }}>{ds.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ds.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                  <StatusBadge status={ds.status} />
                  {ds.source_url && (
                    <a href={ds.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#818cf8'} onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-muted)'}>
                      <ExternalLink size={12} /> Source
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', color: 'var(--c-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Sync</span>
                <span style={{ fontSize: '0.8rem', fontFamily: 'JetBrains Mono', color: '#818cf8', fontWeight: 600 }}>{ds.last_synced ? new Date(ds.last_synced).toLocaleDateString() : 'Never'}</span>
              </div>
              {ds.status !== 'Pending' && (
                <button
                  onClick={() => handleSync(ds.id)}
                  disabled={syncing[ds.id]}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '0.8rem', fontWeight: 600, cursor: syncing[ds.id] ? 'not-allowed' : 'pointer', opacity: syncing[ds.id] ? 0.5 : 1, transition: 'all 0.2s' }}
                  onMouseEnter={e => { if(!syncing[ds.id]) e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}
                  onMouseLeave={e => { if(!syncing[ds.id]) e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                >
                  <RefreshCw size={14} className={syncing[ds.id] ? 'animate-spin' : ''} />
                  {syncing[ds.id] ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'Space Grotesk', marginBottom: 8 }}>Data-Sharing Agreements Required</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--c-text-2)', lineHeight: 1.6 }}>
          FASTag traffic data (NHAI/NPCI), E-Way Bill data (GSTN), FOIS railway freight data (Indian Railways), and ICEGATE trade data (CBIC) are not available via public APIs. These datasets require official data-sharing agreements with the respective government agencies. Contact APMB for MoU status.
        </p>
      </div>
    </div>
  );
}
