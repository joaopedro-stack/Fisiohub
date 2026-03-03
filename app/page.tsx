import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function HomePage() {
  const session = await auth()

  if (session) {
    if (session.user.role === 'SUPER_ADMIN') redirect('/admin')
    redirect('/dashboard')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream: #F4EFE6;
          --cream-dark: #EDE6D9;
          --forest: #1A3329;
          --forest-mid: #2D5542;
          --forest-light: #4A8C6A;
          --gold: #C8922A;
          --gold-light: #E8B84B;
          --sage: #8FB89A;
          --text: #111A15;
          --muted: #6B7D73;
          --white: #FDFAF6;
        }

        .lp { font-family: 'Syne', sans-serif; background: var(--cream); color: var(--text); overflow-x: hidden; }
        .serif { font-family: 'DM Serif Display', serif; }

        /* ── Header ── */
        .header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          background: rgba(244,239,230,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(26,51,41,0.08);
        }
        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-mark {
          width: 36px; height: 36px; background: var(--forest);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
        }
        .logo-mark svg { width: 20px; height: 20px; }
        .logo-text { font-size: 18px; font-weight: 700; color: var(--text); letter-spacing: -0.5px; }
        .logo-text span { color: var(--forest-light); }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        .btn-ghost {
          padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: var(--forest); text-decoration: none; border: 1.5px solid transparent;
          transition: all 0.2s; font-family: 'Syne', sans-serif; cursor: pointer;
          background: transparent;
        }
        .btn-ghost:hover { border-color: var(--forest); background: rgba(26,51,41,0.06); }
        .btn-primary {
          padding: 9px 22px; border-radius: 8px; font-size: 14px; font-weight: 600;
          background: var(--forest); color: var(--white); text-decoration: none;
          transition: all 0.2s; font-family: 'Syne', sans-serif; border: 1.5px solid var(--forest);
          display: flex; align-items: center; gap: 6px;
        }
        .btn-primary:hover { background: var(--forest-mid); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,51,41,0.25); }
        .btn-plans {
          padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: var(--muted); text-decoration: none; border: 1.5px solid var(--cream-dark);
          transition: all 0.2s; font-family: 'Syne', sans-serif; position: relative;
          background: transparent; cursor: not-allowed;
          display: flex; align-items: center; gap: 8px;
        }
        .badge-soon {
          font-size: 10px; font-weight: 700; background: var(--gold-light);
          color: var(--forest); padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px;
        }

        /* ── Hero ── */
        .hero {
          min-height: 100vh;
          padding: 140px 48px 80px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
          background: var(--cream);
          background-image:
            radial-gradient(ellipse at 80% 20%, rgba(74,140,106,0.15) 0%, transparent 55%),
            radial-gradient(ellipse at 10% 90%, rgba(200,146,42,0.1) 0%, transparent 50%);
        }
        .hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          color: var(--forest-light); margin-bottom: 28px;
        }
        .hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--forest-light); }
        .hero-h1 {
          font-size: clamp(42px, 5.5vw, 72px); line-height: 1.05; letter-spacing: -2px;
          color: var(--text); margin-bottom: 24px;
        }
        .hero-h1 em { color: var(--forest-mid); font-style: italic; }
        .hero-sub {
          font-size: 17px; line-height: 1.7; color: var(--muted);
          max-width: 440px; margin-bottom: 40px; font-weight: 400;
        }
        .hero-ctas { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .btn-hero-primary {
          padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700;
          background: var(--forest); color: var(--white); text-decoration: none;
          transition: all 0.25s; font-family: 'Syne', sans-serif;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-hero-primary:hover { background: var(--forest-mid); transform: translateY(-2px); box-shadow: 0 10px 32px rgba(26,51,41,0.3); }
        .btn-hero-ghost {
          padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 600;
          color: var(--text); text-decoration: none; border: 1.5px solid rgba(26,51,41,0.2);
          transition: all 0.25s; font-family: 'Syne', sans-serif; background: transparent;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-hero-ghost:hover { border-color: var(--forest); background: rgba(26,51,41,0.04); }
        .hero-trust { margin-top: 48px; display: flex; align-items: center; gap: 24px; }
        .hero-trust-text { font-size: 13px; color: var(--muted); font-weight: 500; }
        .hero-trust-avatars { display: flex; }
        .hero-trust-avatar {
          width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--cream);
          background: var(--forest-light); margin-left: -8px; display: flex;
          align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: 700;
        }
        .hero-trust-avatar:first-child { margin-left: 0; }
        .hero-trust-avatar:nth-child(2) { background: var(--forest); }
        .hero-trust-avatar:nth-child(3) { background: var(--gold); }

        /* ── Dashboard Preview ── */
        .preview-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
        .preview-card {
          width: 100%; max-width: 480px;
          background: var(--white);
          border-radius: 20px;
          box-shadow: 0 24px 80px rgba(26,51,41,0.15), 0 4px 16px rgba(26,51,41,0.08);
          overflow: hidden;
          border: 1px solid rgba(26,51,41,0.08);
          animation: floatCard 5s ease-in-out infinite;
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
        .preview-bar {
          background: var(--forest); padding: 14px 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .preview-bar-dot { width: 8px; height: 8px; border-radius: 50%; }
        .preview-bar-title { margin-left: auto; font-size: 12px; color: rgba(255,255,255,0.6); font-family: 'Syne', sans-serif; }
        .preview-body { padding: 20px; }
        .preview-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
        .preview-stat {
          background: var(--cream); border-radius: 10px; padding: 12px;
          border: 1px solid var(--cream-dark);
        }
        .preview-stat-val { font-size: 20px; font-weight: 800; color: var(--forest); font-family: 'Syne', sans-serif; }
        .preview-stat-label { font-size: 10px; color: var(--muted); font-weight: 500; margin-top: 2px; }
        .preview-list { display: flex; flex-direction: column; gap: 8px; }
        .preview-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          background: var(--cream); border: 1px solid var(--cream-dark);
        }
        .preview-item-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .preview-item-info { flex: 1; }
        .preview-item-name { font-size: 12px; font-weight: 600; color: var(--text); }
        .preview-item-time { font-size: 10px; color: var(--muted); }
        .preview-item-badge {
          font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px;
        }
        .badge-green { background: #D4EDDA; color: #1A5C35; }
        .badge-amber { background: #FFF3CD; color: #7A4F00; }
        .badge-blue { background: #D0E8FF; color: #1A4A7A; }

        .floating-chip {
          position: absolute;
          background: white;
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: 0 8px 32px rgba(26,51,41,0.15);
          border: 1px solid rgba(26,51,41,0.08);
          display: flex; align-items: center; gap: 8px;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600; color: var(--text);
        }
        .chip-1 { top: -20px; right: -20px; animation: floatChip 4s ease-in-out infinite; }
        .chip-2 { bottom: 20px; left: -30px; animation: floatChip 4s ease-in-out 1.5s infinite; }
        @keyframes floatChip {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .chip-icon { font-size: 18px; }
        .chip-val { font-size: 16px; font-weight: 800; color: var(--forest); }

        /* ── Features strip ── */
        .strip {
          background: var(--forest);
          padding: 28px 48px;
          display: flex; align-items: center; justify-content: center;
          gap: 0; overflow: hidden;
        }
        .strip-item {
          display: flex; align-items: center; gap: 10px;
          padding: 0 36px; border-right: 1px solid rgba(255,255,255,0.1);
          white-space: nowrap;
        }
        .strip-item:last-child { border-right: none; }
        .strip-icon { font-size: 18px; }
        .strip-text { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); }

        /* ── Features main ── */
        .features { padding: 100px 48px; background: var(--white); }
        .section-tag {
          font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
          color: var(--forest-light); margin-bottom: 16px;
        }
        .section-title {
          font-size: clamp(32px, 4vw, 52px); letter-spacing: -1.5px; line-height: 1.1;
          color: var(--text); margin-bottom: 16px;
        }
        .section-sub { font-size: 17px; color: var(--muted); max-width: 500px; line-height: 1.7; margin-bottom: 64px; }
        .features-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 2px; background: rgba(26,51,41,0.08); border-radius: 20px; overflow: hidden; }
        .feature-card {
          background: var(--white); padding: 40px;
          transition: all 0.25s;
        }
        .feature-card:hover { background: var(--cream); }
        .feature-num { font-size: 11px; font-weight: 700; color: var(--sage); letter-spacing: 1px; margin-bottom: 20px; }
        .feature-icon-wrap {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--cream); border: 1px solid var(--cream-dark);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 20px;
          transition: all 0.25s;
        }
        .feature-card:hover .feature-icon-wrap { background: var(--forest); }
        .feature-name { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
        .feature-desc { font-size: 15px; color: var(--muted); line-height: 1.65; }

        /* ── Numbers ── */
        .numbers { padding: 100px 48px; background: var(--cream); }
        .numbers-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 2px; background: rgba(26,51,41,0.08); border-radius: 20px; overflow: hidden; }
        .number-card { background: var(--cream); padding: 48px 36px; }
        .number-val {
          font-size: clamp(44px, 5vw, 68px); font-weight: 800; color: var(--forest);
          letter-spacing: -3px; line-height: 1; margin-bottom: 8px;
        }
        .number-val span { color: var(--gold); }
        .number-label { font-size: 15px; color: var(--muted); font-weight: 500; line-height: 1.5; }

        /* ── How it works ── */
        .how { padding: 100px 48px; background: var(--white); }
        .steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 40px; margin-top: 64px; }
        .step { display: flex; flex-direction: column; gap: 16px; }
        .step-num {
          width: 48px; height: 48px; border-radius: 50%; background: var(--forest);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; color: white; font-family: 'Syne', sans-serif;
        }
        .step-line {
          height: 2px; flex: 1; background: linear-gradient(90deg, var(--forest-light), transparent);
          margin-top: 23px;
        }
        .step-header { display: flex; align-items: center; gap: 12px; }
        .step-name { font-size: 18px; font-weight: 700; color: var(--text); }
        .step-desc { font-size: 15px; color: var(--muted); line-height: 1.65; }

        /* ── CTA ── */
        .cta-section {
          padding: 100px 48px;
          background: var(--forest);
          background-image: radial-gradient(ellipse at 30% 50%, rgba(74,140,106,0.3) 0%, transparent 60%),
                            radial-gradient(ellipse at 80% 20%, rgba(200,146,42,0.2) 0%, transparent 50%);
          text-align: center;
        }
        .cta-tag { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--sage); margin-bottom: 24px; }
        .cta-title { font-size: clamp(36px, 5vw, 64px); letter-spacing: -2px; line-height: 1.05; color: var(--white); margin-bottom: 20px; }
        .cta-sub { font-size: 17px; color: rgba(255,255,255,0.6); max-width: 440px; margin: 0 auto 48px; line-height: 1.7; }
        .cta-actions { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .btn-cta-primary {
          padding: 16px 36px; border-radius: 12px; font-size: 16px; font-weight: 700;
          background: var(--gold-light); color: var(--forest); text-decoration: none;
          transition: all 0.25s; font-family: 'Syne', sans-serif;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-cta-primary:hover { background: #f5ce6a; transform: translateY(-2px); box-shadow: 0 12px 36px rgba(0,0,0,0.3); }
        .btn-cta-ghost {
          padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;
          color: rgba(255,255,255,0.7); text-decoration: none; border: 1.5px solid rgba(255,255,255,0.2);
          transition: all 0.25s; font-family: 'Syne', sans-serif; background: transparent;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-cta-ghost:hover { border-color: rgba(255,255,255,0.5); color: white; }

        /* ── Footer ── */
        .footer {
          background: #0D1F16; padding: 48px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 20px;
        }
        .footer-logo { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.5); font-family: 'Syne', sans-serif; }
        .footer-logo strong { color: rgba(255,255,255,0.85); }
        .footer-copy { font-size: 13px; color: rgba(255,255,255,0.3); }
        .footer-link { font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: rgba(255,255,255,0.7); }
        .footer-links { display: flex; gap: 24px; }

        /* ── Animations on load ── */
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .fade-up-1 { animation: fadeUp 0.8s ease both; }
        .fade-up-2 { animation: fadeUp 0.8s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.8s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.8s 0.45s ease both; }
        .fade-up-5 { animation: fadeUp 0.8s 0.6s ease both; }

        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; padding: 120px 24px 60px; }
          .preview-wrap { display: none; }
          .header { padding: 16px 24px; }
          .strip { flex-direction: column; gap: 12px; padding: 24px; }
          .strip-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 12px 0; width: 100%; justify-content: center; }
          .strip-item:last-child { border-bottom: none; }
          .features { padding: 60px 24px; }
          .features-grid { grid-template-columns: 1fr; }
          .numbers { padding: 60px 24px; }
          .numbers-grid { grid-template-columns: repeat(2,1fr); }
          .how { padding: 60px 24px; }
          .steps { grid-template-columns: 1fr; }
          .step-line { display: none; }
          .cta-section { padding: 60px 24px; }
          .footer { padding: 32px 24px; flex-direction: column; text-align: center; }
          .footer-links { justify-content: center; }
        }
      `}</style>

      <div className="lp">

        {/* ── Header ── */}
        <header className="header">
          <a href="/" className="logo">
            <div className="logo-mark">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2v7M10 11v7M2 10h7M11 10h7" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="10" cy="10" r="2.5" fill="white"/>
              </svg>
            </div>
            <span className="logo-text">Fisio<span>Hub</span></span>
          </a>
          <div className="header-actions">
            <button className="btn-plans" disabled title="Em breve">
              Planos
              <span className="badge-soon">EM BREVE</span>
            </button>
            <Link href="/login" className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Entrar
            </Link>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="hero">
          <div>
            <div className="hero-tag fade-up-1">
              <span className="hero-tag-dot" />
              Plataforma SaaS para Fisioterapia
            </div>
            <h1 className="hero-h1 serif fade-up-2">
              Gestão clínica<br />
              que acompanha<br />
              <em>seu ritmo.</em>
            </h1>
            <p className="hero-sub fade-up-3">
              Agendamentos, prontuários, finanças e comunicação com pacientes — tudo em um só lugar, feito para clínicas de fisioterapia que levam o cuidado a sério.
            </p>
            <div className="hero-ctas fade-up-4">
              <button className="btn-hero-ghost" style={{ cursor: 'not-allowed', opacity: 0.7 }} disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Ver demonstração
              </button>
            </div>
            <div className="hero-trust fade-up-5">
              <div className="hero-trust-avatars">
                <div className="hero-trust-avatar">JS</div>
                <div className="hero-trust-avatar">AM</div>
                <div className="hero-trust-avatar">CP</div>
              </div>
              <p className="hero-trust-text">
                Clínicas de fisioterapia já utilizam a plataforma
              </p>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="preview-wrap fade-up-3">
            <div className="floating-chip chip-1">
              <span className="chip-icon">📅</span>
              <div>
                <div className="chip-val">+34</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>sessões hoje</div>
              </div>
            </div>

            <div className="preview-card">
              <div className="preview-bar">
                <div className="preview-bar-dot" style={{ background: '#FF5F57' }} />
                <div className="preview-bar-dot" style={{ background: '#FFBD2E' }} />
                <div className="preview-bar-dot" style={{ background: '#28C840' }} />
                <span className="preview-bar-title">Dashboard — Clínica Demo</span>
              </div>
              <div className="preview-body">
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginBottom: '10px', fontFamily: 'Syne, sans-serif' }}>VISÃO GERAL DE HOJE</div>
                <div className="preview-stats-row">
                  <div className="preview-stat">
                    <div className="preview-stat-val">12</div>
                    <div className="preview-stat-label">Agendados</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-stat-val" style={{ color: 'var(--gold)' }}>8</div>
                    <div className="preview-stat-label">Confirmados</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-stat-val" style={{ color: 'var(--forest-light)' }}>4</div>
                    <div className="preview-stat-label">Concluídos</div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px', fontFamily: 'Syne, sans-serif' }}>PRÓXIMAS CONSULTAS</div>
                <div className="preview-list">
                  {[
                    { initials: 'MA', name: 'Maria Alves', time: '14:00', status: 'Confirmado', color: '#4A8C6A', badgeClass: 'badge-green' },
                    { initials: 'JC', name: 'João Costa', time: '14:30', status: 'Agendado', color: '#C8922A', badgeClass: 'badge-amber' },
                    { initials: 'LP', name: 'Lúcia Pinto', time: '15:00', status: 'Avaliação', color: '#3A6EA8', badgeClass: 'badge-blue' },
                  ].map((item) => (
                    <div key={item.name} className="preview-item">
                      <div className="preview-item-avatar" style={{ background: item.color }}>{item.initials}</div>
                      <div className="preview-item-info">
                        <div className="preview-item-name">{item.name}</div>
                        <div className="preview-item-time">{item.time} · Dra. Ana Souza</div>
                      </div>
                      <span className={`preview-item-badge ${item.badgeClass}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="floating-chip chip-2">
              <span className="chip-icon">💬</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600 }}>WhatsApp enviado</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>confirmação automática</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Strip ── */}
        <div className="strip">
          {[
            { icon: '📅', text: 'Agendamento inteligente' },
            { icon: '🗂️', text: 'Prontuário digital' },
            { icon: '💰', text: 'Gestão financeira' },
            { icon: '📲', text: 'WhatsApp integrado' },
            { icon: '📊', text: 'Relatórios detalhados' },
            { icon: '🏥', text: 'Multi-clínica' },
          ].map((item) => (
            <div key={item.text} className="strip-item">
              <span className="strip-icon">{item.icon}</span>
              <span className="strip-text">{item.text}</span>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <section className="features">
          <div className="section-tag">Funcionalidades</div>
          <h2 className="section-title serif">Tudo que sua clínica<br />precisa, sem excessos.</h2>
          <p className="section-sub">Desenvolvido com fisioterapeutas reais. Cada funcionalidade existe porque alguém precisou dela.</p>
          <div className="features-grid">
            {[
              {
                num: '01', icon: '📅',
                name: 'Agenda visual',
                desc: 'Visualize todos os agendamentos por fisioterapeuta, sala ou turno. Conflitos detectados automaticamente antes de salvar.',
              },
              {
                num: '02', icon: '📋',
                name: 'Prontuário completo',
                desc: 'Anamnese, evolução de sessão, histórico de atendimentos e exportação em PDF com um clique.',
              },
              {
                num: '03', icon: '💬',
                name: 'WhatsApp automático',
                desc: 'Mensagens de confirmação e lembrete enviadas automaticamente para o paciente via WhatsApp, sem depender de ninguém.',
              },
              {
                num: '04', icon: '💳',
                name: 'Financeiro integrado',
                desc: 'Cobranças, pagamentos, despesas e DRE mensal. Tudo consolidado para você fechar o mês com clareza.',
              },
            ].map((f) => (
              <div key={f.num} className="feature-card">
                <div className="feature-num">{f.num} ——</div>
                <div className="feature-icon-wrap">{f.icon}</div>
                <div className="feature-name">{f.name}</div>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Numbers ── */}
        <section className="numbers">
          <div className="numbers-grid">
            {[
              { val: '100', suffix: '%', label: 'baseado em\nfeedback real' },
              { val: '4', suffix: 'x', label: 'mais rápido que\nplanilhas' },
              { val: '0', suffix: 'h', label: 'de treinamento\npara começar' },
              { val: '1', suffix: '', label: 'plataforma para\ntoda a equipe' },
            ].map((n) => (
              <div key={n.val} className="number-card">
                <div className="number-val">{n.val}<span>{n.suffix}</span></div>
                <div className="number-label" style={{ whiteSpace: 'pre-line' }}>{n.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="how">
          <div className="section-tag">Como funciona</div>
          <h2 className="section-title serif">Sua clínica no ar<br />em minutos.</h2>
          <div className="steps">
            {[
              {
                num: '1',
                name: 'Cadastre sua clínica',
                desc: 'Crie sua conta, configure o horário de funcionamento e adicione sua equipe. Leva menos de 5 minutos.',
              },
              {
                num: '2',
                name: 'Cadastre os pacientes',
                desc: 'Importe ou cadastre seus pacientes com histórico, contato e dados de saúde. Tudo em um lugar.',
              },
              {
                num: '3',
                name: 'Comece a atender',
                desc: 'Agende, registre sessões, envie confirmações pelo WhatsApp e acompanhe as finanças em tempo real.',
              },
            ].map((step, i) => (
              <div key={step.num} className="step">
                <div className="step-header">
                  <div className="step-num">{step.num}</div>
                  {i < 2 && <div className="step-line" />}
                </div>
                <div className="step-name">{step.name}</div>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section">
          <div className="cta-tag">Comece hoje</div>
          <h2 className="cta-title serif">
            Sua clínica merece<br />
            <em style={{ color: 'var(--gold-light)' }}>uma gestão à altura.</em>
          </h2>
          <p className="cta-sub">
            Em breve os planos estarão disponíveis. Por enquanto, explore a plataforma com acesso administrativo.
          </p>
          <div className="cta-actions">
            <Link href="/login" className="btn-cta-primary">
              Acessar plataforma
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <button className="btn-cta-ghost" disabled style={{ cursor: 'not-allowed' }}>
              Ver planos — em breve
            </button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="footer">
          <div className="footer-logo">
            <strong>FisioHub</strong> — Gestão para fisioterapia
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} FisioHub. Todos os direitos reservados.
          </div>
        </footer>

      </div>
    </>
  )
}
