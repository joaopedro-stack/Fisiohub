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
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink:      #0B1C13;
          --ink-soft: #344B3C;
          --muted:    #718C7C;
          --border:   #D6E4DC;
          --surface:  #F2F7F4;
          --white:    #FFFFFF;
          --green:    #1A6B3C;
          --green-2:  #2D9459;
          --green-3:  #5FBF86;
          --lime:     #C6F135;
          --gold:     #E8A835;
          --dark:     #07140E;
        }

        .lp { font-family: 'Bricolage Grotesque', sans-serif; background: var(--white); color: var(--ink); -webkit-font-smoothing: antialiased; }

        /* ─── HEADER ─── */
        .nav {
          position: fixed; inset: 0 0 auto 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 56px; height: 68px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px) saturate(1.8);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-logo-icon {
          width: 34px; height: 34px; border-radius: 9px; background: var(--ink);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .nav-logo-icon svg { width: 17px; height: 17px; }
        .nav-logo-name { font-size: 17px; font-weight: 800; color: var(--ink); letter-spacing: -0.5px; }
        .nav-logo-name b { color: var(--green-2); }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .nav-plans-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
          color: var(--ink-soft); text-decoration: none; border: 1.5px solid var(--border);
          font-family: inherit; background: var(--white); cursor: pointer;
          transition: all .18s;
        }
        .nav-plans-btn:hover { border-color: var(--green-3); color: var(--green); }
        .nav-enter-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 700;
          color: var(--white); background: var(--green); border: none;
          text-decoration: none; font-family: inherit; transition: all .18s;
        }
        .nav-enter-btn:hover { background: var(--green-2); box-shadow: 0 4px 18px rgba(26,107,60,.35); transform: translateY(-1px); }

        /* ─── HERO ─── */
        .hero {
          min-height: 100vh;
          display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 0;
          padding-top: 68px;
        }
        .hero-left {
          display: flex; flex-direction: column; justify-content: center;
          padding: 80px 56px 80px 56px;
          background: var(--white);
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 100px; padding: 6px 14px 6px 10px;
          font-size: 12px; font-weight: 700; color: var(--green);
          letter-spacing: 0.8px; text-transform: uppercase;
          margin-bottom: 32px; width: fit-content;
        }
        .hero-eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green-3); }
        .hero-h1 {
          font-size: clamp(44px, 5.5vw, 74px); font-weight: 800;
          line-height: 1.04; letter-spacing: -2.5px; color: var(--ink);
          margin-bottom: 24px;
        }
        .hero-h1 .accent { color: var(--green); }
        .hero-h1 .block {
          display: inline-block; background: var(--lime); color: var(--ink);
          padding: 0 12px 4px; border-radius: 8px; line-height: 1.15;
        }
        .hero-sub {
          font-size: 18px; font-weight: 400; line-height: 1.7;
          color: var(--muted); max-width: 460px; margin-bottom: 44px;
        }
        .hero-actions { display: flex; flex-direction: column; gap: 16px; }
        .btn-main {
          display: inline-flex; align-items: center; gap: 8px; width: fit-content;
          padding: 15px 32px; border-radius: 12px; font-size: 16px; font-weight: 700;
          background: var(--ink); color: var(--white); text-decoration: none;
          font-family: inherit; transition: all .2s;
        }
        .btn-main:hover { background: var(--dark); transform: translateY(-2px); box-shadow: 0 12px 36px rgba(11,28,19,.25); }
        .hero-note { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
        .hero-note svg { color: var(--green-3); }
        .hero-right {
          display: flex; align-items: center; justify-content: center;
          background: var(--dark);
          background-image: radial-gradient(ellipse at 20% 40%, rgba(45,148,89,.2) 0%, transparent 60%),
                            radial-gradient(ellipse at 80% 80%, rgba(232,168,53,.12) 0%, transparent 50%);
          padding: 60px 48px;
          position: relative; overflow: hidden;
        }
        .hero-right::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* ─── DASHBOARD PREVIEW ─── */
        .dash-card {
          width: 100%; max-width: 400px; position: relative; z-index: 1;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12);
          border-radius: 18px; overflow: hidden;
          backdrop-filter: blur(12px);
          box-shadow: 0 32px 80px rgba(0,0,0,.5);
          animation: floatDash 6s ease-in-out infinite;
        }
        @keyframes floatDash {
          0%,100% { transform: translateY(0) rotateY(-2deg); }
          50% { transform: translateY(-14px) rotateY(2deg); }
        }
        .dash-bar {
          padding: 14px 16px; display: flex; align-items: center; gap: 6px;
          border-bottom: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.04);
        }
        .dash-dot { width: 9px; height: 9px; border-radius: 50%; }
        .dash-title { margin-left: auto; font-size: 11px; color: rgba(255,255,255,.4); font-weight: 500; }
        .dash-body { padding: 18px; }
        .dash-section-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,.35); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
        .dash-kpis { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 16px; }
        .dash-kpi {
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px; padding: 12px 10px;
        }
        .dash-kpi-val { font-size: 22px; font-weight: 800; color: #fff; line-height: 1; }
        .dash-kpi-label { font-size: 10px; color: rgba(255,255,255,.4); margin-top: 4px; font-weight: 500; }
        .dash-rows { display: flex; flex-direction: column; gap: 7px; }
        .dash-row {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07);
          border-radius: 10px; padding: 9px 11px;
        }
        .dash-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; color: white;
        }
        .dash-row-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.85); }
        .dash-row-sub { font-size: 10px; color: rgba(255,255,255,.35); }
        .dash-pill {
          margin-left: auto; font-size: 10px; font-weight: 700;
          padding: 3px 9px; border-radius: 100px;
        }
        .pill-green { background: rgba(95,191,134,.18); color: #5FBF86; }
        .pill-amber { background: rgba(232,168,53,.18); color: #E8A835; }
        .pill-blue  { background: rgba(99,160,232,.18); color: #63A0E8; }

        .hero-chip {
          position: absolute; z-index: 2;
          background: white; border-radius: 12px; padding: 10px 14px;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,.25);
          font-size: 12px; font-weight: 700; color: var(--ink);
        }
        .chip-top { top: 80px; right: 40px; animation: chipFloat 4s ease-in-out infinite; }
        .chip-bot { bottom: 100px; left: 30px; animation: chipFloat 4s ease-in-out 1.8s infinite; }
        @keyframes chipFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .chip-emoji { font-size: 20px; line-height: 1; }
        .chip-val { font-size: 17px; font-weight: 800; color: var(--green); }

        /* ─── MARQUEE STRIP ─── */
        .strip {
          background: var(--ink); overflow: hidden;
          padding: 18px 0; border-top: 1px solid rgba(255,255,255,.06);
        }
        .strip-track {
          display: flex; gap: 0; white-space: nowrap;
          animation: marquee 22s linear infinite;
        }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .strip-item {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 0 40px; border-right: 1px solid rgba(255,255,255,.1);
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,.55);
          white-space: nowrap; flex-shrink: 0;
        }
        .strip-item:last-child { border-right: none; }
        .strip-icon { font-size: 16px; }

        /* ─── FEATURES ─── */
        .features { padding: 110px 56px; background: var(--surface); }
        .features-header { max-width: 680px; margin-bottom: 64px; }
        .label-tag {
          display: inline-block; font-size: 11px; font-weight: 800;
          letter-spacing: 2px; text-transform: uppercase;
          color: var(--green); margin-bottom: 18px;
        }
        .sec-h2 {
          font-size: clamp(32px, 4vw, 52px); font-weight: 800;
          letter-spacing: -2px; line-height: 1.08; color: var(--ink);
          margin-bottom: 16px;
        }
        .sec-p { font-size: 17px; color: var(--muted); line-height: 1.7; }
        .feat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
        .feat-card {
          background: var(--white); border: 1.5px solid var(--border);
          border-radius: 18px; padding: 36px;
          transition: all .22s; display: flex; flex-direction: column; gap: 16px;
        }
        .feat-card:hover { border-color: var(--green-3); box-shadow: 0 8px 40px rgba(26,107,60,.1); transform: translateY(-3px); }
        .feat-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: var(--surface); border: 1.5px solid var(--border);
          display: flex; align-items: center; justify-content: center; font-size: 24px;
          transition: all .22s;
        }
        .feat-card:hover .feat-icon { background: var(--ink); border-color: var(--ink); }
        .feat-title { font-size: 19px; font-weight: 800; color: var(--ink); letter-spacing: -0.5px; }
        .feat-desc { font-size: 15px; color: var(--muted); line-height: 1.7; }

        /* ─── NUMBERS ─── */
        .numbers { padding: 100px 56px; background: var(--white); }
        .numbers-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
        .numbers-left .sec-h2 { margin-bottom: 20px; }
        .numbers-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .num-card {
          background: var(--surface); border: 1.5px solid var(--border);
          border-radius: 16px; padding: 28px 24px;
        }
        .num-val {
          font-size: clamp(40px, 4.5vw, 58px); font-weight: 800;
          letter-spacing: -2.5px; line-height: 1; color: var(--ink); margin-bottom: 6px;
        }
        .num-val em { color: var(--green); font-style: normal; }
        .num-lbl { font-size: 14px; color: var(--muted); font-weight: 500; line-height: 1.5; }

        /* ─── HOW ─── */
        .how {
          padding: 100px 56px;
          background: var(--dark);
          background-image: radial-gradient(ellipse at 10% 50%, rgba(45,148,89,.15) 0%, transparent 55%),
                            radial-gradient(ellipse at 90% 20%, rgba(198,241,53,.06) 0%, transparent 50%);
        }
        .how-grid { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 80px; align-items: center; }
        .how-steps { display: flex; flex-direction: column; gap: 0; }
        .how-step {
          display: flex; gap: 20px; padding: 28px 0;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }
        .how-step:last-child { border-bottom: none; }
        .how-step-num {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: var(--green-3);
        }
        .how-step-body { flex: 1; }
        .how-step-name { font-size: 17px; font-weight: 700; color: rgba(255,255,255,.9); margin-bottom: 6px; }
        .how-step-desc { font-size: 14px; color: rgba(255,255,255,.4); line-height: 1.65; }
        .how-right {}
        .how-h2 { font-size: clamp(34px,4vw,52px); font-weight: 800; letter-spacing: -2px; line-height: 1.08; color: white; margin-bottom: 20px; }
        .how-h2 .lime { color: var(--lime); }
        .how-sub { font-size: 17px; color: rgba(255,255,255,.45); line-height: 1.7; max-width: 420px; margin-bottom: 40px; }
        .btn-white {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700;
          background: white; color: var(--ink); text-decoration: none;
          font-family: inherit; transition: all .2s;
        }
        .btn-white:hover { background: var(--lime); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.4); }

        /* ─── CTA ─── */
        .cta {
          padding: 120px 56px; background: var(--white); text-align: center;
          background-image: radial-gradient(ellipse at 50% 100%, rgba(26,107,60,.08) 0%, transparent 70%);
        }
        .cta-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--surface); border: 1.5px solid var(--border);
          border-radius: 100px; padding: 6px 16px 6px 10px;
          font-size: 12px; font-weight: 700; color: var(--green);
          letter-spacing: 0.6px; margin-bottom: 32px;
        }
        .cta-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green-3); animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.7} }
        .cta-h2 { font-size: clamp(40px,5.5vw,72px); font-weight: 800; letter-spacing: -2.5px; line-height: 1.06; color: var(--ink); margin-bottom: 20px; max-width: 700px; margin-left: auto; margin-right: auto; }
        .cta-h2 .line-accent {
          display: inline; position: relative;
        }
        .cta-h2 .line-accent::after {
          content: ''; position: absolute; left: 0; bottom: -2px;
          width: 100%; height: 4px; background: var(--lime); border-radius: 2px;
        }
        .cta-sub { font-size: 18px; color: var(--muted); line-height: 1.7; max-width: 480px; margin: 0 auto 48px; }
        .cta-btns { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .btn-dark {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 16px 36px; border-radius: 12px; font-size: 16px; font-weight: 700;
          background: var(--ink); color: white; text-decoration: none;
          font-family: inherit; transition: all .2s;
        }
        .btn-dark:hover { background: var(--dark); transform: translateY(-2px); box-shadow: 0 12px 36px rgba(11,28,19,.2); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 30px; border-radius: 12px; font-size: 16px; font-weight: 600;
          color: var(--ink-soft); text-decoration: none; border: 1.5px solid var(--border);
          font-family: inherit; transition: all .2s; background: transparent; cursor: not-allowed; opacity: .65;
        }

        /* ─── FOOTER ─── */
        .footer {
          background: var(--dark); padding: 48px 56px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
          border-top: 1px solid rgba(255,255,255,.06);
        }
        .footer-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .footer-brand-icon {
          width: 28px; height: 28px; border-radius: 7px; background: rgba(255,255,255,.1);
          display: flex; align-items: center; justify-content: center;
        }
        .footer-brand-icon svg { width: 14px; height: 14px; }
        .footer-brand-name { font-size: 15px; font-weight: 700; color: rgba(255,255,255,.6); }
        .footer-copy { font-size: 13px; color: rgba(255,255,255,.25); }

        /* ─── ANIMATIONS ─── */
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .fu1 { animation: fadeUp .75s ease both; }
        .fu2 { animation: fadeUp .75s .12s ease both; }
        .fu3 { animation: fadeUp .75s .24s ease both; }
        .fu4 { animation: fadeUp .75s .36s ease both; }
        .fu5 { animation: fadeUp .75s .48s ease both; }

        /* ─── RESPONSIVE ─── */
        @media(max-width:960px){
          .nav { padding: 0 24px; }
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 80px 24px 48px; }
          .hero-right { display: none; }
          .features { padding: 64px 24px; }
          .feat-grid { grid-template-columns: 1fr; }
          .numbers { padding: 64px 24px; }
          .numbers-inner { grid-template-columns: 1fr; gap: 40px; }
          .how { padding: 64px 24px; }
          .how-grid { grid-template-columns: 1fr; gap: 48px; }
          .cta { padding: 72px 24px; }
          .footer { padding: 36px 24px; flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className="lp">

        {/* ── NAV ── */}
        <nav className="nav">
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">
              <svg viewBox="0 0 17 17" fill="none"><path d="M8.5 2v5.5M8.5 9.5V15M2 8.5h5.5M9.5 8.5H15" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="8.5" cy="8.5" r="2" fill="white"/></svg>
            </div>
            <span className="nav-logo-name">Fisio<b>Hub</b></span>
          </a>
          <div className="nav-right">
            <Link href="/planos" className="nav-plans-btn">
              Planos & Preços
            </Link>
            <Link href="/login" className="nav-enter-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Entrar
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-left">
            <div className="hero-eyebrow fu1">
              <span className="hero-eyebrow-dot" />
              Plataforma para Fisioterapia
            </div>
            <h1 className="hero-h1 fu2">
              Sua clínica,<br />
              <span className="accent">organizada</span><br />
              de verdade.
            </h1>
            <p className="hero-sub fu3">
              Agendamentos, prontuários, financeiro e WhatsApp automático — tudo integrado para você atender mais e administrar menos.
            </p>
            <div className="hero-actions fu4">
              <Link href="/planos" className="btn-main">
                Ver planos e preços
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <p className="hero-note fu5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Sem contrato de fidelidade · Cancele quando quiser
              </p>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-chip chip-top">
              <span className="chip-emoji">📲</span>
              <div>
                <div className="chip-val">WhatsApp</div>
                <div style={{fontSize:'10px',color:'var(--muted)'}}>confirmação enviada</div>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-bar">
                <div className="dash-dot" style={{background:'#FF5F57'}}/>
                <div className="dash-dot" style={{background:'#FFBD2E'}}/>
                <div className="dash-dot" style={{background:'#28C840'}}/>
                <span className="dash-title">dashboard · hoje</span>
              </div>
              <div className="dash-body">
                <div className="dash-section-label">Resumo do dia</div>
                <div className="dash-kpis">
                  <div className="dash-kpi">
                    <div className="dash-kpi-val">12</div>
                    <div className="dash-kpi-label">Agendados</div>
                  </div>
                  <div className="dash-kpi">
                    <div className="dash-kpi-val" style={{color:'#5FBF86'}}>8</div>
                    <div className="dash-kpi-label">Confirmados</div>
                  </div>
                  <div className="dash-kpi">
                    <div className="dash-kpi-val" style={{color:'#E8A835'}}>4</div>
                    <div className="dash-kpi-label">Realizados</div>
                  </div>
                </div>
                <div className="dash-section-label">Próximas consultas</div>
                <div className="dash-rows">
                  {[
                    {i:'MA',n:'Maria Alves',t:'14:00',s:'Confirmado',c:'#2D9459',p:'pill-green'},
                    {i:'JC',n:'João Costa',t:'14:30',s:'Agendado',c:'#C8922A',p:'pill-amber'},
                    {i:'LP',n:'Lúcia Pinto',t:'15:00',s:'Avaliação',c:'#3A6EA8',p:'pill-blue'},
                  ].map(r=>(
                    <div key={r.n} className="dash-row">
                      <div className="dash-avatar" style={{background:r.c}}>{r.i}</div>
                      <div>
                        <div className="dash-row-name">{r.n}</div>
                        <div className="dash-row-sub">{r.t} · Dra. Ana</div>
                      </div>
                      <span className={`dash-pill ${r.p}`}>{r.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hero-chip chip-bot">
              <span className="chip-emoji">💰</span>
              <div>
                <div className="chip-val">R$ 4.280</div>
                <div style={{fontSize:'10px',color:'var(--muted)'}}>receita esse mês</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STRIP ── */}
        <div className="strip">
          <div className="strip-track">
            {[
              {icon:'📅',text:'Agendamento inteligente'},
              {icon:'🗂️',text:'Prontuário digital'},
              {icon:'💬',text:'WhatsApp automático'},
              {icon:'💳',text:'Gestão financeira'},
              {icon:'📊',text:'Relatórios detalhados'},
              {icon:'🏥',text:'Multi-clínica'},
              {icon:'🔐',text:'Acesso por perfil'},
              {icon:'📄',text:'PDF de pacientes'},
              {icon:'📅',text:'Agendamento inteligente'},
              {icon:'🗂️',text:'Prontuário digital'},
              {icon:'💬',text:'WhatsApp automático'},
              {icon:'💳',text:'Gestão financeira'},
              {icon:'📊',text:'Relatórios detalhados'},
              {icon:'🏥',text:'Multi-clínica'},
              {icon:'🔐',text:'Acesso por perfil'},
              {icon:'📄',text:'PDF de pacientes'},
            ].map((item,i)=>(
              <div key={i} className="strip-item">
                <span className="strip-icon">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="features">
          <div className="features-header">
            <div className="label-tag">Funcionalidades</div>
            <h2 className="sec-h2">O que vem dentro<br />do FisioHub.</h2>
            <p className="sec-p">Cada funcionalidade foi desenhada para o fluxo real de uma clínica de fisioterapia. Sem inchaço, sem curva de aprendizado.</p>
          </div>
          <div className="feat-grid">
            {[
              {icon:'📅',title:'Agenda visual completa',desc:'Veja todos os horários por fisioterapeuta, sala ou turno. O sistema detecta conflitos automaticamente antes de confirmar qualquer agendamento.'},
              {icon:'📋',title:'Prontuário e anamnese',desc:'Registro completo de evolução de cada sessão, histórico de atendimentos e ficha de anamnese. Tudo exportável em PDF com um clique.'},
              {icon:'💬',title:'WhatsApp automático',desc:'Mensagem de confirmação e lembrete enviadas direto pelo WhatsApp do paciente, sem depender de ninguém da equipe manualmente.'},
              {icon:'💰',title:'Financeiro integrado',desc:'Cobranças, pagamentos, fluxo de caixa e DRE mensal consolidados. Feche o mês sabendo exatamente quanto entrou e saiu.'},
            ].map(f=>(
              <div key={f.title} className="feat-card">
                <div className="feat-icon">{f.icon}</div>
                <div>
                  <div className="feat-title">{f.title}</div>
                  <p className="feat-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── NUMBERS ── */}
        <section className="numbers">
          <div className="numbers-inner">
            <div className="numbers-left">
              <div className="label-tag">Por que funciona</div>
              <h2 className="sec-h2">Feito para quem atende, não para quem gerencia TI.</h2>
              <p className="sec-p">A plataforma foi construída ouvindo fisioterapeutas reais. Simples de usar no dia a dia, completa quando precisar.</p>
            </div>
            <div className="numbers-grid">
              {[
                {val:'100',suf:'%',lbl:'focado em\nfisioterapia'},
                {val:'0',suf:'h',lbl:'de treinamento\npara começar'},
                {val:'4',suf:'x',lbl:'mais rápido\nque planilhas'},
                {val:'1',suf:'',lbl:'plataforma para\ntoda a equipe'},
              ].map(n=>(
                <div key={n.val} className="num-card">
                  <div className="num-val">{n.val}<em>{n.suf}</em></div>
                  <div className="num-lbl" style={{whiteSpace:'pre-line'}}>{n.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW ── */}
        <section className="how">
          <div className="how-grid">
            <div className="how-right">
              <h2 className="how-h2">Sua clínica no ar<br />em <span className="lime">minutos.</span></h2>
              <p className="how-sub">Sem instalação, sem servidor, sem técnico. Você acessa pelo navegador e começa a usar agora mesmo.</p>
              <Link href="/planos" className="btn-white">
                Escolher meu plano
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
            <div className="how-steps">
              {[
                {n:'01',name:'Crie sua clínica',desc:'Cadastre o nome, horários e adicione sua equipe. Leva menos de 5 minutos para tudo estar configurado.'},
                {n:'02',name:'Cadastre os pacientes',desc:'Adicione os pacientes com histórico, contato e informações de saúde. Importe de planilhas se preferir.'},
                {n:'03',name:'Agende e atenda',desc:'Marque consultas, registre sessões, envie confirmações pelo WhatsApp e acompanhe o financeiro em tempo real.'},
              ].map(s=>(
                <div key={s.n} className="how-step">
                  <div className="how-step-num">{s.n}</div>
                  <div className="how-step-body">
                    <div className="how-step-name">{s.name}</div>
                    <p className="how-step-desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta">
          <div className="cta-badge">
            <span className="cta-badge-dot"/>
            Planos disponíveis
          </div>
          <h2 className="cta-h2">
            Sua clínica merece<br />
            <span className="line-accent">uma gestão à altura.</span>
          </h2>
          <p className="cta-sub">Escolha o plano ideal para o tamanho da sua clínica. Sem fidelidade, sem surpresas na fatura.</p>
          <div className="cta-btns">
            <Link href="/planos" className="btn-dark">
              Ver planos e preços
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <span className="btn-outline">Demonstração — em breve</span>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <a href="/" className="footer-brand">
            <div className="footer-brand-icon">
              <svg viewBox="0 0 14 14" fill="none"><path d="M7 1v4.5M7 8.5V13M1 7h4.5M8.5 7H13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><circle cx="7" cy="7" r="1.6" fill="white"/></svg>
            </div>
            <span className="footer-brand-name">FisioHub</span>
          </a>
          <div className="footer-copy">© {new Date().getFullYear()} FisioHub. Todos os direitos reservados.</div>
        </footer>

      </div>
    </>
  )
}
