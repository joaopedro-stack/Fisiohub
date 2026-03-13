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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Nunito:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream:       #E4DFD5;
          --cream-2:     #D6CFC3;
          --white:       #FFFFFF;
          --forest:      #1B4A34;
          --forest-mid:  #2D6E4A;
          --forest-lite: #4D9668;
          --sage:        #7BAA88;
          --sage-2:      #90B89E;
          --sage-bg:     #C2D9C9;
          --ink:         #1A1E1C;
          --ink-2:       #4A5650;
          --ink-3:       #8A9490;
          --font-d:      'Playfair Display', Georgia, serif;
          --font-ui:     'Nunito', system-ui, sans-serif;
          --spring:      cubic-bezier(.34,1.56,.64,1);
          --smooth:      cubic-bezier(.4,0,.2,1);
          --sh-sm:       0 2px 12px rgba(27,74,52,.08);
          --sh-md:       0 8px 32px rgba(27,74,52,.13);
          --sh-lg:       0 24px 64px rgba(27,74,52,.18);
        }

        .lp { font-family: var(--font-ui); background: var(--cream); color: var(--ink); -webkit-font-smoothing: antialiased; }

        /* ── SCROLL PROGRESS ── */
        #scroll-progress {
          position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 300;
          background: linear-gradient(90deg, var(--forest), var(--forest-lite));
          transform: scaleX(0); transform-origin: left;
        }

        /* ── SCROLL REVEAL ── */
        .sr { opacity: 0; transform: translateY(36px); transition: opacity .72s var(--smooth), transform .72s var(--smooth); }
        .sr.d1 { transition-delay: .1s; }
        .sr.d2 { transition-delay: .2s; }
        .sr.d3 { transition-delay: .3s; }
        .sr.d4 { transition-delay: .4s; }
        .sr.d5 { transition-delay: .5s; }
        .sr-visible { opacity: 1 !important; transform: translateY(0) !important; }

        /* ── FADE UP (hero) ── */
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .fu1 { animation: fadeUp .8s ease both; }
        .fu2 { animation: fadeUp .8s .12s ease both; }
        .fu3 { animation: fadeUp .8s .26s ease both; }
        .fu4 { animation: fadeUp .8s .42s ease both; }

        /* ── NAV ── */
        .nav {
          position: fixed; inset: 0 0 auto 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 64px; height: 66px;
          background: rgba(228,223,213,.95);
          backdrop-filter: blur(20px) saturate(1.8);
          border-bottom: 1px solid rgba(27,74,52,.08);
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-logo-mark {
          width: 32px; height: 32px; border-radius: 9px; background: var(--forest);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .nav-logo-mark svg { width: 15px; height: 15px; }
        .nav-logo-name { font-size: 16px; font-weight: 800; color: var(--ink); letter-spacing: -.3px; }
        .nav-logo-name b { color: var(--forest); }
        .nav-right { display: flex; align-items: center; gap: 6px; }
        .nav-link {
          font-size: 14px; font-weight: 600; color: var(--ink-2);
          text-decoration: none; padding: 8px 16px; border-radius: 100px;
          transition: color .2s, background .2s;
        }
        .nav-link:hover { color: var(--forest); background: var(--sage-bg); }
        .nav-cta {
          display: flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 700;
          padding: 9px 20px; border-radius: 100px; background: var(--forest); color: var(--white);
          text-decoration: none; transition: transform .25s var(--spring), box-shadow .25s, background .2s;
        }
        .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(27,74,52,.25); background: var(--forest-mid); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh; display: flex; align-items: center;
          padding: 66px 64px 80px; position: relative; overflow: hidden;
          background: var(--cream);
        }
        .hero::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: radial-gradient(rgba(27,74,52,.055) 1.2px, transparent 1.2px);
          background-size: 28px 28px;
        }
        .hero-blob-1 {
          position: absolute; width: 720px; height: 720px; border-radius: 50%;
          background: radial-gradient(circle, rgba(75,150,104,.12) 0%, transparent 68%);
          top: -200px; right: -80px; pointer-events: none; z-index: 0;
          animation: blobDrift 12s ease-in-out infinite;
        }
        .hero-blob-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(123,170,136,.1) 0%, transparent 70%);
          bottom: -80px; left: -60px; pointer-events: none; z-index: 0;
          animation: blobDrift 16s 3s ease-in-out infinite reverse;
        }
        @keyframes blobDrift {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(18px,-28px) scale(1.04); }
        }

        .hero-inner {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1fr 400px; gap: 64px; align-items: center;
          width: 100%; max-width: 1200px;
        }

        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
          color: var(--forest); background: var(--sage-bg);
          border: 1px solid rgba(27,74,52,.15);
          padding: 5px 14px 5px 10px; border-radius: 100px; margin-bottom: 30px;
        }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--forest-lite); flex-shrink: 0; animation: badgePulse 2.4s ease-in-out infinite; }
        @keyframes badgePulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:.55} }

        .hero-h1 {
          font-family: var(--font-d); font-size: clamp(52px, 6.5vw, 96px);
          font-weight: 700; line-height: .92; letter-spacing: -.03em; color: var(--ink); margin-bottom: 28px;
        }
        .hero-h1 em { font-style: italic; color: var(--forest); }

        .hero-sub {
          font-size: 17px; font-weight: 500; color: var(--ink-2); line-height: 1.76;
          max-width: 480px; margin-bottom: 40px;
        }

        .hero-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 48px; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-ui); font-size: 15px; font-weight: 700;
          padding: 13px 28px; border-radius: 100px; background: var(--forest); color: var(--white);
          text-decoration: none; transition: transform .25s var(--spring), box-shadow .25s, background .2s;
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(27,74,52,.3); background: var(--forest-mid); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-ui); font-size: 14px; font-weight: 700; color: var(--ink-2);
          padding: 12px 24px; border-radius: 100px; border: 1.5px solid rgba(27,74,52,.2);
          text-decoration: none; transition: color .2s, border-color .2s, background .2s;
        }
        .btn-ghost:hover { color: var(--forest); border-color: var(--forest); background: var(--sage-bg); }

        .hero-trust {
          display: flex; align-items: center; padding-top: 32px;
          border-top: 1px solid rgba(27,74,52,.1); flex-wrap: wrap; row-gap: 20px;
        }
        .hero-trust-item { flex: 1; min-width: 110px; }
        .hero-trust-item + .hero-trust-item { padding-left: 28px; border-left: 1px solid rgba(27,74,52,.1); margin-left: 28px; }
        .hero-trust-val { font-family: var(--font-d); font-size: 18px; font-weight: 700; color: var(--forest); line-height: 1; margin-bottom: 4px; }
        .hero-trust-lbl { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .07em; }

        /* floating panels */
        .hero-right { display: flex; flex-direction: column; gap: 12px; }
        .hpanel {
          background: var(--white); border-radius: 16px;
          padding: 16px 20px; display: flex; align-items: center; gap: 14px;
          box-shadow: var(--sh-md); border: 1px solid rgba(27,74,52,.06);
        }
        .hpanel-icon {
          width: 44px; height: 44px; border-radius: 12px; background: var(--sage-bg);
          display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0;
        }
        .hpanel-val { font-family: var(--font-d); font-size: 18px; font-weight: 700; color: var(--forest); line-height: 1; margin-bottom: 4px; }
        .hpanel-lbl { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .06em; }
        .hpanel-1 { animation: panelFloat 5s ease-in-out infinite; }
        .hpanel-2 { animation: panelFloat 5s 1.9s ease-in-out infinite; }
        .hpanel-3 { animation: panelFloat 5s 3.5s ease-in-out infinite; }
        @keyframes panelFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }

        /* ── STRIP ── */
        .strip {
          background: var(--sage-bg);
          border-top: 1px solid rgba(27,74,52,.09);
          border-bottom: 1px solid rgba(27,74,52,.09);
          overflow: hidden; padding: 14px 0;
        }
        .strip-track { display: flex; white-space: nowrap; animation: marquee 30s linear infinite; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .strip-item {
          display: inline-flex; align-items: center; gap: 8px; padding: 0 28px;
          border-right: 1px solid rgba(27,74,52,.1);
          font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
          color: var(--forest-mid); white-space: nowrap; flex-shrink: 0;
        }
        .s-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--forest-lite); flex-shrink: 0; }

        /* ── COMMON SECTION STYLES ── */
        .sec-eyebrow {
          font-size: 11.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--forest); display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
        }
        .sec-eyebrow::before { content: ''; width: 22px; height: 2px; background: var(--forest-lite); display: block; border-radius: 2px; flex-shrink: 0; }
        .sec-h2 {
          font-family: var(--font-d); font-size: clamp(36px, 4.5vw, 60px);
          font-weight: 700; line-height: .93; letter-spacing: -.025em; color: var(--ink); margin-bottom: 16px;
        }
        .sec-h2 em { font-style: italic; color: var(--forest); }
        .sec-p { font-size: 16px; font-weight: 500; color: var(--ink-2); line-height: 1.72; }

        /* ── FEATURES ── */
        .features { padding: 120px 64px; background: var(--sage-bg); position: relative; }
        .features::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(27,74,52,.055) 1.2px, transparent 1.2px);
          background-size: 28px 28px;
        }
        .features-header { max-width: 620px; margin-bottom: 60px; position: relative; z-index: 1; }
        .feat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; position: relative; z-index: 1; }
        .feat-card {
          background: var(--white); border-radius: 20px; padding: 40px 36px;
          border: 1px solid rgba(27,74,52,.07); position: relative; overflow: hidden;
          transition: transform .3s var(--spring), box-shadow .3s, border-color .3s;
        }
        .feat-card:hover { transform: translateY(-6px); box-shadow: var(--sh-lg); border-color: rgba(27,74,52,.14); }
        .feat-num {
          position: absolute; top: 20px; right: 24px;
          font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(27,74,52,.2);
        }
        .feat-icon-box {
          width: 52px; height: 52px; border-radius: 14px; background: var(--sage-bg);
          border: 1px solid rgba(27,74,52,.12); display: flex; align-items: center;
          justify-content: center; font-size: 22px; margin-bottom: 20px;
          transition: background .3s;
        }
        .feat-card:hover .feat-icon-box { background: rgba(27,74,52,.09); }
        .feat-title { font-family: var(--font-d); font-size: 21px; font-weight: 700; color: var(--ink); margin-bottom: 10px; }
        .feat-desc { font-size: 14.5px; font-weight: 500; color: var(--ink-2); line-height: 1.72; }

        /* ── DATA STREAM ── */
        .data-stream {
          background: var(--sage-bg);
          border-top: 1px solid rgba(27,74,52,.07);
          border-bottom: 1px solid rgba(27,74,52,.07);
          padding: 20px 0; overflow: hidden;
        }
        .ds-row { display: flex; white-space: nowrap; padding: 4px 0; }
        .ds-fwd { animation: marquee linear infinite; }
        .ds-rev { animation: marqueeRev linear infinite; }
        @keyframes marqueeRev { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        .ds-item {
          display: inline-flex; align-items: center; gap: 7px; padding: 0 24px;
          border-right: 1px solid rgba(27,74,52,.08);
          font-size: 10.5px; font-weight: 700; letter-spacing: .09em;
          text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
        }
        .ds-g { color: var(--forest); }
        .ds-m { color: var(--ink-3); }
        .ds-d { color: rgba(123,170,136,.4); }
        .ds-dot-g { width: 4px; height: 4px; border-radius: 50%; background: var(--forest-lite); flex-shrink: 0; }

        /* ── NUMBERS ── */
        .numbers { padding: 100px 64px; background: var(--cream); }
        .numbers-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .num-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .num-card {
          background: #F2EDE5; border-radius: 18px;
          border: 1px solid rgba(27,74,52,.08); padding: 28px 24px;
          transition: transform .25s var(--spring), border-color .25s, box-shadow .25s;
        }
        .num-card:hover { transform: translateY(-4px); border-color: rgba(27,74,52,.18); box-shadow: var(--sh-md); }
        .num-val {
          font-family: var(--font-d); font-size: clamp(44px, 5vw, 64px);
          font-weight: 700; letter-spacing: -.04em; line-height: 1; color: var(--ink); margin-bottom: 8px;
        }
        .num-val em { font-style: italic; color: var(--forest); }
        .num-lbl { font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); line-height: 1.55; }

        /* ── FOREST STRIP (italic) ── */
        .strip-forest {
          background: var(--forest); overflow: hidden; padding: 14px 0;
        }
        .strip-forest-track { display: flex; white-space: nowrap; animation: marqueeRev 36s linear infinite; }
        .strip-forest-item {
          display: inline-flex; align-items: center; gap: 14px; padding: 0 36px;
          border-right: 1px solid rgba(255,255,255,.08);
          font-family: var(--font-d); font-size: 17px; font-style: italic;
          color: rgba(255,255,255,.22); white-space: nowrap; flex-shrink: 0;
        }
        .strip-forest-item.hi { color: rgba(255,255,255,.65); }

        /* ── HOW IT WORKS ── */
        .how { padding: 100px 64px; background: var(--cream); position: relative; }
        .how::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(27,74,52,.038) 1.2px, transparent 1.2px);
          background-size: 28px 28px;
        }
        .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; position: relative; z-index: 1; }
        .how-steps { display: flex; flex-direction: column; position: relative; }
        .how-steps::before {
          content: ''; position: absolute; left: 18px; top: 28px; bottom: 28px; width: 1.5px;
          background: linear-gradient(to bottom, var(--sage-2), rgba(178,202,185,.15));
        }
        .how-step { display: flex; gap: 22px; padding: 24px 0; }
        .how-step-n-wrap { flex-shrink: 0; position: relative; z-index: 1; }
        .how-step-n {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--white); border: 2px solid rgba(27,74,52,.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: var(--forest);
        }
        .how-step-name { font-family: var(--font-d); font-size: 19px; font-weight: 700; color: var(--ink); margin-bottom: 7px; padding-top: 6px; }
        .how-step-desc { font-size: 14px; font-weight: 500; color: var(--ink-2); line-height: 1.7; }

        /* ── CTA ── */
        .cta-section {
          padding: 140px 64px; background: var(--forest); text-align: center; position: relative; overflow: hidden;
        }
        .cta-blob-1 {
          position: absolute; width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(75,150,104,.28) 0%, transparent 70%);
          top: -200px; right: -120px; pointer-events: none;
        }
        .cta-blob-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(123,170,136,.18) 0%, transparent 70%);
          bottom: -120px; left: -80px; pointer-events: none;
        }
        .cta-inner { position: relative; z-index: 1; }
        .cta-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--sage-2); border: 1px solid rgba(178,202,185,.3); border-radius: 100px;
          padding: 6px 16px; margin-bottom: 40px;
        }
        .cta-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sage-2); animation: badgePulse 2.2s ease-in-out infinite; }
        .cta-h2 {
          font-family: var(--font-d); font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 700; letter-spacing: -.035em; line-height: .91; color: var(--white);
          margin-bottom: 24px; max-width: 14ch; margin-left: auto; margin-right: auto;
        }
        .cta-h2 em { font-style: italic; color: rgba(178,202,185,.9); }
        .cta-sub { font-size: 17px; font-weight: 500; color: rgba(178,202,185,.7); line-height: 1.7; max-width: 420px; margin: 0 auto 52px; }
        .cta-btns { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
        .btn-cta-white {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-ui); font-size: 15px; font-weight: 700;
          padding: 14px 36px; border-radius: 100px; background: var(--white); color: var(--forest);
          text-decoration: none; transition: transform .25s var(--spring), box-shadow .25s;
        }
        .btn-cta-white:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,.25); }
        .btn-cta-muted {
          display: inline-flex; align-items: center;
          font-family: var(--font-ui); font-size: 13px; font-weight: 600;
          padding: 14px 28px; border-radius: 100px; border: 1.5px solid rgba(255,255,255,.22);
          color: rgba(255,255,255,.45); cursor: not-allowed;
        }

        /* ── FOOTER ── */
        .footer {
          background: var(--cream-2); border-top: 1px solid rgba(27,74,52,.09);
          padding: 44px 64px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }
        .footer-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .footer-mark {
          width: 28px; height: 28px; border-radius: 7px; background: var(--forest);
          display: flex; align-items: center; justify-content: center;
        }
        .footer-mark svg { width: 13px; height: 13px; }
        .footer-name { font-size: 14px; font-weight: 800; color: var(--ink-2); }
        .footer-copy { font-size: 12px; font-weight: 500; color: var(--ink-3); }

        /* ── RESPONSIVE ── */
        @media(max-width:1020px) {
          .nav { padding: 0 24px; }
          .hero { padding: 66px 24px 64px; }
          .hero-inner { grid-template-columns: 1fr; }
          .hero-right { display: none; }
          .features { padding: 80px 24px; }
          .feat-grid { grid-template-columns: 1fr; }
          .numbers { padding: 80px 24px; }
          .numbers-wrap { grid-template-columns: 1fr; gap: 52px; }
          .how { padding: 80px 24px; }
          .how-grid { grid-template-columns: 1fr; gap: 52px; }
          .cta-section { padding: 88px 24px; }
          .footer { padding: 36px 24px; flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="lp">
        <div id="scroll-progress" />

        {/* ── NAV ── */}
        <nav className="nav">
          <a href="/" className="nav-logo">
            <div className="nav-logo-mark">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="8" cy="8" r="2" fill="#fff"/>
              </svg>
            </div>
            <span className="nav-logo-name">Fisio<b>Hub</b></span>
          </a>
          <div className="nav-right">
            <Link href="/planos" className="nav-link">Planos & Preços</Link>
            <Link href="/login" className="nav-cta">
              Entrar
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-blob-1" />
          <div className="hero-blob-2" />
          <div className="hero-inner">
            <div>
              <div className="hero-eyebrow fu1">
                <span className="eyebrow-dot" />
                Plataforma para Fisioterapia
              </div>
              <h1 className="hero-h1 fu2">
                Sua clínica,<br />
                <em>organizada</em><br />
                de verdade.
              </h1>
              <p className="hero-sub fu3">
                Agenda, prontuários, financeiro e WhatsApp automático — tudo integrado para clínicas de fisioterapia que querem crescer sem caos.
              </p>
              <div className="hero-actions fu4">
                <Link href="/planos" className="btn-primary">
                  Ver planos
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/login" className="btn-ghost">Entrar na plataforma</Link>
              </div>
              <div className="hero-trust fu4">
                <div className="hero-trust-item">
                  <div className="hero-trust-val">Agenda visual</div>
                  <div className="hero-trust-lbl">conflitos detectados</div>
                </div>
                <div className="hero-trust-item">
                  <div className="hero-trust-val">Prontuários</div>
                  <div className="hero-trust-lbl">PDF com 1 clique</div>
                </div>
                <div className="hero-trust-item">
                  <div className="hero-trust-val">Financeiro</div>
                  <div className="hero-trust-lbl">DRE consolidado</div>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="hpanel hpanel-1">
                <div className="hpanel-icon">📲</div>
                <div>
                  <div className="hpanel-val">WhatsApp</div>
                  <div className="hpanel-lbl">confirmação enviada</div>
                </div>
              </div>
              <div className="hpanel hpanel-2">
                <div className="hpanel-icon">💰</div>
                <div>
                  <div className="hpanel-val">R$ 4.280</div>
                  <div className="hpanel-lbl">receita esse mês</div>
                </div>
              </div>
              <div className="hpanel hpanel-3">
                <div className="hpanel-icon">📅</div>
                <div>
                  <div className="hpanel-val">12 sessões</div>
                  <div className="hpanel-lbl">agendadas hoje</div>
                </div>
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
            <div className="sec-eyebrow sr">Funcionalidades</div>
            <h2 className="sec-h2 sr d1">O que vem dentro<br />do <em>FisioHub.</em></h2>
            <p className="sec-p sr d2">Cada funcionalidade foi desenhada para o fluxo real de uma clínica de fisioterapia. Sem inchaço, sem curva de aprendizado.</p>
          </div>
          <div className="feat-grid">
            {[
              { n: '01', icon: '📅', title: 'Agenda visual completa', desc: 'Veja todos os horários por fisioterapeuta, sala ou turno. O sistema detecta conflitos automaticamente antes de confirmar qualquer agendamento.' },
              { n: '02', icon: '📋', title: 'Prontuário e anamnese', desc: 'Registro completo de evolução de cada sessão, histórico de atendimentos e ficha de anamnese. Tudo exportável em PDF com um clique.' },
              { n: '03', icon: '💬', title: 'WhatsApp automático', desc: 'Mensagem de confirmação e lembrete enviadas direto pelo WhatsApp do paciente, sem depender de ninguém da equipe manualmente.' },
              { n: '04', icon: '💰', title: 'Financeiro integrado', desc: 'Cobranças, pagamentos, fluxo de caixa e DRE mensal consolidados. Feche o mês sabendo exatamente quanto entrou e saiu.' },
            ].map((f, i) => (
              <div key={f.title} className={`feat-card sr d${i + 1}`}>
                <div className="feat-num">{f.n}</div>
                <div className="feat-icon-box">{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <p className="feat-desc">{f.desc}</p>
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
              <div className="sec-eyebrow sr">Por que funciona</div>
              <h2 className="sec-h2 sr d1">Feito para quem atende,<br />não para quem<br /><em>gerencia TI.</em></h2>
              <p className="sec-p sr d2" style={{ marginTop: '18px' }}>Construído ouvindo fisioterapeutas reais. Simples no dia a dia, completo quando precisar.</p>
            </div>
            <div className="num-grid">
              {[
                { val: '100', suf: '%', lbl: 'FOCADO EM\nFISIOTERAPIA' },
                { val: '0',   suf: 'h', lbl: 'DE TREINAMENTO\nPARA COMEÇAR' },
                { val: '4',   suf: '×', lbl: 'MAIS RÁPIDO\nQUE PLANILHAS' },
                { val: '1',   suf: '',  lbl: 'PLATAFORMA PARA\nTODA A EQUIPE' },
              ].map((n, i) => (
                <div key={n.val + n.lbl} className={`num-card sr d${i + 1}`}>
                  <div className="num-val">
                    <span data-count={n.val}>{n.val}</span>
                    <em>{n.suf}</em>
                  </div>
                  <div className="num-lbl" style={{ whiteSpace: 'pre-line' }}>{n.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOREST ITALIC STRIP ── */}
        <div className="strip-forest">
          <div className="strip-forest-track">
            {[
              { t: 'Organize sua clínica', hi: false },
              { t: 'Atenda mais pacientes', hi: true },
              { t: 'Sem papel', hi: false },
              { t: 'Sem planilha', hi: false },
              { t: 'Sem complicação', hi: true },
              { t: 'Gestão em tempo real', hi: false },
              { t: 'WhatsApp automático', hi: true },
              { t: 'Financeiro integrado', hi: false },
              { t: 'Organize sua clínica', hi: false },
              { t: 'Atenda mais pacientes', hi: true },
              { t: 'Sem papel', hi: false },
              { t: 'Sem planilha', hi: false },
              { t: 'Sem complicação', hi: true },
              { t: 'Gestão em tempo real', hi: false },
              { t: 'WhatsApp automático', hi: true },
              { t: 'Financeiro integrado', hi: false },
            ].map((item, i) => (
              <span key={i} className={`strip-forest-item${item.hi ? ' hi' : ''}`}>{item.t}</span>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="how">
          <div className="how-grid">
            <div>
              <div className="sec-eyebrow sr">Como funciona</div>
              <h2 className="sec-h2 sr d1">Sua clínica no ar<br />em <em>minutos.</em></h2>
              <p className="sec-p sr d2" style={{ marginBottom: '36px', marginTop: '8px' }}>Sem instalação, sem servidor, sem técnico. Você acessa pelo navegador e começa agora mesmo.</p>
              <Link href="/planos" className="btn-primary sr d3">
                Escolher meu plano
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
            <div className="how-steps">
              {[
                { n: '01', name: 'Crie sua clínica', desc: 'Cadastre o nome, horários e adicione sua equipe. Leva menos de 5 minutos para tudo estar configurado.' },
                { n: '02', name: 'Cadastre os pacientes', desc: 'Adicione os pacientes com histórico, contato e informações de saúde. Importe de planilhas se preferir.' },
                { n: '03', name: 'Agende e atenda', desc: 'Marque consultas, registre sessões, envie confirmações pelo WhatsApp e acompanhe o financeiro em tempo real.' },
              ].map((s, i) => (
                <div key={s.n} className={`how-step sr d${i + 1}`}>
                  <div className="how-step-n-wrap">
                    <div className="how-step-n">{s.n}</div>
                  </div>
                  <div>
                    <div className="how-step-name">{s.name}</div>
                    <p className="how-step-desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section">
          <div className="cta-blob-1" />
          <div className="cta-blob-2" />
          <div className="cta-inner">
            <div className="cta-badge sr">
              <span className="cta-badge-dot" />
              Planos disponíveis
            </div>
            <h2 className="cta-h2 sr d1">
              Sua clínica merece<br />
              uma gestão <em>à altura.</em>
            </h2>
            <p className="cta-sub sr d2">Escolha o plano ideal para o tamanho da sua clínica. Sem fidelidade, sem surpresas na fatura.</p>
            <div className="cta-btns sr d3">
              <Link href="/planos" className="btn-cta-white">
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
                <path d="M6.5 1v3.5M6.5 8.5V12M1 6.5h3.5M8.5 6.5H12" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
                <circle cx="6.5" cy="6.5" r="1.5" fill="#fff"/>
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
