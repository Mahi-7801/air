import { useState, useEffect, useRef } from 'react';
import { X, Plane, Clock, MapPin, Gauge, ArrowUpRight, Cloud, Radio, Navigation } from 'lucide-react';

export default function FlightModeModal({ flight, onClose }) {
  const [phase, setPhase] = useState('intro');
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const flightNo = flight?.flight?.iata || flight?.flight?.icao || 'N/A';
  const airline = flight?.airline?.name || 'Unknown Airline';
  const depAirport = flight?.departure?.airport || 'AP Region';
  const depIata = flight?.departure?.iata || 'AP';
  const posLabel = flight?.live?.position_label || 'Unknown Position';
  const arrAirport = flight?.arrival?.airport || posLabel;
  const arrIata = flight?.arrival?.iata || '---';
  const depTime = flight?.departure?.scheduled ? new Date(flight.departure.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live';
  const arrTime = flight?.arrival?.scheduled ? new Date(flight.arrival.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Alt: ${flight?.live?.altitude ? Math.round(flight.live.altitude * 3.28084).toLocaleString() + ' ft' : 'N/A'}`;
  const altitude = flight?.live?.altitude ? Math.round(flight.live.altitude * 3.28084) : null;
  const speed = flight?.live?.speed_horizontal || null;
  const heading = flight?.live?.direction != null ? Math.round(flight.live.direction) : null;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('takeoff'), 800);
    const t2 = setTimeout(() => setPhase('cruise'), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase === 'cruise') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(interval); return 100; }
          return p + 0.8;
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    let frame = 0;
    const clouds = Array.from({ length: 12 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.55 + 10,
      r: 30 + Math.random() * 50,
      speed: 0.2 + Math.random() * 0.4,
      opacity: 0.04 + Math.random() * 0.06,
    }));

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.45,
      r: 0.5 + Math.random() * 1.2,
      twinkle: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.35, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      stars.forEach(s => {
        const alpha = 0.3 + 0.3 * Math.sin(frame * 0.02 + s.twinkle);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,210,240,${alpha})`;
        ctx.fill();
      });

      clouds.forEach(c => {
        c.x += c.speed;
        if (c.x - c.r > w) c.x = -c.r;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        g.addColorStop(0, `rgba(148,163,184,${c.opacity * 1.5})`);
        g.addColorStop(1, 'rgba(148,163,184,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      });

      const padX = w * 0.1;
      const startX = padX;
      const endX = w - padX;
      const groundY = h * 0.78;
      const cpY = h * 0.1;
      const t = Math.min(progress / 100, 1);

      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 2) {
        const gh = groundY + Math.sin(x * 0.015 + frame * 0.008) * 3 + Math.sin(x * 0.006) * 5;
        ctx.lineTo(x, gh);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const gGrad = ctx.createLinearGradient(0, groundY, 0, h);
      gGrad.addColorStop(0, 'rgba(16,185,129,0.08)');
      gGrad.addColorStop(1, 'rgba(16,185,129,0.01)');
      ctx.fillStyle = gGrad;
      ctx.fill();

      const bezX = (s) => (1 - s) * (1 - s) * startX + 2 * (1 - s) * s * ((startX + endX) / 2) + s * s * endX;
      const bezY = (s) => (1 - s) * (1 - s) * groundY + 2 * (1 - s) * s * cpY + s * s * groundY;

      if (t > 0.02) {
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const st = Math.min(i / 100, t);
          const x = bezX(st);
          const y = bezY(st);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(99,102,241,0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (let i = 1; i <= 50; i++) {
        const st = i / 50;
        if (st > t) break;
        const sx = bezX(st);
        const sy = bezY(st);
        const alpha = 0.2 * (1 - (t - st) / Math.max(t, 0.01));
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(alpha, 0.02)})`;
        ctx.fill();
      }

      const dotRadius = 5;
      [{ x: startX, color: '#6366f1', glow: 'rgba(99,102,241,0.3)' },
       { x: endX, color: '#10b981', glow: 'rgba(16,185,129,0.3)' }].forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, groundY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(d.x, groundY, dotRadius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = d.glow;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      ctx.font = 'bold 12px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#818cf8';
      ctx.fillText(depIata, startX, groundY + 22);
      ctx.fillStyle = '#34d399';
      ctx.fillText(arrIata === '---' ? 'DEST' : arrIata, endX, groundY + 22);

      if (t > 0.005) {
        const px = bezX(t);
        const py = bezY(t);
        const prevT = Math.max(t - 0.008, 0);
        const prevX = bezX(prevT);
        const prevY = bezY(prevT);
        const angle = Math.atan2(py - prevY, px - prevX);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);

        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
        glow.addColorStop(0, 'rgba(99,102,241,0.35)');
        glow.addColorStop(1, 'rgba(99,102,241,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        ctx.strokeStyle = 'rgba(99,102,241,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-6, -5);
        ctx.lineTo(-18, -13);
        ctx.lineTo(-15, -6);
        ctx.closePath();
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-6, 5);
        ctx.lineTo(-18, 13);
        ctx.lineTo(-15, 6);
        ctx.closePath();
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-16, -4);
        ctx.lineTo(-16, 4);
        ctx.closePath();
        ctx.fillStyle = 'rgba(148,163,184,0.5)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(20, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(20, 0, 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(251,191,36,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      frame++;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [progress, phase]);

  const handleClose = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fm-fadein 0.3s ease',
      padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: 560,
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.4)',
        animation: 'motion-spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}>
        <button onClick={handleClose} style={{
          position: 'absolute', top: 8, right: 8, zIndex: 20,
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(148,163,184,0.1)', border: '1px solid var(--c-border)',
          color: 'var(--c-text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
        >
          <X size={15} />
        </button>

        <canvas ref={canvasRef} style={{ width: '100%', height: 220, display: 'block' }} />

        <div style={{ padding: '1rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(99,102,241,0.25)',
              }}>
                <Plane size={16} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
                  {flightNo}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)' }}>{airline}</div>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14,
              background: phase === 'cruise' ? 'rgba(16,185,129,0.1)' : phase === 'takeoff' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
              border: `1px solid ${phase === 'cruise' ? 'rgba(16,185,129,0.25)' : phase === 'takeoff' ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.25)'}`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: phase === 'cruise' ? '#10b981' : phase === 'takeoff' ? '#f59e0b' : '#6366f1', animation: 'pulse-glow 1.5s infinite' }} />
              <span style={{ fontSize: '0.6rem', fontWeight: 700, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', color: phase === 'cruise' ? '#34d399' : phase === 'takeoff' ? '#fbbf24' : '#818cf8' }}>
                {phase === 'intro' ? 'Init' : phase === 'takeoff' ? 'Departing' : progress >= 100 ? 'Arrived' : 'In Flight'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center', background: 'var(--c-surface-2)', padding: '0.6rem 0.875rem', borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: '0.55rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>FROM</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#818cf8', fontFamily: 'Space Grotesk' }}>{depIata}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }} title={depAirport}>{depAirport}</div>
              <div style={{ fontSize: '0.6rem', color: '#34d399', fontFamily: 'JetBrains Mono', marginTop: 2 }}>{depTime}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 0.5rem' }}>
              <div style={{ width: 60, height: 2, background: 'var(--c-surface-3)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #06b6d4)', borderRadius: 1, transition: 'width 0.1s' }} />
              </div>
              <div style={{ fontSize: '0.5rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>{Math.round(progress)}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>TO</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399', fontFamily: 'Space Grotesk' }}>{arrIata}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140, marginLeft: 'auto' }} title={arrAirport}>{arrAirport}</div>
              <div style={{ fontSize: '0.6rem', color: '#f59e0b', fontFamily: 'JetBrains Mono', marginTop: 2 }}>{arrTime}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[
              { icon: ArrowUpRight, label: 'Altitude', value: altitude ? `${(altitude / 1000).toFixed(1)}K ft` : `${flight?.live?.altitude ? Math.round(flight.live.altitude) + 'm' : 'N/A'}`, color: '#818cf8' },
              { icon: Gauge, label: 'Speed', value: speed ? `${speed} km/h` : (flight?.live?.speed_horizontal ? `${flight.live.speed_horizontal} km/h` : 'N/A'), color: '#22d3ee' },
              { icon: Radio, label: 'Heading', value: heading != null ? `${heading}°` : (flight?.live?.direction != null ? `${Math.round(flight.live.direction)}°` : 'N/A'), color: '#f59e0b' },
              { icon: MapPin, label: 'Position', value: posLabel, color: '#34d399' },
            ].map((item, idx) => (
              <div key={item.label} style={{
                background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
                borderRadius: 8, padding: '0.5rem', textAlign: 'center',
                animation: `motion-stagger 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.1 + idx * 0.08}s both`,
              }}>
                <item.icon size={13} color={item.color} style={{ marginBottom: 2 }} />
                <div style={{ fontSize: '0.5rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>{item.label}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: item.color, fontFamily: 'Space Grotesk' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
