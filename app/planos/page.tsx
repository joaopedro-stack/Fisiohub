import Link from 'next/link'

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
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

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

        .pl { font-family:'Bricolage Grotesque',sans-serif; background:var(--white); color:var(--ink); -webkit-font-smoothing:antialiased; }

        /* NAV */
        .nav {
          position:fixed;inset:0 0 auto 0;z-index:100;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 56px;height:68px;
          background:rgba(255,255,255,.92);
          backdrop-filter:blur(20px) saturate(1.8);
          border-bottom:1px solid var(--border);
        }
        .nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
        .nav-logo-icon{width:34px;height:34px;border-radius:9px;background:var(--ink);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .nav-logo-icon svg{width:17px;height:17px}
        .nav-logo-name{font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-0.5px}
        .nav-logo-name b{color:var(--green-2)}
        .nav-right{display:flex;align-items:center;gap:10px}
        .nav-back{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:600;color:var(--ink-soft);text-decoration:none;border:1.5px solid var(--border);transition:all .18s;font-family:inherit}
        .nav-back:hover{border-color:var(--green-3);color:var(--green)}
        .nav-enter{display:flex;align-items:center;gap:7px;padding:9px 20px;border-radius:8px;font-size:14px;font-weight:700;color:var(--white);background:var(--green);text-decoration:none;font-family:inherit;transition:all .18s}
        .nav-enter:hover{background:var(--green-2);transform:translateY(-1px);box-shadow:0 4px 18px rgba(26,107,60,.35)}

        /* HERO */
        .hero-pl {
          padding:140px 56px 80px;text-align:center;
          background:var(--dark);
          background-image:
            radial-gradient(ellipse at 30% 60%,rgba(45,148,89,.2) 0%,transparent 55%),
            radial-gradient(ellipse at 75% 20%,rgba(198,241,53,.08) 0%,transparent 50%);
        }
        .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:100px;padding:6px 16px 6px 10px;font-size:12px;font-weight:700;color:var(--green-3);letter-spacing:.8px;text-transform:uppercase;margin-bottom:28px}
        .hero-eyebrow-dot{width:7px;height:7px;border-radius:50%;background:var(--green-3);animation:pulse 2s ease-in-out infinite}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.7}}
        .hero-pl h1{font-size:clamp(42px,6vw,76px);font-weight:800;letter-spacing:-3px;line-height:1.05;color:white;margin-bottom:20px}
        .hero-pl h1 em{color:var(--lime);font-style:normal}
        .hero-pl p{font-size:18px;color:rgba(255,255,255,.5);max-width:480px;margin:0 auto;line-height:1.7}

        /* TOGGLE */
        .toggle-wrap{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:36px}
        .toggle-label{font-size:14px;font-weight:600;color:rgba(255,255,255,.5)}
        .toggle-label.active{color:rgba(255,255,255,.9)}
        .annual-badge{font-size:11px;font-weight:700;background:var(--lime);color:var(--ink);padding:3px 8px;border-radius:6px}

        /* PLANS */
        .plans-section{padding:80px 56px;background:var(--surface)}
        .plans-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:1100px;margin:0 auto}

        .plan-card{
          background:var(--white);border:1.5px solid var(--border);
          border-radius:20px;padding:36px;
          display:flex;flex-direction:column;gap:0;
          position:relative;overflow:hidden;
          transition:all .22s;
        }
        .plan-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(11,28,19,.1)}
        .plan-card.featured{
          background:var(--ink);border-color:var(--ink);
          transform:scale(1.025);
          box-shadow:0 24px 64px rgba(11,28,19,.25);
        }
        .plan-card.featured:hover{transform:scale(1.025) translateY(-4px)}

        .plan-tag{
          display:inline-flex;align-items:center;gap:6px;
          background:var(--lime);color:var(--ink);
          font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;
          padding:4px 12px;border-radius:100px;margin-bottom:20px;width:fit-content;
        }
        .plan-name{font-size:22px;font-weight:800;color:var(--ink);margin-bottom:8px}
        .plan-card.featured .plan-name{color:white}
        .plan-desc{font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:28px}
        .plan-card.featured .plan-desc{color:rgba(255,255,255,.5)}

        .plan-price{margin-bottom:28px}
        .plan-price-row{display:flex;align-items:baseline;gap:4px}
        .plan-currency{font-size:20px;font-weight:700;color:var(--muted);margin-top:6px}
        .plan-card.featured .plan-currency{color:rgba(255,255,255,.5)}
        .plan-amount{font-size:clamp(48px,5vw,64px);font-weight:800;color:var(--ink);letter-spacing:-3px;line-height:1}
        .plan-card.featured .plan-amount{color:white}
        .plan-period{font-size:13px;color:var(--muted);font-weight:500;margin-top:6px}
        .plan-card.featured .plan-period{color:rgba(255,255,255,.4)}

        .plan-cta{
          display:flex;align-items:center;justify-content:center;gap:8px;
          padding:14px;border-radius:12px;font-size:15px;font-weight:700;
          text-decoration:none;font-family:inherit;transition:all .2s;margin-bottom:28px;
          background:var(--surface);color:var(--ink);border:1.5px solid var(--border);
          cursor:not-allowed;opacity:.8;
        }
        .plan-card.featured .plan-cta{background:var(--lime);color:var(--ink);border-color:var(--lime)}
        .plan-divider{height:1px;background:var(--border);margin-bottom:24px}
        .plan-card.featured .plan-divider{background:rgba(255,255,255,.1)}

        .plan-features-label{font-size:11px;font-weight:700;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px}
        .plan-card.featured .plan-features-label{color:rgba(255,255,255,.35)}
        .plan-features{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
        .plan-feat{display:flex;align-items:flex-start;gap:10px;font-size:14px;font-weight:500;color:var(--ink-soft);line-height:1.4}
        .plan-card.featured .plan-feat{color:rgba(255,255,255,.75)}
        .feat-check{width:18px;height:18px;border-radius:50%;background:rgba(45,148,89,.15);color:var(--green-2);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:10px}
        .plan-card.featured .feat-check{background:rgba(198,241,53,.15);color:var(--lime)}
        .plan-missing{display:flex;flex-direction:column;gap:10px}
        .plan-miss{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--muted);opacity:.6}
        .miss-x{width:18px;height:18px;border-radius:50%;background:rgba(113,140,124,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:10px;color:var(--muted)}

        /* COMPARE NOTE */
        .compare-note{text-align:center;padding:20px 56px 0;font-size:14px;color:var(--muted)}

        /* FAQ */
        .faq-section{padding:100px 56px;background:var(--white);max-width:800px;margin:0 auto}
        .faq-section .label-tag{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--green-2);margin-bottom:16px;display:block}
        .faq-h2{font-size:clamp(32px,4vw,48px);font-weight:800;letter-spacing:-2px;line-height:1.08;color:var(--ink);margin-bottom:48px}
        .faq-list{display:flex;flex-direction:column;gap:0}
        .faq-item{border-bottom:1.5px solid var(--border);padding:24px 0}
        .faq-item:first-child{border-top:1.5px solid var(--border)}
        .faq-q{font-size:17px;font-weight:700;color:var(--ink);margin-bottom:10px}
        .faq-a{font-size:15px;color:var(--muted);line-height:1.7}

        /* BOTTOM CTA */
        .bottom-cta{
          padding:80px 56px;text-align:center;
          background:var(--dark);
          background-image:radial-gradient(ellipse at 50% 100%,rgba(45,148,89,.2) 0%,transparent 60%);
        }
        .bottom-cta h2{font-size:clamp(32px,4vw,52px);font-weight:800;letter-spacing:-2px;line-height:1.1;color:white;margin-bottom:16px}
        .bottom-cta p{font-size:17px;color:rgba(255,255,255,.45);margin-bottom:36px;max-width:420px;margin-left:auto;margin-right:auto;line-height:1.7}
        .btn-lime{display:inline-flex;align-items:center;gap:8px;padding:15px 32px;border-radius:12px;font-size:16px;font-weight:700;background:var(--lime);color:var(--ink);text-decoration:none;font-family:inherit;transition:all .2s}
        .btn-lime:hover{background:#d8f94a;transform:translateY(-2px);box-shadow:0 12px 36px rgba(0,0,0,.4)}

        /* FOOTER */
        .footer{background:#040d07;padding:40px 56px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;border-top:1px solid rgba(255,255,255,.05)}
        .footer-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
        .footer-brand-icon{width:28px;height:28px;border-radius:7px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center}
        .footer-brand-icon svg{width:14px;height:14px}
        .footer-brand-name{font-size:15px;font-weight:700;color:rgba(255,255,255,.5)}
        .footer-copy{font-size:13px;color:rgba(255,255,255,.2)}

        /* RESPONSIVE */
        @media(max-width:960px){
          .nav{padding:0 24px}
          .hero-pl{padding:110px 24px 60px}
          .plans-section{padding:60px 24px}
          .plans-grid{grid-template-columns:1fr;max-width:480px}
          .plan-card.featured{transform:none}
          .plan-card.featured:hover{transform:translateY(-4px)}
          .faq-section{padding:64px 24px}
          .bottom-cta{padding:60px 24px}
          .footer{padding:32px 24px;flex-direction:column;text-align:center}
        }
      `}</style>

      <div className="pl">

        {/* NAV */}
        <nav className="nav">
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">
              <svg viewBox="0 0 17 17" fill="none"><path d="M8.5 2v5.5M8.5 9.5V15M2 8.5h5.5M9.5 8.5H15" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="8.5" cy="8.5" r="2" fill="white"/></svg>
            </div>
            <span className="nav-logo-name">Fisio<b>Hub</b></span>
          </a>
          <div className="nav-right">
            <Link href="/" className="nav-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Voltar
            </Link>
            <Link href="/login" className="nav-enter">
              Entrar
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero-pl">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot"/>
            Planos e preços
          </div>
          <h1>Simples de entender.<br /><em>Honesto</em> no preço.</h1>
          <p>Escolha o plano certo para o tamanho da sua clínica. Sem letra miúda, sem cobranças escondidas.</p>
        </section>

        {/* PLANS */}
        <section className="plans-section">
          <div className="plans-grid">
            {plans.map((plan) => (
              <div key={plan.name} className={`plan-card${plan.highlight ? ' featured' : ''}`}>
                {plan.tag && <div className="plan-tag">⭐ {plan.tag}</div>}
                <div className="plan-name">{plan.name}</div>
                <p className="plan-desc">{plan.desc}</p>

                <div className="plan-price">
                  <div className="plan-price-row">
                    <span className="plan-currency">R$</span>
                    <span className="plan-amount">{plan.price}</span>
                  </div>
                  <div className="plan-period">por mês · cobrado mensalmente</div>
                </div>

                <div className="plan-cta" title="Em breve">
                  Em breve — lista de espera
                </div>

                <div className="plan-divider"/>

                <div className="plan-features-label">O que está incluído</div>
                <div className="plan-features">
                  {plan.features.map(f => (
                    <div key={f} className="plan-feat">
                      <div className="feat-check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      {f}
                    </div>
                  ))}
                </div>

                {plan.missing.length > 0 && (
                  <div className="plan-missing">
                    {plan.missing.map(f => (
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
          <p className="compare-note">Todos os valores em reais (BRL). Planos com faturamento anual terão desconto de 20%.</p>
        </section>

        {/* FAQ */}
        <section className="faq-section">
          <span className="label-tag">Dúvidas frequentes</span>
          <h2 className="faq-h2">Perguntas que<br />todo mundo faz.</h2>
          <div className="faq-list">
            {faqs.map(f => (
              <div key={f.q} className="faq-item">
                <div className="faq-q">{f.q}</div>
                <p className="faq-a">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="bottom-cta">
          <h2>Ainda com dúvidas?</h2>
          <p>Entre em contato ou acesse o painel administrativo para conhecer a plataforma por dentro.</p>
          <Link href="/login" className="btn-lime">
            Acessar plataforma
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </section>

        {/* FOOTER */}
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
