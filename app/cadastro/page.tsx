'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres', test: (v: string) => v.length >= 8 },
  { label: 'Uma letra maiúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Um número', test: (v: string) => /[0-9]/.test(v) },
  { label: 'Um símbolo (!@#$...)', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
]

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

const PLAN_INFO: Record<string, { name: string; price: string; color: string }> = {
  BASIC: { name: 'Básico', price: 'R$ 149/mês', color: '#8FA898' },
  PROFESSIONAL: { name: 'Profissional', price: 'R$ 349/mês', color: '#00D46B' },
  ENTERPRISE: { name: 'Enterprise', price: 'R$ 799/mês', color: '#B8F000' },
}

function CadastroForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planKey = (searchParams.get('plan') ?? 'BASIC').toUpperCase() as keyof typeof PLAN_INFO
  const plan = PLAN_INFO[planKey] ?? PLAN_INFO.BASIC

  const [values, setValues] = useState({
    clinicName: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [clinicSlug, setClinicSlug] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  function set(field: string, value: string) {
    setValues(v => ({ ...v, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validatePassword(pwd: string): string | null {
    if (pwd.length < 8) return 'Mínimo 8 caracteres'
    if (!/[A-Z]/.test(pwd)) return 'Precisa de uma letra maiúscula'
    if (!/[0-9]/.test(pwd)) return 'Precisa de um número'
    if (!/[^a-zA-Z0-9]/.test(pwd)) return 'Precisa de um símbolo (!@#$...)'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const pwdError = validatePassword(values.password)
    if (pwdError) { setErrors({ password: pwdError }); return }
    if (values.password !== values.confirmPassword) {
      setErrors({ confirmPassword: 'As senhas não coincidem' })
      return
    }

    setLoading(true)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, plan: planKey }),
    })

    let data: Record<string, unknown> = {}
    try {
      data = await res.json()
    } catch {
      setErrors({ _general: 'Erro de comunicação com o servidor. Tente novamente.' })
      setLoading(false)
      return
    }

    if (!res.ok) {
      const fieldErrors: Record<string, string> = {}
      if (data.error && typeof data.error === 'object' && !Array.isArray(data.error)) {
        for (const [k, v] of Object.entries(data.error as Record<string, string[]>)) {
          fieldErrors[k] = v[0]
        }
      } else {
        fieldErrors._general = (data.error as string) ?? 'Erro ao criar conta'
      }
      setErrors(fieldErrors)
      setLoading(false)
      return
    }

    setClinicSlug(data.slug as string)
    setSuccess(true)
    setTimeout(() => {
      router.push(`/login?slug=${data.slug}`)
    }, 3000)
  }

  return (
    <div className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --void: #030A06; --abyss: #060F09; --deep: #0C1F12;
          --virid: #00D46B; --virid-dim: rgba(0,212,107,.1); --virid-border: rgba(0,212,107,.2);
          --mist: #8FA898; --white: #F0FAF4;
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-ui: 'Syne', system-ui, sans-serif;
          --font-mono: 'DM Mono', 'Courier New', monospace;
          --glow: 0 0 48px rgba(0,212,107,.28), 0 0 100px rgba(0,212,107,.1);
          --spring: cubic-bezier(.34,1.56,.64,1);
        }

        .page { font-family: var(--font-ui); background: var(--void); color: var(--white);
          min-height: 100vh; -webkit-font-smoothing: antialiased;
          display: flex; flex-direction: column;
        }

        .nav {
          position: fixed; inset: 0 0 auto 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 60px; height: 62px;
          background: rgba(3,10,6,.82); backdrop-filter: blur(28px) saturate(1.5);
          border-bottom: 1px solid rgba(0,212,107,.07);
        }
        .nav-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }
        .nav-logo-mark { width: 31px; height: 31px; border-radius: 8px; background: var(--virid);
          display: flex; align-items: center; justify-content: center; }
        .nav-logo-name { font-family: var(--font-ui); font-size: 15.5px; font-weight: 800; color: var(--white); }
        .nav-logo-name b { color: var(--virid); }
        .nav-link { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .14em;
          text-transform: uppercase; color: var(--mist); text-decoration: none;
          padding: 7px 16px; border-radius: 100px; border: 1px solid rgba(255,255,255,.07);
          transition: color .2s, border-color .2s;
        }
        .nav-link:hover { color: var(--virid); border-color: var(--virid-border); }

        .main { flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 100px 24px 60px; }

        .card {
          background: var(--deep); border: 1px solid rgba(0,212,107,.15);
          border-radius: 24px; padding: 48px; width: 100%; max-width: 480px;
          position: relative; overflow: hidden;
        }
        .card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--virid), transparent);
        }

        .plan-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .14em;
          text-transform: uppercase; padding: 4px 12px; border-radius: 100px;
          margin-bottom: 28px; border: 1px solid;
        }
        .plan-dot { width: 5px; height: 5px; border-radius: 50%; }

        h1 { font-family: var(--font-display); font-size: 36px; font-weight: 400;
          letter-spacing: -.03em; line-height: .95; color: var(--white); margin-bottom: 8px; }
        h1 em { font-style: italic; color: var(--virid); }
        .subtitle { font-family: var(--font-ui); font-size: 14px; color: var(--mist);
          line-height: 1.6; margin-bottom: 36px; }

        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        label { font-family: var(--font-mono); font-size: 10px; letter-spacing: .14em;
          text-transform: uppercase; color: var(--mist); }
        input {
          background: rgba(0,212,107,.04); border: 1px solid rgba(0,212,107,.12);
          border-radius: 10px; padding: 12px 14px; color: var(--white);
          font-family: var(--font-ui); font-size: 14px; outline: none;
          transition: border-color .2s, background .2s;
        }
        input:focus { border-color: rgba(0,212,107,.4); background: rgba(0,212,107,.07); }
        input::placeholder { color: rgba(143,168,152,.35); }
        .field-error { font-family: var(--font-mono); font-size: 10px; color: #FF4D6D;
          letter-spacing: .04em; }

        .pw-wrap { position: relative; }
        .pw-wrap input { padding-right: 42px; width: 100%; }
        .pw-eye {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: rgba(143,168,152,.45);
          display: flex; align-items: center; transition: color .15s; padding: 0;
        }
        .pw-eye:hover { color: var(--virid); }

        .pw-rules { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
        .pw-rule { display: flex; align-items: center; gap: 6px;
          font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .04em; }
        .pw-rule-ok { color: var(--virid); }
        .pw-rule-no { color: rgba(143,168,152,.4); }
        .pw-rule-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        .submit-btn {
          width: 100%; padding: 14px; border-radius: 100px; border: none; cursor: pointer;
          background: var(--virid); color: var(--void);
          font-family: var(--font-ui); font-size: 14px; font-weight: 700;
          transition: transform .25s var(--spring), box-shadow .25s, opacity .2s;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--glow); }
        .submit-btn:disabled { opacity: .55; cursor: not-allowed; }

        .login-link { text-align: center; margin-top: 22px;
          font-family: var(--font-ui); font-size: 13.5px; color: var(--mist); }
        .login-link a { color: var(--virid); text-decoration: none; }
        .login-link a:hover { text-decoration: underline; }

        .general-error { background: rgba(255,77,109,.08); border: 1px solid rgba(255,77,109,.2);
          border-radius: 10px; padding: 12px 14px; margin-bottom: 16px;
          font-family: var(--font-ui); font-size: 13px; color: #FF4D6D; }

        .success-card { text-align: center; }
        .success-icon { width: 64px; height: 64px; border-radius: 50%;
          background: rgba(0,212,107,.12); border: 1px solid var(--virid-border);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .success-title { font-family: var(--font-display); font-size: 32px; font-weight: 400;
          letter-spacing: -.03em; color: var(--white); margin-bottom: 10px; }
        .success-title em { font-style: italic; color: var(--virid); }
        .success-sub { font-family: var(--font-ui); font-size: 14px; color: var(--mist);
          line-height: 1.65; }

        @media(max-width:600px) {
          .nav { padding: 0 20px; }
          .card { padding: 32px 24px; }
        }
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-logo-mark">
            <svg viewBox="0 0 15 15" fill="none" width="15" height="15">
              <path d="M7.5 1.5v4M7.5 9.5V13.5M1.5 7.5h4M9.5 7.5h4" stroke="#030A06" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="7.5" cy="7.5" r="1.8" fill="#030A06"/>
            </svg>
          </div>
          <span className="nav-logo-name">Fisio<b>Hub</b></span>
        </a>
        <Link href="/login" className="nav-link">Já tenho conta</Link>
      </nav>

      <main className="main">
        <div className="card">
          {success ? (
            <div className="success-card">
              <div className="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00D46B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="success-title">Conta <em>criada!</em></div>
              <p className="success-sub" style={{ marginTop: 0 }}>
                Sua clínica foi provisionada com sucesso.<br />
                Você tem <strong style={{ color: '#00D46B' }}>14 dias grátis</strong> para explorar a plataforma.
                {clinicSlug && (
                  <><br /><br />Slug da sua clínica: <strong style={{ color: '#00D46B', fontFamily: 'monospace' }}>{clinicSlug}</strong></>
                )}
                <br /><br />
                Redirecionando para o login...
              </p>
            </div>
          ) : (
            <>
              <div
                className="plan-badge"
                style={{
                  color: plan.color,
                  borderColor: `${plan.color}33`,
                  background: `${plan.color}11`,
                }}
              >
                <span className="plan-dot" style={{ background: plan.color }} />
                Plano {plan.name} · {plan.price}
              </div>

              <h1>Criar sua<br /><em>conta</em></h1>
              <p className="subtitle">
                14 dias grátis, sem cartão de crédito. Cancele quando quiser.
              </p>

              {errors._general && (
                <div className="general-error">{errors._general}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Nome da clínica</label>
                  <input
                    type="text"
                    placeholder="Ex: Clínica Movimento"
                    value={values.clinicName}
                    onChange={e => set('clinicName', e.target.value)}
                    required
                  />
                  {errors.clinicName && <span className="field-error">{errors.clinicName}</span>}
                </div>

                <div className="field">
                  <label>Seu nome</label>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={values.adminName}
                    onChange={e => set('adminName', e.target.value)}
                    required
                  />
                  {errors.adminName && <span className="field-error">{errors.adminName}</span>}
                </div>

                <div className="field">
                  <label>E-mail</label>
                  <input
                    type="email"
                    placeholder="voce@clinica.com"
                    value={values.email}
                    onChange={e => set('email', e.target.value)}
                    required
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="field">
                  <label>Senha</label>
                  <div className="pw-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Crie uma senha forte"
                      value={values.password}
                      onChange={e => set('password', e.target.value)}
                      required
                    />
                    <button type="button" className="pw-eye" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {values.password.length > 0 && (
                    <div className="pw-rules">
                      {PASSWORD_RULES.map(r => {
                        const ok = r.test(values.password)
                        return (
                          <div key={r.label} className={`pw-rule ${ok ? 'pw-rule-ok' : 'pw-rule-no'}`}>
                            <span className="pw-rule-dot" style={{ background: ok ? 'var(--virid)' : 'rgba(143,168,152,.3)' }} />
                            {r.label}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>

                <div className="field">
                  <label>Confirmar senha</label>
                  <div className="pw-wrap">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      value={values.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)}
                      required
                    />
                    <button type="button" className="pw-eye" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar conta grátis →'}
                </button>
              </form>

              <p className="login-link">
                Já tem uma conta? <Link href="/login">Entrar</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  )
}
