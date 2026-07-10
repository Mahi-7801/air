import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { Plane, Eye, EyeOff, ArrowLeft, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@aptransport.gov.in');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        navigate(res.user.role === 'admin' ? '/admin' : '/user-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--c-bg)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'absolute', top: '20%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Left Panel — Branding */}
      <div className="login-left-panel" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 100%)',
        borderRight: '1px solid var(--c-border)',
        position: 'relative',
      }}
      >
        {/* Hero illustration area */}
        <div style={{ maxWidth: 480 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(99,102,241,0.4)',
            marginBottom: '2rem',
          }}>
            <Plane size={26} color="white" />
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1rem' }}>
            AP Transport
            <br />
            <span className="gradient-text">Demand Intelligence</span>
          </h1>

          <p style={{ color: 'var(--c-text-muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
            AI-powered forecasting platform for airports and ports across Andhra Pradesh — projecting to 2035.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: Zap, text: '10-year passenger & cargo demand forecasts', color: '#f59e0b' },
              { icon: Shield, text: 'Role-based access for APADCL / APMB teams', color: '#10b981' },
              { icon: Plane, text: 'Real-time airport & port performance tracking', color: '#6366f1' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: item.color + '18', border: `1px solid ${item.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <item.icon size={16} color={item.color} />
                </div>
                <span style={{ color: 'var(--c-text-2)', fontSize: '0.9rem', lineHeight: 1.5, paddingTop: 6 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div style={{
          position: 'absolute', bottom: '3rem', left: '4rem', right: '4rem',
          display: 'flex', gap: '1.5rem',
        }}>
          {[
            { value: '12+', label: 'Airports' },
            { value: '8+', label: 'Ports' },
            { value: '2035', label: 'Horizon' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '12px 18px', background: 'var(--c-surface)',
              borderRadius: 10, border: '1px solid var(--c-border)', flex: 1, textAlign: 'center',
            }}>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--c-text)', fontFamily: 'Space Grotesk' }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="login-form-panel" style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '2.5rem',
      }}>
        {/* Back to home */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--c-text-muted)', fontSize: '0.8rem', textDecoration: 'none',
          marginBottom: '2.5rem', transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-muted)'}
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>

        {/* Mobile logo */}
        <div className="lg-hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plane size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontFamily: 'Space Grotesk' }}>AP Transport Intelligence</span>
        </div>

        <div className="animate-fade-up">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Sign in to the administrative portal
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171', padding: '12px 16px', borderRadius: 10, fontSize: '0.875rem',
              marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{
                display: 'block', fontSize: '0.7rem', fontWeight: 600,
                color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
              }}>Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@aptransport.gov.in"
                required
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: '0.7rem', fontWeight: 600,
                color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  style={{ paddingRight: 48 }}
                  required
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--c-text-muted)', padding: 4,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem', marginTop: 8 }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                  Signing in…
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Sign In to Portal
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--c-text-muted)', marginTop: '1.5rem' }}>
            Government of Andhra Pradesh — APADCL / APMB
          </p>

          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <Link to="/dashboard" style={{ fontSize: '0.8rem', color: '#818cf8', textDecoration: 'none' }}>
              View public dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
