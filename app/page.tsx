import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import ScrollEffects from '@/components/scroll-effects'

export default async function HomePage() {
  const session = await auth()
  if (session) {
    if (session.user.role === 'SUPER_ADMIN') redirect('/admin')
    redirect('/dashboard')
  }

  const streamRows = [
    {
      dir: 'fwd', dur: '22s',
      items: [
        { t: 'SESSÃO CONFIRMADA · 14:00 · DRA. ANA · LOMBAR', g: true },
        { t: 'NOVO PACIENTE · MARIA SILVA · JOELHO', g: false },
        { t: 'AVALIAÇÃO · 15:30 · DR. PEDRO · OMBRO', g: false },
        { t: 'ALTA MÉDICA · CARLOS SOUZA · COLUNA', g: true },
        { t: 'SESSÃO · 09:00 · DRA. BEATRIZ · QUADRIL', g: false },
        { t: 'RETORNO · 16:00 · DR. LUCAS · TORNOZELO', g: false },
      ],
    },
    {
      dir: 'rev', dur: '32s',
      items: [
        { t: 'R$ 4.280 RECEBIDO · PIX', g: true },
        { t: 'FLUXO DE CAIXA +12%', g: false },
        { t: 'FATURA ENVIADA · R$ 350', g: false },
        { t: 'DRE MENSAL · MARÇO', g: false },
        { t: 'R$ 1.750 · PLANO DE SAÚDE', g: true },
        { t: 'DESPESA REGISTRADA · R$ 890', g: false },
      ],
    },
    {
      dir: 'fwd', dur: '27s',
      items: [
        { t: 'WHATSAPP ENVIADO · CONFIRMAÇÃO', g: false },
        { t: 'PDF GERADO · PRONTUÁRIO', g: false },
        { t: 'LEMBRETE 24H · SESSÃO AMANHÃ', g: true },
        { t: 'AGENDAMENTO ONLINE · SITE DA CLÍNICA', g: false },
        { t: 'ANAMNESE PREENCHIDA', g: false },
        { t: 'RELATÓRIO CSV EXPORTADO', g: true },
      ],
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --void:          #030A06;
          --abyss:         #060F09;
          --deep:          #0C1F12;

          --virid:         #00D46B;
          --virid-dim:     rgba(0,212,107,.12);
          --virid-border:  rgba(0,212,107,.18);
          --lime:          #B8F000;

          --mist:          #8FA898;
          --white:         #F0FAF4;

          --font-display:  'DM Serif Display', Georgia, serif;
          --font-ui:       'Syne', system-ui, sans-serif;
          --font-mono:     'DM Mono', 'Courier New', monospace;

          --glow:          0 0 48px rgba(0,212,107,.28), 0 0 100px rgba(0,212,107,.1);
          --spring:        cubic-bezier(.34,1.56,.64,1);
          --smooth:        cubic-bezier(.4,0,.2,1);
        }

        .lp { font-family: var(--font-ui); background: var(--void); color: var(--white); -webkit-font-smoothing: antialiased; }

        /* ── SCROLL PROGRESS ── */
        #scroll-progress {
          position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 300;
          background: linear-gradient(90deg, var(--virid), var(--lime));
          transform: scaleX(0); transform-origin: left;
        }

        /* ── SCROLL REVEAL ── */
        .sr {
          opacity: 0; transform: translateY(38px);
          transition: opacity .72s var(--smooth), transform .72s var(--smooth);
        }
        .sr.d1 { transition-delay: .1s; }
        .sr.d2 { transition-delay: .2s; }
        .sr.d3 { transition-delay: .3s; }
        .sr.d4 { transition-delay: .4s; }
        .sr.d5 { transition-delay: .5s; }
        .sr-visible { opacity: 1 !important; transform: translateY(0) !important; }

        /* ── NAV ── */
        .nav {
          position: fixed; inset: 0 0 auto 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 60px; height: 62px;
          background: rgba(3,10,6,.82); backdrop-filter: blur(28px) saturate(1.5);
          border-bottom: 1px solid rgba(0,212,107,.07);
        }
        .nav-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }
        .nav-logo-mark {
          width: 31px; height: 31px; border-radius: 8px; background: var(--virid);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .nav-logo-mark svg { width: 15px; height: 15px; }
        .nav-logo-name { font-family: var(--font-ui); font-size: 15.5px; font-weight: 800; color: var(--white); letter-spacing: -.25px; }
        .nav-logo-name b { color: var(--virid); }
        .nav-right { display: flex; align-items: center; gap: 6px; }
        .nav-ghost {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase;
          color: var(--mist); text-decoration: none; padding: 7px 16px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,.07); transition: color .2s, border-color .2s;
        }
        .nav-ghost:hover { color: var(--virid); border-color: var(--virid-border); }
        .nav-cta {
          display: flex; align-items: center; gap: 6px;
          font-family: var(--font-ui); font-size: 13px; font-weight: 700;
          padding: 8px 18px; border-radius: 100px; background: var(--virid); color: var(--void);
          text-decoration: none; transition: transform .25s var(--spring), box-shadow .25s;
        }
        .nav-cta:hover { transform: translateY(-2px); box-shadow: var(--glow); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end;
          padding: 62px 60px 80px; position: relative; overflow: hidden;
        }
        .hero::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(0,212,107,.055) 1px, transparent 1px);
          background-size: 26px 26px;
        }
        .hero::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: repeating-linear-gradient(-54deg, transparent, transparent 90px, rgba(0,212,107,.016) 90px, rgba(0,212,107,.016) 91px);
        }
        .hero-glow-1 {
          position: absolute; width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,107,.1) 0%, transparent 65%);
          top: -150px; right: 0; pointer-events: none; z-index: 0;
        }
        .hero-glow-2 {
          position: absolute; width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(184,240,0,.05) 0%, transparent 70%);
          bottom: 0; left: 8%; pointer-events: none; z-index: 0;
        }
        .hero-panel {
          position: absolute; right: 60px; top: 50%; transform: translateY(-46%);
          z-index: 2; display: flex; flex-direction: column; gap: 10px;
        }
        .hpanel {
          background: rgba(6,15,9,.9); border: 1px solid var(--virid-border); border-radius: 14px;
          padding: 13px 17px; display: flex; align-items: center; gap: 13px;
          backdrop-filter: blur(20px); box-shadow: 0 8px 40px rgba(0,0,0,.45);
        }
        .hpanel-icon { font-size: 20px; line-height: 1; }
        .hpanel-val { font-family: var(--font-ui); font-size: 16px; font-weight: 800; color: var(--virid); line-height: 1; }
        .hpanel-lbl { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--mist); margin-top: 3px; }
        .hpanel-1 { animation: panelFloat 5s ease-in-out infinite; }
        .hpanel-2 { animation: panelFloat 5s 1.9s ease-in-out infinite; }
        .hpanel-3 { animation: panelFloat 5s 3.5s ease-in-out infinite; }
        @keyframes panelFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }

        .hero-content { position: relative; z-index: 1; max-width: 860px; }
        .hero-eyebrow {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase; color: var(--virid);
          display: flex; align-items: center; gap: 14px; margin-bottom: 28px;
        }
        .hero-eyebrow::before { content: ''; width: 36px; height: 1px; background: var(--virid); display: block; flex-shrink: 0; }
        .hero-h1 {
          font-family: var(--font-display); font-size: clamp(56px, 8vw, 112px);
          font-weight: 400; line-height: .91; letter-spacing: -.035em; color: var(--white); margin-bottom: 36px;
        }
        .hero-h1 em { font-style: italic; color: transparent; -webkit-text-stroke: 1.2px rgba(0,212,107,.65); }
        .hero-foot {
          display: flex; align-items: center; gap: 0; row-gap: 28px;
          border-top: 1px solid rgba(0,212,107,.1); padding-top: 32px; flex-wrap: wrap;
        }
        .hero-stat { flex: 1; min-width: 140px; padding-right: 40px; border-right: 1px solid rgba(255,255,255,.06); margin-right: 40px; }
        .hero-stat:last-of-type { border-right: none; }
        .hero-stat-val { font-family: var(--font-ui); font-size: 15px; font-weight: 700; color: var(--white); margin-bottom: 3px; }
        .hero-stat-lbl { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--mist); }
        .hero-actions { display: flex; align-items: center; gap: 10px; margin-left: auto; flex-wrap: wrap; flex-shrink: 0; }
        .btn-hero-primary {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-ui); font-size: 14px; font-weight: 700;
          padding: 13px 28px; border-radius: 100px; background: var(--virid); color: var(--void);
          text-decoration: none; white-space: nowrap; transition: transform .25s var(--spring), box-shadow .25s;
        }
        .btn-hero-primary:hover { transform: translateY(-3px); box-shadow: var(--glow); }
        .btn-hero-ghost {
          display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase;
          color: var(--mist); text-decoration: none; padding: 12px 22px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,.09); transition: color .2s, border-color .2s;
        }
        .btn-hero-ghost:hover { color: var(--virid); border-color: var(--virid-border); }

        /* ── STRIP ── */
        .strip {
          border-top: 1px solid rgba(0,212,107,.07); border-bottom: 1px solid rgba(0,212,107,.07);
          background: var(--abyss); overflow: hidden; padding: 14px 0;
        }
        .strip-track { display: flex; white-space: nowrap; animation: marquee 30s linear infinite; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .strip-item {
          display: inline-flex; align-items: center; gap: 9px; padding: 0 32px;
          border-right: 1px solid rgba(0,212,107,.07); font-family: var(--font-mono);
          font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--mist);
          white-space: nowrap; flex-shrink: 0;
        }
        .s-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--virid); opacity: .5; flex-shrink: 0; }

        /* ── SECTION COMMONS ── */
        .eyebrow-mono {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .2em; text-transform: uppercase; color: var(--virid);
          display: flex; align-items: center; gap: 12px; margin-bottom: 22px;
        }
        .eyebrow-mono::before { content: ''; width: 28px; height: 1px; background: var(--virid); display: block; flex-shrink: 0; }
        .sec-h2 {
          font-family: var(--font-display); font-size: clamp(38px, 4.8vw, 64px);
          font-weight: 400; letter-spacing: -.028em; line-height: .95; color: var(--white); margin-bottom: 18px;
        }
        .sec-h2 em { font-style: italic; color: var(--virid); }
        .sec-p { font-family: var(--font-ui); font-size: 16px; color: var(--mist); line-height: 1.72; }

        /* ── FEATURES ── */
        .features { padding: 120px 60px; background: var(--void); }
        .features-header { max-width: 680px; margin-bottom: 64px; }
        .feat-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          border: 1px solid rgba(0,212,107,.1); border-radius: 20px; overflow: hidden;
          gap: 1px; background: rgba(0,212,107,.07);
        }
        .feat-card {
          background: var(--abyss); padding: 44px 40px;
          display: flex; flex-direction: column; gap: 18px;
          position: relative; overflow: hidden; transition: background .3s;
        }
        .feat-card:hover { background: var(--deep); }
        .feat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--virid), transparent);
          opacity: 0; transition: opacity .35s;
        }
        .feat-card:hover::before { opacity: .55; }
        .feat-num {
          position: absolute; top: 18px; right: 22px;
          font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .15em;
          color: rgba(0,212,107,.3); text-transform: uppercase;
        }
        .feat-icon {
          width: 46px; height: 46px; border-radius: 11px; background: rgba(0,212,107,.07);
          border: 1px solid var(--virid-border); display: flex; align-items: center;
          justify-content: center; font-size: 21px; transition: background .3s;
        }
        .feat-card:hover .feat-icon { background: rgba(0,212,107,.14); }
        .feat-title { font-family: var(--font-ui); font-size: 19px; font-weight: 700; color: var(--white); letter-spacing: -.3px; }
        .feat-desc { font-size: 14.5px; color: var(--mist); line-height: 1.72; }

        /* ── DATA STREAM ── */
        .data-stream {
          background: var(--abyss);
          border-top: 1px solid rgba(0,212,107,.07);
          border-bottom: 1px solid rgba(0,212,107,.07);
          padding: 24px 0; overflow: hidden;
        }
        .ds-row { display: flex; white-space: nowrap; padding: 5px 0; }
        .ds-fwd { animation: marquee linear infinite; }
        .ds-rev { animation: marqueeRev linear infinite; }
        @keyframes marqueeRev { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        .ds-item {
          display: inline-flex; align-items: center; gap: 8px; padding: 0 28px;
          border-right: 1px solid rgba(0,212,107,.07);
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em;
          text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
        }
        .ds-g { color: var(--virid); }
        .ds-m { color: var(--mist); }
        .ds-d { color: rgba(143,168,152,.32); }
        .ds-dot-g { width: 4px; height: 4px; border-radius: 50%; background: var(--virid); flex-shrink: 0; }

        /* ── NUMBERS ── */
        .numbers { padding: 100px 60px; background: var(--abyss); }
        .numbers-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .num-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .num-card {
          background: var(--deep); border: 1px solid rgba(0,212,107,.09); border-radius: 16px; padding: 28px 22px;
          transition: border-color .25s, transform .25s var(--spring);
        }
        .num-card:hover { border-color: var(--virid-border); transform: translateY(-4px); }
        .num-val {
          font-family: var(--font-display); font-size: clamp(46px, 5.2vw, 68px);
          font-weight: 400; letter-spacing: -.04em; line-height: 1; color: var(--white); margin-bottom: 8px;
        }
        .num-val em { font-style: italic; color: var(--virid); }
        .num-lbl { font-family: var(--font-mono); font-size: 10px; letter-spacing: .09em; text-transform: uppercase; color: var(--mist); line-height: 1.6; }

        /* ── REVERSE STRIP ── */
        .strip-rev { background: var(--deep); border-top: 1px solid rgba(0,212,107,.07); border-bottom: 1px solid rgba(0,212,107,.07); overflow: hidden; padding: 12px 0; }
        .strip-rev-track { display: flex; white-space: nowrap; animation: marqueeRev 36s linear infinite; }
        .strip-rev-item {
          display: inline-flex; align-items: center; gap: 10px; padding: 0 36px;
          border-right: 1px solid rgba(255,255,255,.04);
          font-family: var(--font-display); font-size: 17px; font-style: italic; font-weight: 400;
          color: rgba(240,250,244,.12); white-space: nowrap; flex-shrink: 0; letter-spacing: -.01em;
        }
        .strip-rev-item.hi { color: rgba(0,212,107,.25); }

        /* ── HOW ── */
        .how { padding: 100px 60px; background: var(--void); position: relative; overflow: hidden; }
        .how::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(0,212,107,.04) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .how-inner { position: relative; z-index: 1; }
        .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .how-h2 {
          font-family: var(--font-display); font-size: clamp(38px, 4.8vw, 64px);
          font-weight: 400; letter-spacing: -.028em; line-height: .95; color: var(--white); margin-bottom: 18px;
        }
        .how-h2 em { font-style: italic; color: transparent; -webkit-text-stroke: 1px rgba(184,240,0,.7); }
        .how-sub { font-size: 15.5px; color: var(--mist); line-height: 1.72; max-width: 380px; margin-bottom: 36px; }
        .btn-action {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-ui); font-size: 13.5px; font-weight: 700;
          padding: 12px 26px; border-radius: 100px; background: var(--virid); color: var(--void);
          text-decoration: none; transition: transform .25s var(--spring), box-shadow .25s;
        }
        .btn-action:hover { transform: translateY(-2px); box-shadow: var(--glow); }
        .how-steps { display: flex; flex-direction: column; }
        .how-step { display: flex; gap: 22px; padding: 26px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
        .how-step:last-child { border-bottom: none; }
        .how-step-n { font-family: var(--font-mono); font-size: 10px; letter-spacing: .12em; color: var(--virid); opacity: .55; padding-top: 3px; min-width: 28px; flex-shrink: 0; }
        .how-step-name { font-family: var(--font-ui); font-size: 16.5px; font-weight: 700; color: var(--white); margin-bottom: 7px; letter-spacing: -.2px; }
        .how-step-desc { font-size: 14px; color: var(--mist); line-height: 1.68; }

        /* ── CTA ── */
        .cta { padding: 140px 60px; background: var(--abyss); text-align: center; position: relative; overflow: hidden; }
        .cta::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 50% 110%, rgba(0,212,107,.13) 0%, transparent 62%);
        }
        .cta-inner { position: relative; z-index: 1; }
        .cta-badge {
          display: inline-flex; align-items: center; gap: 9px;
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--virid);
          border: 1px solid var(--virid-border); border-radius: 100px; padding: 6px 16px; margin-bottom: 40px;
        }
        .badge-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--virid); animation: badgePulse 2.2s ease-in-out infinite; }
        @keyframes badgePulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.55);opacity:.55} }
        .cta-h2 {
          font-family: var(--font-display); font-size: clamp(48px, 7vw, 96px);
          font-weight: 400; letter-spacing: -.038em; line-height: .91; color: var(--white);
          margin-bottom: 28px; max-width: 13ch; margin-left: auto; margin-right: auto;
        }
        .cta-h2 em { font-style: italic; color: transparent; -webkit-text-stroke: 1.2px rgba(0,212,107,.62); }
        .cta-sub { font-family: var(--font-ui); font-size: 17px; color: var(--mist); line-height: 1.7; max-width: 420px; margin: 0 auto 52px; }
        .cta-btns { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
        .btn-cta {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-ui); font-size: 15px; font-weight: 800; letter-spacing: -.15px;
          padding: 15px 38px; border-radius: 100px; background: var(--virid); color: var(--void);
          text-decoration: none; transition: transform .25s var(--spring), box-shadow .25s;
        }
        .btn-cta:hover { transform: translateY(-3px); box-shadow: var(--glow); }
        .btn-cta-muted {
          display: inline-flex; align-items: center;
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase;
          color: var(--mist); padding: 14px 28px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,.09); cursor: not-allowed; opacity: .4;
        }

        /* ── FOOTER ── */
        .footer {
          background: var(--void); border-top: 1px solid rgba(0,212,107,.07);
          padding: 42px 60px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }
        .footer-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .footer-mark {
          width: 26px; height: 26px; border-radius: 6px; background: rgba(0,212,107,.1);
          border: 1px solid var(--virid-border); display: flex; align-items: center; justify-content: center;
        }
        .footer-mark svg { width: 13px; height: 13px; }
        .footer-name { font-family: var(--font-ui); font-size: 13.5px; font-weight: 700; color: rgba(240,250,244,.35); }
        .footer-copy { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .06em; color: rgba(143,168,152,.2); }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp { from{opacity:0;transform:translateY(34px)} to{opacity:1;transform:translateY(0)} }
        .fu1 { animation: fadeUp .85s ease both; }
        .fu2 { animation: fadeUp .85s .1s ease both; }
        .fu3 { animation: fadeUp .85s .22s ease both; }
        .fu4 { animation: fadeUp .85s .38s ease both; }

        /* ── RESPONSIVE ── */
        @media(max-width:1020px) {
          .nav { padding: 0 28px; }
          .hero { padding: 62px 28px 64px; }
          .hero-panel { display: none; }
          .hero-foot { gap: 24px 0; }
          .hero-stat { min-width: 120px; }
          .hero-actions { margin-left: 0; width: 100%; }
          .features { padding: 80px 28px; }
          .feat-grid { grid-template-columns: 1fr; }
          .numbers { padding: 80px 28px; }
          .numbers-wrap { grid-template-columns: 1fr; gap: 52px; }
          .how { padding: 80px 28px; }
          .how-grid { grid-template-columns: 1fr; gap: 52px; }
          .cta { padding: 88px 28px; }
          .footer { padding: 36px 28px; flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="lp">
        <div id="scroll-progress" />

        {/* ── NAV ── */}
        <nav className="nav">
          <a href="/" className="nav-logo">
            <div className="nav-logo-mark">
              <svg viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1.5v4M7.5 9.5V13.5M1.5 7.5h4M9.5 7.5h4" stroke="#030A06" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="7.5" cy="7.5" r="1.8" fill="#030A06"/>
              </svg>
            </div>
            <span className="nav-logo-name">Fisio<b>Hub</b></span>
          </a>
          <div className="nav-right">
            <Link href="/planos" className="nav-ghost">Planos & Preços</Link>
            <Link href="/login" className="nav-cta">
              Entrar
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-glow-1 par-slow" />
          <div className="hero-glow-2 par-up" />

          <div className="hero-panel">
            <div className="hpanel hpanel-1">
              <span className="hpanel-icon">📲</span>
              <div>
                <div className="hpanel-val">WhatsApp</div>
                <div className="hpanel-lbl">confirmação enviada</div>
              </div>
            </div>
            <div className="hpanel hpanel-2">
              <span className="hpanel-icon">💰</span>
              <div>
                <div className="hpanel-val">R$ 4.280</div>
                <div className="hpanel-lbl">receita esse mês</div>
              </div>
            </div>
            <div className="hpanel hpanel-3">
              <span className="hpanel-icon">📅</span>
              <div>
                <div className="hpanel-val">12 sessões</div>
                <div className="hpanel-lbl">agendadas hoje</div>
              </div>
            </div>
          </div>

          <div className="hero-content">
            <div className="hero-eyebrow fu1">Plataforma para Fisioterapia</div>
            <h1 className="hero-h1 fu2">
              Sua clínica,<br />
              <em>organizada</em><br />
              de verdade.
            </h1>
            <div className="hero-foot fu3">
              <div className="hero-stat">
                <div className="hero-stat-val">Agenda visual</div>
                <div className="hero-stat-lbl">conflitos detectados</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-val">Prontuários</div>
                <div className="hero-stat-lbl">PDF com 1 clique</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-val">Financeiro</div>
                <div className="hero-stat-lbl">DRE consolidado</div>
              </div>
              <div className="hero-actions fu4">
                <Link href="/planos" className="btn-hero-primary">
                  Ver planos
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/login" className="btn-hero-ghost">Entrar na plataforma</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── STRIP ── */}
        <div className="strip">
          <div className="strip-track">
            {[
              'Agendamento inteligente','Prontuário digital','WhatsApp automático',
              'Gestão financeira','Relatórios detalhados','Multi-clínica',
              'Acesso por perfil','PDF de pacientes',
              'Agendamento inteligente','Prontuário digital','WhatsApp automático',
              'Gestão financeira','Relatórios detalhados','Multi-clínica',
              'Acesso por perfil','PDF de pacientes',
            ].map((text, i) => (
              <div key={i} className="strip-item">
                <span className="s-dot" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="features">
          <div className="features-header">
            <div className="eyebrow-mono sr">Funcionalidades</div>
            <h2 className="sec-h2 sr d1">O que vem dentro<br />do <em>FisioHub.</em></h2>
            <p className="sec-p sr d2">Cada funcionalidade foi desenhada para o fluxo real de uma clínica de fisioterapia. Sem inchaço, sem curva de aprendizado.</p>
          </div>
          <div className="feat-grid">
            {[
              {n:'01', icon:'📅', title:'Agenda visual completa', desc:'Veja todos os horários por fisioterapeuta, sala ou turno. O sistema detecta conflitos automaticamente antes de confirmar qualquer agendamento.'},
              {n:'02', icon:'📋', title:'Prontuário e anamnese', desc:'Registro completo de evolução de cada sessão, histórico de atendimentos e ficha de anamnese. Tudo exportável em PDF com um clique.'},
              {n:'03', icon:'💬', title:'WhatsApp automático', desc:'Mensagem de confirmação e lembrete enviadas direto pelo WhatsApp do paciente, sem depender de ninguém da equipe manualmente.'},
              {n:'04', icon:'💰', title:'Financeiro integrado', desc:'Cobranças, pagamentos, fluxo de caixa e DRE mensal consolidados. Feche o mês sabendo exatamente quanto entrou e saiu.'},
            ].map((f, i) => (
              <div key={f.title} className={`feat-card sr d${i + 1}`}>
                <div className="feat-num">{f.n}</div>
                <div className="feat-icon">{f.icon}</div>
                <div>
                  <div className="feat-title">{f.title}</div>
                  <p className="feat-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DATA STREAM ── */}
        <div className="data-stream">
          {streamRows.map((row, ri) => (
            <div
              key={ri}
              className={`ds-row ds-${row.dir}`}
              style={{ animationDuration: row.dur }}
            >
              {[...row.items, ...row.items].map((item, i) => (
                <div key={i} className={`ds-item ${item.g ? 'ds-g' : ri === 1 ? 'ds-d' : 'ds-m'}`}>
                  {item.g && <span className="ds-dot-g" />}
                  {item.t}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── NUMBERS ── */}
        <section className="numbers">
          <div className="numbers-wrap">
            <div>
              <div className="eyebrow-mono sr">Por que funciona</div>
              <h2 className="sec-h2 sr d1">Feito para quem atende,<br />não para quem<br /><em>gerencia TI.</em></h2>
              <p className="sec-p sr d2" style={{marginTop:'18px'}}>Construído ouvindo fisioterapeutas reais. Simples no dia a dia, completo quando precisar.</p>
            </div>
            <div className="num-grid">
              {[
                {val:'100', suf:'%', lbl:'FOCADO EM\nFISIOTERAPIA'},
                {val:'0',   suf:'h', lbl:'DE TREINAMENTO\nPARA COMEÇAR'},
                {val:'4',   suf:'×', lbl:'MAIS RÁPIDO\nQUE PLANILHAS'},
                {val:'1',   suf:'',  lbl:'PLATAFORMA PARA\nTODA A EQUIPE'},
              ].map((n, i) => (
                <div key={n.val + n.lbl} className={`num-card sr d${i + 1}`}>
                  <div className="num-val">
                    <span data-count={n.val}>{n.val}</span>
                    <em>{n.suf}</em>
                  </div>
                  <div className="num-lbl" style={{whiteSpace:'pre-line'}}>{n.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REVERSE STRIP ── */}
        <div className="strip-rev">
          <div className="strip-rev-track">
            {[
              {t:'Organize sua clínica', hi:false},
              {t:'Atenda mais pacientes', hi:true},
              {t:'Sem papel', hi:false},
              {t:'Sem planilha', hi:false},
              {t:'Sem complicação', hi:true},
              {t:'Gestão em tempo real', hi:false},
              {t:'WhatsApp automático', hi:true},
              {t:'Financeiro integrado', hi:false},
              {t:'Organize sua clínica', hi:false},
              {t:'Atenda mais pacientes', hi:true},
              {t:'Sem papel', hi:false},
              {t:'Sem planilha', hi:false},
              {t:'Sem complicação', hi:true},
              {t:'Gestão em tempo real', hi:false},
              {t:'WhatsApp automático', hi:true},
              {t:'Financeiro integrado', hi:false},
            ].map((item, i) => (
              <span key={i} className={`strip-rev-item${item.hi ? ' hi' : ''}`}>{item.t}</span>
            ))}
          </div>
        </div>

        {/* ── HOW ── */}
        <section className="how">
          <div className="how-inner">
            <div className="how-grid">
              <div>
                <div className="eyebrow-mono sr">Como funciona</div>
                <h2 className="how-h2 sr d1">Sua clínica no ar<br />em <em>minutos.</em></h2>
                <p className="how-sub sr d2">Sem instalação, sem servidor, sem técnico. Você acessa pelo navegador e começa agora mesmo.</p>
                <Link href="/planos" className="btn-action sr d3">
                  Escolher meu plano
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
              <div className="how-steps">
                {[
                  {n:'01', name:'Crie sua clínica', desc:'Cadastre o nome, horários e adicione sua equipe. Leva menos de 5 minutos para tudo estar configurado.'},
                  {n:'02', name:'Cadastre os pacientes', desc:'Adicione os pacientes com histórico, contato e informações de saúde. Importe de planilhas se preferir.'},
                  {n:'03', name:'Agende e atenda', desc:'Marque consultas, registre sessões, envie confirmações pelo WhatsApp e acompanhe o financeiro em tempo real.'},
                ].map((s, i) => (
                  <div key={s.n} className={`how-step sr d${i + 1}`}>
                    <div className="how-step-n">{s.n}</div>
                    <div>
                      <div className="how-step-name">{s.name}</div>
                      <p className="how-step-desc">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta">
          <div className="cta-inner">
            <div className="cta-badge sr">
              <span className="badge-pulse" />
              Planos disponíveis
            </div>
            <h2 className="cta-h2 sr d1">
              Sua clínica merece<br />
              uma gestão <em>à altura.</em>
            </h2>
            <p className="cta-sub sr d2">Escolha o plano ideal para o tamanho da sua clínica. Sem fidelidade, sem surpresas na fatura.</p>
            <div className="cta-btns sr d3">
              <Link href="/planos" className="btn-cta">
                Ver planos e preços
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <span className="btn-cta-muted">Demonstração — em breve</span>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <a href="/" className="footer-brand">
            <div className="footer-mark">
              <svg viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v3.5M6.5 8.5V12M1 6.5h3.5M8.5 6.5H12" stroke="#00D46B" strokeWidth="1.7" strokeLinecap="round"/>
                <circle cx="6.5" cy="6.5" r="1.5" fill="#00D46B"/>
              </svg>
            </div>
            <span className="footer-name">FisioHub</span>
          </a>
          <div className="footer-copy">© {new Date().getFullYear()} FisioHub. Todos os direitos reservados.</div>
        </footer>

      </div>
      <ScrollEffects />
    </>
  )
}
