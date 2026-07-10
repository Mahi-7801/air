import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Plane, Ship, Database, Route, FileText,
  Settings, LogOut, Menu, X, ChevronRight, Bell, Search, Activity,
  TrendingUp, Sliders, Gauge, Truck, AlertTriangle, Users, MessageSquare, HelpCircle, Globe
} from 'lucide-react';
import { useState } from 'react';
import Footer from './Footer';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true, section: 'MAIN' },
  { to: '/admin/demand-forecasting', icon: TrendingUp, label: 'Demand Forecasting', section: 'FORECASTING' },
  { to: '/admin/scenario-modeling', icon: Sliders, label: 'Scenario Modeling', section: 'FORECASTING' },
  { to: '/admin/airports', icon: Plane, label: 'Airports', section: 'DATA' },
  { to: '/admin/ports', icon: Ship, label: 'Ports & Freight', section: 'DATA' },
  { to: '/admin/capacity-planning', icon: Gauge, label: 'Capacity Planning', section: 'ANALYTICS' },
  { to: '/admin/corridor-analysis', icon: Truck, label: 'Corridor Analysis', section: 'ANALYTICS' },
  { to: '/admin/infrastructure-gaps', icon: AlertTriangle, label: 'Infrastructure Gaps', section: 'ANALYTICS' },
  { to: '/admin/routes', icon: Route, label: 'Route Recommendations', section: 'ANALYTICS' },
  { to: '/admin/datasets', icon: Database, label: 'Datasets', section: 'DATA' },
  { to: '/admin/feedback', icon: MessageSquare, label: 'Feedback', section: 'SUPPORT' },
  { to: '/admin/queries', icon: HelpCircle, label: 'Queries', section: 'SUPPORT' },
  { to: '/admin/user-management', icon: Users, label: 'User Management', section: 'SUPPORT' },
  { to: '/admin/reports', icon: FileText, label: 'Reports', section: 'SYSTEM' },
  { to: '/admin/settings', icon: Settings, label: 'Settings', section: 'SYSTEM' },
];

const sections = ['MAIN', 'FORECASTING', 'DATA', 'ANALYTICS', 'SUPPORT', 'SYSTEM'];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const pageTitle = navItems.find(n => {
    if (n.end) return location.pathname === n.to;
    return location.pathname.startsWith(n.to);
  })?.label || 'Dashboard';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--c-bg)' }}>
      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 256,
        background: 'var(--c-surface)',
        borderRight: '1px solid var(--c-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)', flexShrink: 0,
            }}>
              <Plane size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>AP Transport</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Intelligence
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer', padding: 4 }}
              className="lg-hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.18)', borderRadius: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ fontSize: '0.7rem', color: '#34d399', fontFamily: 'JetBrains Mono', fontWeight: 500 }}>System Operational</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto' }}>
          {sections.map(section => {
            const items = navItems.filter(n => n.section === section);
            if (!items.length) return null;
            return (
              <div key={section}>
                <div className="nav-section-label">{section}</div>
                {items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', marginBottom: 2, transition: 'all 0.2s' }}
                  >
                    <item.icon size={17} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--c-surface-2)', marginBottom: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.875rem', color: 'white', fontFamily: 'Space Grotesk',
            }}>
              {(user.full_name || 'A')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name || 'Admin User'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 14px', borderRadius: 10, border: 'none',
              background: 'none', cursor: 'pointer', color: 'var(--c-text-muted)',
              fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: 62,
          background: 'rgba(15,23,42,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--c-border)',
          display: 'flex', alignItems: 'center',
          padding: '0 1.5rem', gap: 12,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          {/* Mobile menu */}
          <button
            id="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer', padding: 4, display: 'none' }}
            className="admin-menu-btn"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>Admin</span>
            <ChevronRight size={14} color="var(--c-text-muted)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-text)' }}>{pageTitle}</span>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NavLink to="/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', background: 'var(--c-surface-2)',
              border: '1px solid var(--c-border)', borderRadius: 8,
              fontSize: '0.75rem', color: 'var(--c-text-muted)', textDecoration: 'none',
              transition: 'all 0.2s', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = 'var(--c-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
            >
              <Globe size={13} />
              <span>Public</span>
            </NavLink>

            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8,
              fontSize: '0.75rem', color: '#f87171', cursor: 'pointer',
              fontWeight: 600, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>

            <div className="admin-topbar-search" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: 'var(--c-surface-2)',
              border: '1px solid var(--c-border)', borderRadius: 8, cursor: 'pointer',
            }}>
              <Search size={14} color="var(--c-text-muted)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)' }}>Search...</span>
            </div>

            <button style={{
              position: 'relative', width: 36, height: 36, borderRadius: 8,
              background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Bell size={16} color="var(--c-text-muted)" />
              <div style={{
                position: 'absolute', top: 6, right: 6,
                width: 7, height: 7, borderRadius: '50%',
                background: '#f59e0b', border: '1.5px solid var(--c-surface)',
              }} />
            </button>

            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.8rem', color: 'white', cursor: 'pointer',
            }}>
              {(user.full_name || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-main-content" style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
