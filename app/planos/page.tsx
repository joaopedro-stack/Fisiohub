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
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Não há fidelidade nem multa por cancelamento. Você cancela quando quiser pelo próprio painel.' },
  { q: 'Como funciona o período de teste?', a: 'Todos os planos terão um período gratuito de 14 dias sem precisar de cartão de crédito. Basta criar sua conta e explorar.' },
  { q: 'Posso mudar de plano depois?', a: 'Sim, você pode fazer upgrade ou downgrade a qualquer momento. O valor é ajustado proporcionalmente ao período restante.' },
  { q: 'Os dados ficam seguros?', a: 'Sim. Cada clínica tem seu próprio banco de dados isolado. Usamos PostgreSQL hospedado na AWS com backups automáticos diários.' },
  { q: 'Tem limite de agendamentos?', a: 'Não. O limite é apenas no número de fisioterapeutas e pacientes ativos, conforme o plano. Agendamentos são ilimitados em todos os planos.' },
]

export default function PlanosPage() {
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

        #scroll-progress {
          position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 300;
          background: linear-gradient(90deg, var(--forest), var(--forest-lite));
          transform: scaleX(0); transform-origin: left;
        }

        .sr { opacity: 0; transform: translateY(36px); transition: opacity .72s var(--smooth), transform .72s var(--smooth); }
        .sr.d1 { transition-delay: .1s; }
        .sr.d2 { transition-delay: .2s; }
        .sr.d3 { transition-delay: .3s; }
        .sr.d4 { transition-delay: .4s; }
        .sr-visible { opacity: 1 !important; transform: translateY(0) !important; }

        .pl { font-family: var(--font-ui); background: var(--cream); color: var(--ink); -webkit-font-smoothing: antialiased; }

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
          display: flex; align-items: center; justify-content: center;
        }
        .nav-logo-mark svg { width: 15px; height: 15px; }
        .nav-logo-name { font-size: 16px; font-weight: 800; color: var(--ink); letter-spacing: -.3px; }
        .nav-logo-name b { color: var(--forest); }
        .nav-right { display: flex; align-items: center; gap: 6px; }
        .nav-link {
          display: flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 600; color: var(--ink-2);
          text-decoration: none; padding: 8px 16px; border-radius: 100px;
          transition: color .2s, background .2s;
        }
        .nav-link:hover { color: var(--forest); background: var(--sage-bg); }
        .nav-cta {
          font-size: 14px; font-weight: 700;
          padding: 9px 20px; border-radius: 100px; background: var(--forest); color: var(--white);
          text-decoration: none; transition: transform .25s var(--spring), box-shadow .25s, background .2s;
        }
        .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(27,74,52,.25); background: var(--forest-mid); }

        /* ── HERO ── */
        .hero-pl {
          padding: 140px 64px 90px; text-align: center; position: relative; overflow: hidden;
          background: var(--cream);
        }
        .hero-pl::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(27,74,52,.05) 1.2px, transparent 1.2px);
          background-size: 28px 28px;
        }
        .hero-glow {
          position: absolute; width: 800px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(75,150,104,.1) 0%, transparent 65%);
          top: -200px; left: 50%; transform: translateX(-50%); pointer-events: none;
        }
        .hero-inner { position: relative; z-index: 1; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--forest); background: var(--sage-bg);
          border: 1px solid rgba(27,74,52,.15); border-radius: 100px;
          padding: 6px 16px 6px 12px; margin-bottom: 36px;
        }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--forest-lite); animation: pulse 2.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:.55} }
        .hero-pl h1 {
          font-family: var(--font-d); font-size: clamp(48px, 7vw, 92px);
          font-weight: 700; letter-spacing: -.038em; line-height: .91; color: var(--ink); margin-bottom: 24px;
        }
        .hero-pl h1 em { font-style: italic; color: var(--forest); }
        .hero-pl p {
          font-size: 17px; font-weight: 500; color: var(--ink-2); line-height: 1.7;
          max-width: 480px; margin: 0 auto;
        }

        /* ── STRIP ── */
        .strip {
          background: var(--sage-bg);
          border-top: 1px solid rgba(27,74,52,.09);
          border-bottom: 1px solid rgba(27,74,52,.09);
          overflow: hidden; padding: 13px 0;
        }
        .strip-track { display: flex; white-space: nowrap; animation: marquee 28s linear infinite; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .strip-item {
          display: inline-flex; align-items: center; gap: 8px; padding: 0 28px;
          border-right: 1px solid rgba(27,74,52,.1);
          font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
          color: var(--forest-mid); white-space: nowrap; flex-shrink: 0;
        }
        .s-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--forest-lite); flex-shrink: 0; }

        /* ── PLANS SECTION ── */
        .plans-section { padding: 90px 64px; background: var(--cream); position: relative; }
        .plans-section::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(27,74,52,.038) 1.2px, transparent 1.2px);
          background-size: 28px 28px;
        }
        .plans-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
          max-width: 1100px; margin: 0 auto; position: relative; z-index: 1;
        }

        .plan-card {
          background: #EDE8DF; border: 1.5px solid rgba(27,74,52,.1);
          border-radius: 22px; padding: 36px 30px;
          display: flex; flex-direction: column; position: relative; overflow: hidden;
          transition: border-color .3s, transform .3s var(--spring), box-shadow .3s;
        }
        .plan-card:hover { border-color: rgba(27,74,52,.18); transform: translateY(-5px); box-shadow: var(--sh-md); }

        .plan-card.featured {
          background: #F2EDE5;
          border-color: var(--forest);
          box-shadow: 0 0 0 1px rgba(27,74,52,.12), var(--sh-lg);
        }
        .plan-card.featured::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--forest), var(--forest-lite));
        }
        .plan-card.featured:hover { transform: translateY(-7px); }

        .plan-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          background: var(--sage-bg); color: var(--forest);
          border: 1px solid rgba(27,74,52,.15);
          padding: 4px 12px; border-radius: 100px; margin-bottom: 22px; width: fit-content;
        }

        .plan-name {
          font-size: 11.5px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--ink-3); margin-bottom: 12px;
        }
        .plan-price-row { display: flex; align-items: baseline; gap: 3px; margin-bottom: 4px; }
        .plan-currency { font-size: 16px; font-weight: 700; color: var(--ink-3); padding-top: 10px; }
        .plan-amount {
          font-family: var(--font-d); font-size: clamp(52px, 5.5vw, 72px);
          font-weight: 700; letter-spacing: -.04em; line-height: 1; color: var(--ink);
        }
        .plan-card.featured .plan-amount { color: var(--forest); }
        .plan-period {
          font-size: 11px; font-weight: 600; letter-spacing: .06em;
          text-transform: uppercase; color: var(--ink-3); margin-bottom: 18px;
        }
        .plan-desc { font-size: 13.5px; font-weight: 500; color: var(--ink-2); line-height: 1.65; margin-bottom: 28px; flex: 1; }

        .plan-cta {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px; border-radius: 100px;
          font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
          text-decoration: none; transition: all .2s; margin-bottom: 28px;
          border: 1.5px solid rgba(27,74,52,.18); color: var(--ink-2);
        }
        .plan-cta:hover { border-color: var(--forest); color: var(--forest); background: var(--sage-bg); }

        .plan-card.featured .plan-cta {
          background: var(--forest); color: var(--white); border-color: var(--forest);
          font-size: 14px; font-weight: 700; letter-spacing: 0; text-transform: none;
        }
        .plan-card.featured .plan-cta:hover { background: var(--forest-mid); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(27,74,52,.3); }

        .plan-divider { height: 1px; background: rgba(27,74,52,.08); margin-bottom: 20px; }
        .plan-features-label {
          font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          color: rgba(138,148,144,.5); margin-bottom: 14px;
        }
        .plan-features { display: flex; flex-direction: column; gap: 9px; margin-bottom: 16px; }
        .plan-feat {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13.5px; font-weight: 500; color: var(--ink-2); line-height: 1.4;
        }
        .feat-check {
          width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
          display: flex; align-items: center; justify-content: center; font-size: 9px;
          background: var(--sage-bg); color: var(--forest);
        }
        .plan-card.featured .feat-check { background: rgba(27,74,52,.1); }

        .plan-missing { display: flex; flex-direction: column; gap: 9px; }
        .plan-miss {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13.5px; color: rgba(138,148,144,.45); line-height: 1.4;
        }
        .miss-x {
          width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
          display: flex; align-items: center; justify-content: center; font-size: 9px;
          background: rgba(27,74,52,.04); color: rgba(138,148,144,.4);
        }

        .plans-note {
          text-align: center; padding: 24px 64px 0;
          font-size: 11.5px; font-weight: 600; letter-spacing: .06em;
          text-transform: uppercase; color: rgba(138,148,144,.5);
          position: relative; z-index: 1;
        }

        /* ── FAQ ── */
        .faq-section { padding: 100px 64px; max-width: 820px; margin: 0 auto; }
        .faq-eyebrow {
          font-size: 11.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--forest); display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
        }
        .faq-eyebrow::before { content: ''; width: 22px; height: 2px; background: var(--forest-lite); display: block; border-radius: 2px; }
        .faq-h2 {
          font-family: var(--font-d); font-size: clamp(36px, 5vw, 60px);
          font-weight: 700; letter-spacing: -.025em; line-height: .93; color: var(--ink); margin-bottom: 52px;
        }
        .faq-h2 em { font-style: italic; color: var(--forest); }
        .faq-list { display: flex; flex-direction: column; }
        .faq-item {
          border-bottom: 1px solid rgba(27,74,52,.08); padding: 28px 0;
          transition: background .2s;
        }
        .faq-item:first-child { border-top: 1px solid rgba(27,74,52,.08); }
        .faq-q {
          font-family: var(--font-d); font-size: 17px; font-weight: 700;
          color: var(--ink); margin-bottom: 10px;
        }
        .faq-a { font-size: 14.5px; font-weight: 500; color: var(--ink-2); line-height: 1.72; }

        /* ── BOTTOM CTA ── */
        .bottom-cta {
          padding: 120px 64px; text-align: center;
          background: var(--forest); position: relative; overflow: hidden;
        }
        .bottom-blob-1 {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(75,150,104,.3) 0%, transparent 70%);
          top: -150px; right: -100px; pointer-events: none;
        }
        .bottom-blob-2 {
          position: absolute; width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(123,170,136,.2) 0%, transparent 70%);
          bottom: -100px; left: -60px; pointer-events: none;
        }
        .bottom-inner { position: relative; z-index: 1; }
        .bottom-cta h2 {
          font-family: var(--font-d); font-size: clamp(40px, 6vw, 76px);
          font-weight: 700; letter-spacing: -.035em; line-height: .91; color: var(--white); margin-bottom: 20px;
        }
        .bottom-cta h2 em { font-style: italic; color: rgba(178,202,185,.9); }
        .bottom-cta p {
          font-size: 16px; font-weight: 500; color: rgba(178,202,185,.75); line-height: 1.7;
          max-width: 400px; margin: 0 auto 44px;
        }
        .btn-white {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 700;
          padding: 14px 32px; border-radius: 100px; background: var(--white); color: var(--forest);
          text-decoration: none; transition: transform .25s var(--spring), box-shadow .25s;
        }
        .btn-white:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,.2); }

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

        @media(max-width:960px) {
          .nav { padding: 0 24px; }
          .hero-pl { padding: 110px 24px 60px; }
          .plans-section { padding: 60px 24px; }
          .plans-grid { grid-template-columns: 1fr; max-width: 480px; }
          .faq-section { padding: 72px 24px; }
          .bottom-cta { padding: 72px 24px; }
          .footer { padding: 36px 24px; flex-direction: column; align-items: flex-start; }
          .plans-note { padding: 20px 24px 0; }
        }
      `}</style>

      <div className="pl">
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
            <Link href="/" className="nav-link">
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
              <span className="badge-dot" />
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
              'Sem contrato', 'Cancele quando quiser', 'Sem taxa de setup', '14 dias grátis',
              'Suporte incluso', 'Dados seguros', 'Backups diários', 'Multi-tenant',
              'Sem contrato', 'Cancele quando quiser', 'Sem taxa de setup', '14 dias grátis',
              'Suporte incluso', 'Dados seguros', 'Backups diários', 'Multi-tenant',
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
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="2.5" fill="currentColor"/></svg>
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

                <Link href={`/cadastro?plan=${PLAN_KEYS[plan.name] ?? 'BASIC'}`} className="plan-cta">
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
          <div className="bottom-blob-1" />
          <div className="bottom-blob-2" />
          <div className="bottom-inner">
            <h2 className="sr">Ainda com<br /><em>dúvidas?</em></h2>
            <p className="sr d1">Entre em contato ou acesse o painel para conhecer a plataforma por dentro.</p>
            <Link href="/login" className="btn-white sr d2">
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
