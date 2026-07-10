import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane, Ship, BarChart3, Database, Route, TrendingUp,
  ArrowRight, Shield, Zap, Globe, ChevronDown, Activity,
  Users, Package, Calendar, CheckCircle, Star, ExternalLink
} from 'lucide-react';

const stats = [
  { value: '12+', label: 'Airports Tracked', icon: Plane, color: '#6366f1' },
  { value: '8+', label: 'Ports Monitored', icon: Ship, color: '#06b6d4' },
  { value: '2035', label: 'Forecast Horizon', icon: Calendar, color: '#f59e0b' },
  { value: '95%', label: 'Model Accuracy', icon: Activity, color: '#10b981' },
];

const features = [
  {
    icon: BarChart3,
    title: 'Demand Forecasting',
    description: 'AI-powered passenger and cargo demand models projecting to 2035 using DGCA historical data, economic indicators, and infrastructure capacity.',
    color: '#6366f1',
    tag: 'Core Feature',
  },
  {
    icon: Plane,
    title: 'Airport Intelligence',
    description: 'Deep-dive analytics for every AP airport — Vijayawada, Tirupati, Visakhapatnam and more — with editable capacity assumptions.',
    color: '#06b6d4',
    tag: 'Airports',
  },
  {
    icon: Ship,
    title: 'Port & Freight Analytics',
    description: 'Multi-modal cargo forecasts (road, rail, sea) for Andhra Pradesh ports, helping infrastructure planners allocate resources.',
    color: '#10b981',
    tag: 'Ports',
  },
  {
    icon: Route,
    title: 'Route Recommendations',
    description: 'AI-generated route suggestions ranked by demand score, giving aviation authorities data-backed expansion priorities.',
    color: '#f59e0b',
    tag: 'AI Insights',
  },
  {
    icon: Database,
    title: 'Data Transparency',
    description: 'All data sources — DGCA, data.gov.in, GSTN — catalogued with sync status, so stakeholders can trace every projection.',
    color: '#ec4899',
    tag: 'Open Data',
  },
  {
    icon: Shield,
    title: 'Secure Admin Portal',
    description: 'Role-based access for APADCL and APMB planners to edit parameters, trigger re-forecasts, and export detailed reports.',
    color: '#8b5cf6',
    tag: 'Gov-Grade',
  },
];

