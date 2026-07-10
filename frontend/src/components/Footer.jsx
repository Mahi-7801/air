export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--c-border)',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      background: 'rgba(15,23,42,0.5)',
    }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
        © 2026 Government of Andhra Pradesh — APADCL / APMB
      </p>
      <p style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontFamily: 'JetBrains Mono' }}>
        Demand Forecasting Platform v1.0
      </p>
    </footer>
  );
}
