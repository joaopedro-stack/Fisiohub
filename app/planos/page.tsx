import Link from 'next/link'
import ScrollEffects from '@/components/scroll-effects'

const PLAN_KEYS: Record<string, string> = {
  'Básico': 'BASIC',
  'Profissional': 'PROFESSIONAL',
  'Enterprise': 'ENTERPRISE',
}

const plans = [
  {
    name: 'Básico',
    price: '149',
    desc: 'Para clínicas pequenas que estão começando a organizar a gestão.',
    highlight: false,
    tag: null,
    features: [
      '1 fisioterapeuta',
      'Até 80 pacientes ativos',
      'Agendamento e agenda visual',
      'Prontuário digital',
      'Anamnese completa',
      'Exportação de PDF',
      'Suporte por e-mail',
    ],
    missing: [
      'WhatsApp automático',
      'Gestão financeira',
      'Relatórios avançados',
      'Multi-fisioterapeuta',
    ],
  },
  {
    name: 'Profissional',
    price: '349',
    desc: 'Para clínicas em crescimento que precisam de controle total.',
    highlight: true,
    tag: 'Mais popular',
    features: [
      'Até 5 fisioterapeutas',
      'Pacientes ilimitados',
      'Agendamento e agenda visual',
      'Prontuário digital',
      'Anamnese completa',
      'WhatsApp automático',
      'Gestão financeira completa',
      'Relatórios e exportação CSV',
      'Suporte prioritário',
    ],
    missing: [
      'Multi-clínica',
      'API de integração',
    ],
  },
  {
    name: 'Enterprise',
    price: '799',
    desc: 'Para redes de clínicas com múltiplas unidades e equipes grandes.',
    highlight: false,
    tag: null,
    features: [
      'Fisioterapeutas ilimitados',
      'Pacientes ilimitados',
      'Múltiplas clínicas (multi-tenant)',
      'Agendamento e agenda visual',
      'Prontuário digital',
      'Anamnese completa',
      'WhatsApp automático',
      'Gestão financeira completa',
      'Relatórios avançados + DRE',
      'API de integração',
      'Suporte dedicado com SLA',
      'Onboarding personalizado',
    ],
    missing: [],
  },
]

const faqs = [
  {q:'Posso cancelar a qualquer momento?', a:'Sim. Não há fidelidade nem multa por cancelamento. Você cancela quando quiser pelo próprio painel.'},
  {q:'Como funciona o período de teste?', a:'Todos os planos terão um período gratuito de 14 dias sem precisar de cartão de crédito. Basta criar sua conta e explorar.'},
  {q:'Posso mudar de plano depois?', a:'Sim, você pode fazer upgrade ou downgrade a qualquer momento. O valor é ajustado proporcionalmente ao período restante.'},
  {q:'Os dados ficam seguros?', a:'Sim. Cada clínica tem seu próprio banco de dados isolado. Usamos PostgreSQL hospedado na AWS com backups automáticos diários.'},
  {q:'Tem limite de agendamentos?', a:'Não. O limite é apenas no número de fisioterapeutas e pacientes ativos, conforme o plano. Agendamentos são ilimitados em todos os planos.'},
]