const timeline = [
  { year: '2026', event: 'Baseline traffic established from DGCA data', done: true },
  { year: '2028', event: 'Greenfield airports in Bhogapuram & Orvakal operational', done: false },
  { year: '2030', event: 'Capacity pressure threshold crossed at VGA & TIR', done: false },
  { year: '2032', event: 'Multi-modal hub connectivity targets', done: false },
  { year: '2035', event: 'Full 10-year forecast horizon achieved', done: false },
];

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat(s => (s + 1) % stats.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh' }}>
      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 60 ? 'rgba(7, 11, 20, 0.95)' : 'transparent',
        backdropFilter: scrollY > 60 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 60 ? '1px solid var(--c-border)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 2rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}>
              <Plane size={20} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', color: 'var(--c-text)' }}>
                AP Transport
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', marginTop: -2 }}>
                DEMAND INTELLIGENCE
              </div>
            </div>
          </div>
          <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/dashboard" style={{
              padding: '8px 16px', borderRadius: 8,
              color: 'var(--c-text-muted)', fontSize: '0.875rem', fontWeight: 500,
              textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--c-text)'}
            onMouseLeave={e => e.target.style.color = 'var(--c-text-muted)'}
            >
              Public Dashboard
            </Link>
            <Link to="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.875rem', textDecoration: 'none' }}>
              Admin Login
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="hero-grid hero-padding" style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
        paddingTop: 80,
      }}>
        {/* Ambient blobs */}
        <div style={{
          position: 'absolute', top: '15%', left: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', width: '100%' }}>
          <div className="hero-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            {/* Left */}
            <div className="animate-fade-up">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 20,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                marginBottom: '1.5rem',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'pulse-glow 2s infinite' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', fontFamily: 'JetBrains Mono', letterSpacing: '0.05em' }}>
                  APADCL / APMB — GOVT. OF ANDHRA PRADESH
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
                Andhra Pradesh
                <br />
                <span className="gradient-text">Transport Demand</span>
                <br />
                Intelligence Platform
              </h1>

              <p style={{ fontSize: '1.125rem', color: 'var(--c-text-2)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 520 }}>
                AI-driven passenger and cargo demand forecasting for airports and ports across Andhra Pradesh — projecting to <strong style={{ color: 'var(--c-text)' }}>2035</strong> to guide infrastructure investment decisions.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '14px 28px' }}>
                  View Public Dashboard
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '14px 28px' }}>
                  Admin Portal
                </Link>
              </div>

              {/* Trust badges */}
              <div className="trust-badges" style={{ display: 'flex', gap: 20, marginTop: '2.5rem', flexWrap: 'wrap' }}>
                {['DGCA Data', 'data.gov.in', 'APMB Verified'].map(badge => (
                  <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} color="#10b981" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)' }}>{badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Animated stats panel */}
            <div className="animate-fade-up landing-hero-right" style={{ animationDelay: '0.2s' }}>
              <div style={{ position: 'relative' }}>
                {/* Main card */}
                <div style={{
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 24,
                  padding: '2rem',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Forecast Overview · 2035
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1,2,3].map(d => (
                        <div key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: d === 1 ? '#ef4444' : d === 2 ? '#f59e0b' : '#10b981' }} />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {stats.map((s, i) => (
                      <div key={s.label} style={{
                        padding: '1rem',
                        background: i === currentStat ? `rgba(${s.color === '#6366f1' ? '99,102,241' : s.color === '#06b6d4' ? '6,182,212' : s.color === '#f59e0b' ? '245,158,11' : '16,185,129'}, 0.08)` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${i === currentStat ? s.color + '40' : 'var(--c-border)'}`,
                        borderRadius: 12,
                        transition: 'all 0.4s ease',
                      }}>
                        <s.icon size={18} color={s.color} style={{ marginBottom: 8 }} />
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>{s.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mini chart bars */}
                  <div style={{ background: 'var(--c-surface-2)', borderRadius: 10, padding: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Passenger Growth Projection</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
                      {[30, 42, 55, 48, 63, 75, 68, 82, 90, 100].map((h, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: '100%',
                            height: `${h}%`,
                            borderRadius: 4,
                            background: i === 9
                              ? 'linear-gradient(to top, #6366f1, #818cf8)'
                              : `rgba(99,102,241,${0.2 + i * 0.07})`,
                          }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>2026</span>
                      <span style={{ fontSize: '0.65rem', color: '#818cf8', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>2035</span>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div style={{
                  position: 'absolute', top: -16, right: -16,
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  padding: '8px 16px', borderRadius: 20,
                  boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={14} color="white" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>+187% by 2035</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          animation: 'float 2s ease-in-out infinite',
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Explore</span>
          <ChevronDown size={18} color="var(--c-text-muted)" />
        </div>
      </section>

      {/* ── WHAT IS THIS ── */}
      <section className="section-padding" style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="tag" style={{ marginBottom: '1rem' }}>ABOUT THE PLATFORM</div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            What is AP Transport Intelligence?
          </h2>
          <p style={{ color: 'var(--c-text-muted)', maxWidth: 640, margin: '0 auto', lineHeight: 1.8, fontSize: '1.05rem' }}>
            A unified platform that aggregates public transport data, applies machine-learning forecasting models, and gives government planners a single view of where Andhra Pradesh's aviation and maritime infrastructure needs to go.
          </p>
        </div>

        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {features.map((f, i) => (
            <div key={f.title} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: f.color + '18',
                border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                <f.icon size={22} color={f.color} />
              </div>
              <div className="tag" style={{ marginBottom: '0.75rem', background: f.color + '18', color: f.color, borderColor: f.color + '30' }}>{f.tag}</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--c-text)' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--c-text-muted)', lineHeight: 1.7 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section style={{ padding: '4rem 2rem 6rem', background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="tag" style={{ marginBottom: '1rem' }}>FORECAST MILESTONES</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              2026 → 2035 Roadmap
            </h2>
          </div>
          <div style={{ position: 'relative' }}>
            {/* Line */}
            <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--c-border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {timeline.map((t, i) => (
                <div key={t.year} style={{ display: 'flex', gap: '2rem', paddingLeft: 52, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 11, top: 4,
                    width: 20, height: 20, borderRadius: '50%',
                    background: t.done ? '#10b981' : 'var(--c-surface-2)',
                    border: `2px solid ${t.done ? '#10b981' : 'var(--c-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {t.done && <CheckCircle size={12} color="white" />}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, marginBottom: 4 }}>{t.year}</div>
                    <div style={{ color: 'var(--c-text-2)', fontSize: '0.9rem' }}>{t.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(99,102,241,0.35)',
          }}>
            <Globe size={30} color="white" />
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Explore the platform
          </h2>
          <p style={{ color: 'var(--c-text-muted)', marginBottom: '2.5rem', fontSize: '1.05rem', lineHeight: 1.7 }}>
            The public dashboard is open to all citizens and stakeholders. Government officials can log in to the admin portal to manage forecasts and export reports.
          </p>
          <div className="cta-buttons" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '1rem' }}>
              <BarChart3 size={18} />
              Open Public Dashboard
            </Link>
            <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '1rem' }}>
              <Shield size={18} />
              Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--c-border)', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--c-text-muted)', fontSize: '0.8rem' }}>
          © 2026 Government of Andhra Pradesh &nbsp;·&nbsp; APADCL / APMB &nbsp;·&nbsp; All data sourced from public datasets
        </p>
      </footer>
    </div>
  );
}