export default function PlanosPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --void:         #030A06;
          --abyss:        #060F09;
          --deep:         #0C1F12;
          --virid:        #00D46B;
          --virid-dim:    rgba(0,212,107,.1);
          --virid-border: rgba(0,212,107,.2);
          --lime:         #B8F000;
          --coral:        #FF4D6D;
          --mist:         #8FA898;
          --white:        #F0FAF4;
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-ui:      'Syne', system-ui, sans-serif;
          --font-mono:    'DM Mono', 'Courier New', monospace;
          --glow:         0 0 48px rgba(0,212,107,.28), 0 0 100px rgba(0,212,107,.1);
          --spring:       cubic-bezier(.34,1.56,.64,1);
          --smooth:       cubic-bezier(.4,0,.2,1);
        }

        #scroll-progress {
          position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 300;
          background: linear-gradient(90deg, var(--virid), var(--lime));
          transform: scaleX(0); transform-origin: left;
        }
        .sr { opacity: 0; transform: translateY(36px); transition: opacity .72s var(--smooth), transform .72s var(--smooth); }
        .sr.d1 { transition-delay: .1s; }
        .sr.d2 { transition-delay: .2s; }
        .sr.d3 { transition-delay: .3s; }
        .sr.d4 { transition-delay: .4s; }
        .sr-visible { opacity: 1 !important; transform: translateY(0) !important; }

        .pl { font-family: var(--font-ui); background: var(--void); color: var(--white); -webkit-font-smoothing: antialiased; }

        /* ── NAV ── */
        .nav {
          position: fixed; inset: 0 0 auto 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 60px; height: 62px;
          background: rgba(3,10,6,.82); backdrop-filter: blur(28px) saturate(1.5);
          border-bottom: 1px solid rgba(0,212,107,.07);
        }
        .nav-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }
        .nav-logo-mark { width: 31px; height: 31px; border-radius: 8px; background: var(--virid); display: flex; align-items: center; justify-content: center; }
        .nav-logo-mark svg { width: 15px; height: 15px; }
        .nav-logo-name { font-family: var(--font-ui); font-size: 15.5px; font-weight: 800; color: var(--white); }
        .nav-logo-name b { color: var(--virid); }
        .nav-right { display: flex; align-items: center; gap: 6px; }
        .nav-ghost {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase;
          color: var(--mist); text-decoration: none; padding: 7px 16px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,.07); transition: color .2s, border-color .2s;
          display: flex; align-items: center; gap: 6px;
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
        .hero-pl {
          padding: 140px 60px 90px; text-align: center; position: relative; overflow: hidden;
          background: var(--void);
        }
        .hero-pl::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(0,212,107,.05) 1px, transparent 1px);
          background-size: 26px 26px;
        }
        .hero-pl::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: repeating-linear-gradient(-54deg, transparent, transparent 90px, rgba(0,212,107,.015) 90px, rgba(0,212,107,.015) 91px);
        }
        .hero-glow {
          position: absolute; width: 800px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,107,.08) 0%, transparent 65%);
          top: -200px; left: 50%; transform: translateX(-50%); pointer-events: none;
        }
        .hero-inner { position: relative; z-index: 1; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 9px;
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--virid);
          border: 1px solid var(--virid-border); border-radius: 100px; padding: 6px 16px; margin-bottom: 36px;
        }
        .badge-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--virid); animation: badgePulse 2.2s ease-in-out infinite; }
        @keyframes badgePulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.55);opacity:.55} }
        .hero-pl h1 {
          font-family: var(--font-display); font-size: clamp(48px, 7vw, 96px);
          font-weight: 400; letter-spacing: -.038em; line-height: .91; color: var(--white); margin-bottom: 24px;
        }
        .hero-pl h1 em { font-style: italic; color: var(--virid); }
        .hero-pl p {
          font-family: var(--font-ui); font-size: 17px; color: var(--mist); line-height: 1.7;
          max-width: 480px; margin: 0 auto;
        }

        /* ── STRIP ── */
        .strip {
          border-top: 1px solid rgba(0,212,107,.07); border-bottom: 1px solid rgba(0,212,107,.07);
          background: var(--abyss); overflow: hidden; padding: 12px 0;
        }
        .strip-track { display: flex; white-space: nowrap; animation: marquee 28s linear infinite; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .strip-item {
          display: inline-flex; align-items: center; gap: 8px; padding: 0 28px;
          border-right: 1px solid rgba(0,212,107,.07);
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase;
          color: var(--mist); white-space: nowrap; flex-shrink: 0;
        }
        .s-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--virid); opacity: .5; }

        /* ── PLANS SECTION ── */
        .plans-section { padding: 90px 60px; background: var(--abyss); }
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 1100px; margin: 0 auto; }

        .plan-card {
          background: var(--deep); border: 1px solid rgba(0,212,107,.1);
          border-radius: 20px; padding: 36px 32px;
          display: flex; flex-direction: column; position: relative; overflow: hidden;
          transition: border-color .3s, transform .3s var(--spring);
        }
        .plan-card:hover { border-color: var(--virid-border); transform: translateY(-4px); }
        .plan-card.featured {
          background: var(--deep); border-color: var(--virid);
          box-shadow: 0 0 0 1px rgba(0,212,107,.15), 0 24px 64px rgba(0,212,107,.1);
        }
        .plan-card.featured::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--virid), transparent);
        }
        .plan-card.featured:hover { transform: translateY(-6px); }

        .plan-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-mono); font-size: 9.5px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase;
          background: rgba(0,212,107,.12); color: var(--virid); border: 1px solid var(--virid-border);
          padding: 4px 12px; border-radius: 100px; margin-bottom: 22px; width: fit-content;
        }

        .plan-name {
          font-family: var(--font-ui); font-size: 13px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--mist); margin-bottom: 12px;
        }
        .plan-price-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
        .plan-currency { font-family: var(--font-mono); font-size: 16px; color: var(--mist); padding-top: 8px; }
        .plan-amount {
          font-family: var(--font-display); font-size: clamp(52px, 5.5vw, 72px);
          font-weight: 400; letter-spacing: -.04em; line-height: 1; color: var(--white);
        }
        .plan-card.featured .plan-amount { color: var(--virid); }
        .plan-period {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .08em;
          text-transform: uppercase; color: var(--mist); margin-bottom: 20px;
        }
        .plan-desc { font-family: var(--font-ui); font-size: 13.5px; color: var(--mist); line-height: 1.65; margin-bottom: 28px; flex: 1; }

        .plan-cta {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px; border-radius: 100px; font-family: var(--font-mono);
          font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase;
          text-decoration: none; transition: all .2s; margin-bottom: 28px;
          border: 1px solid rgba(255,255,255,.1); color: var(--mist);
        }
        .plan-cta:hover { border-color: var(--virid-border); color: var(--virid); }
        .plan-card.featured .plan-cta {
          background: var(--virid); color: var(--void); border-color: var(--virid);
          font-family: var(--font-ui); font-size: 13px; font-weight: 700; letter-spacing: 0; text-transform: none;
        }
        .plan-card.featured .plan-cta:hover { transform: translateY(-2px); box-shadow: var(--glow); }

        .plan-divider { height: 1px; background: rgba(0,212,107,.08); margin-bottom: 22px; }
        .plan-features-label {
          font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;
          color: rgba(143,168,152,.4); margin-bottom: 14px;
        }
        .plan-features { display: flex; flex-direction: column; gap: 9px; margin-bottom: 18px; }
        .plan-feat {
          display: flex; align-items: flex-start; gap: 10px;
          font-family: var(--font-ui); font-size: 13.5px; font-weight: 500; color: rgba(240,250,244,.7); line-height: 1.4;
        }
        .feat-check {
          width: 17px; height: 17px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
          display: flex; align-items: center; justify-content: center; font-size: 9px;
          background: rgba(0,212,107,.12); color: var(--virid);
        }
        .plan-card.featured .feat-check { background: rgba(0,212,107,.18); }

        .plan-missing { display: flex; flex-direction: column; gap: 9px; }
        .plan-miss {
          display: flex; align-items: flex-start; gap: 10px;
          font-family: var(--font-ui); font-size: 13.5px; color: rgba(143,168,152,.3); line-height: 1.4;
        }
        .miss-x {
          width: 17px; height: 17px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
          display: flex; align-items: center; justify-content: center; font-size: 9px;
          background: rgba(255,255,255,.04); color: rgba(143,168,152,.3);
        }

        .plans-note {
          text-align: center; padding: 24px 60px 0;
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .08em;
          text-transform: uppercase; color: rgba(143,168,152,.35);
        }

        /* ── FAQ ── */
        .faq-section { padding: 100px 60px; max-width: 820px; margin: 0 auto; }
        .faq-eyebrow {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .2em; text-transform: uppercase; color: var(--virid);
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
        }
        .faq-eyebrow::before { content: ''; width: 28px; height: 1px; background: var(--virid); display: block; }
        .faq-h2 {
          font-family: var(--font-display); font-size: clamp(38px, 5vw, 64px);
          font-weight: 400; letter-spacing: -.028em; line-height: .95; color: var(--white); margin-bottom: 52px;
        }
        .faq-h2 em { font-style: italic; color: var(--virid); }
        .faq-list { display: flex; flex-direction: column; }
        .faq-item { border-bottom: 1px solid rgba(0,212,107,.08); padding: 26px 0; }
        .faq-item:first-child { border-top: 1px solid rgba(0,212,107,.08); }
        .faq-q {
          font-family: var(--font-ui); font-size: 16.5px; font-weight: 700;
          color: var(--white); margin-bottom: 10px; letter-spacing: -.2px;
        }
        .faq-a { font-family: var(--font-ui); font-size: 14.5px; color: var(--mist); line-height: 1.72; }

        /* ── BOTTOM CTA ── */
        .bottom-cta {
          padding: 120px 60px; text-align: center; background: var(--abyss); position: relative; overflow: hidden;
        }
        .bottom-cta::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 100%, rgba(0,212,107,.1) 0%, transparent 60%);
        }
        .bottom-inner { position: relative; z-index: 1; }
        .bottom-cta h2 {
          font-family: var(--font-display); font-size: clamp(40px, 6vw, 80px);
          font-weight: 400; letter-spacing: -.035em; line-height: .91; color: var(--white); margin-bottom: 20px;
        }
        .bottom-cta h2 em { font-style: italic; color: transparent; -webkit-text-stroke: 1px rgba(0,212,107,.6); }
        .bottom-cta p {
          font-family: var(--font-ui); font-size: 16px; color: var(--mist); line-height: 1.7;
          max-width: 400px; margin: 0 auto 44px;
        }
        .btn-lime {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-ui); font-size: 14px; font-weight: 700;
          padding: 14px 32px; border-radius: 100px; background: var(--lime); color: var(--void);
          text-decoration: none; transition: transform .25s var(--spring), box-shadow .25s;
        }
        .btn-lime:hover { transform: translateY(-3px); box-shadow: 0 0 48px rgba(184,240,0,.28), 0 0 100px rgba(184,240,0,.1); }

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

        @media(max-width:960px) {
          .nav { padding: 0 28px; }
          .hero-pl { padding: 110px 28px 60px; }
          .plans-section { padding: 60px 28px; }
          .plans-grid { grid-template-columns: 1fr; max-width: 480px; }
          .faq-section { padding: 72px 28px; }
          .bottom-cta { padding: 72px 28px; }
          .footer { padding: 36px 28px; flex-direction: column; align-items: flex-start; }
          .plans-note { padding: 20px 28px 0; }
        }
      `}</style>

      <div className="pl">
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
            <Link href="/" className="nav-ghost">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Voltar
            </Link>
            <Link href="/login" className="nav-cta">Entrar</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero-pl">
          <div className="hero-glow" />
          <div className="hero-inner">
            <div className="hero-badge sr">
              <span className="badge-pulse" />
              Planos e preços
            </div>
            <h1 className="sr d1">Simples de entender.<br /><em>Honesto</em> no preço.</h1>
            <p className="sr d2">Escolha o plano certo para o tamanho da sua clínica. Sem letra miúda, sem cobranças escondidas.</p>
          </div>
        </section>

        {/* ── STRIP ── */}
        <div className="strip">
          <div className="strip-track">
            {[
              'Sem contrato','Cancele quando quiser','Sem taxa de setup','14 dias grátis','Suporte incluso','Dados seguros','Backups diários','Multi-tenant',
              'Sem contrato','Cancele quando quiser','Sem taxa de setup','14 dias grátis','Suporte incluso','Dados seguros','Backups diários','Multi-tenant',
            ].map((t, i) => (
              <div key={i} className="strip-item"><span className="s-dot" />{t}</div>
            ))}
          </div>
        </div>

        {/* ── PLANS ── */}
        <section className="plans-section">
          <div className="plans-grid">
            {plans.map((plan, pi) => (
              <div key={plan.name} className={`plan-card${plan.highlight ? ' featured' : ''} sr d${pi + 1}`}>
                {plan.tag && (
                  <div className="plan-tag">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="currentColor"/></svg>
                    {plan.tag}
                  </div>
                )}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price-row">
                  <span className="plan-currency">R$</span>
                  <span className="plan-amount">{plan.price}</span>
                </div>
                <div className="plan-period">por mês · cobrado mensalmente</div>
                <p className="plan-desc">{plan.desc}</p>

                <Link
                  href={`/cadastro?plan=${PLAN_KEYS[plan.name] ?? 'BASIC'}`}
                  className="plan-cta"
                >
                  {plan.highlight ? 'Começar 14 dias grátis →' : 'Começar grátis →'}
                </Link>

                <div className="plan-divider" />
                <div className="plan-features-label">O que está incluído</div>
                <div className="plan-features">
                  {plan.features.map((f) => (
                    <div key={f} className="plan-feat">
                      <div className="feat-check">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
                {plan.missing.length > 0 && (
                  <div className="plan-missing">
                    {plan.missing.map((f) => (
                      <div key={f} className="plan-miss">
                        <div className="miss-x">✕</div>
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="plans-note">Todos os valores em reais (BRL) · Planos anuais com 20% de desconto</p>
        </section>

        {/* ── FAQ ── */}
        <section className="faq-section">
          <div className="faq-eyebrow sr">Dúvidas frequentes</div>
          <h2 className="faq-h2 sr d1">Perguntas que<br /><em>todo mundo faz.</em></h2>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div key={f.q} className={`faq-item sr d${(i % 3) + 1}`}>
                <div className="faq-q">{f.q}</div>
                <p className="faq-a">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="bottom-cta">
          <div className="bottom-inner">
            <h2 className="sr">Ainda com<br /><em>dúvidas?</em></h2>
            <p className="sr d1">Entre em contato ou acesse o painel para conhecer a plataforma por dentro.</p>
            <Link href="/login" className="btn-lime sr d2">
              Acessar plataforma
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
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
