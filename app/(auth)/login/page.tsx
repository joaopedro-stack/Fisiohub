'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error('Email ou senha inválidos')
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      toast.error('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="lf-form">
      <div className="lf-field">
        <label className="lf-label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className={`lf-input${errors.email ? ' lf-input-err' : ''}`}
          placeholder="seu@email.com"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && <p className="lf-err-msg">{errors.email.message}</p>}
      </div>
      <div className="lf-field">
        <label className="lf-label" htmlFor="password">Senha</label>
        <div className="lf-pw-wrap">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className={`lf-input${errors.password ? ' lf-input-err' : ''}`}
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
          />
          <button
            type="button"
            className="lf-eye"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label="Toggle password"
          >
            {showPassword ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        {errors.password && <p className="lf-err-msg">{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={loading} className="lf-submit">
        {loading ? (
          <svg className="lf-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        ) : (
          <>
            Entrar na plataforma
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </>
        )}
      </button>
    </form>
  )
}

export default function LoginPage() {
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
          --virid-border: rgba(0,212,107,.2);
          --lime:         #B8F000;
          --mist:         #8FA898;
          --white:        #F0FAF4;
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-ui:      'Syne', system-ui, sans-serif;
          --font-mono:    'DM Mono', 'Courier New', monospace;
          --glow:         0 0 48px rgba(0,212,107,.28), 0 0 100px rgba(0,212,107,.1);
          --spring:       cubic-bezier(.34,1.56,.64,1);
        }

        .lp-wrap {
          font-family: var(--font-ui);
          min-height: 100vh; display: flex;
          background: var(--void); color: var(--white);
          -webkit-font-smoothing: antialiased;
        }

        /* ── LEFT PANEL ── */
        .lp-left {
          flex: 1.1; position: relative; overflow: hidden;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 48px 52px; min-height: 100vh;
        }
        .lp-left::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(0,212,107,.055) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .lp-left::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: repeating-linear-gradient(-54deg, transparent, transparent 90px, rgba(0,212,107,.018) 90px, rgba(0,212,107,.018) 91px);
        }
        .lp-left-glow {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,107,.1) 0%, transparent 65%);
          bottom: -100px; left: -100px; pointer-events: none;
        }
        .lp-left-glow-2 {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(184,240,0,.06) 0%, transparent 70%);
          top: 80px; right: -60px; pointer-events: none;
        }

        .lp-left-content { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }

        .lp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .lp-logo-mark {
          width: 30px; height: 30px; border-radius: 7px; background: var(--virid);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lp-logo-mark svg { width: 14px; height: 14px; }
        .lp-logo-name { font-family: var(--font-ui); font-size: 15px; font-weight: 800; color: var(--white); }
        .lp-logo-name b { color: var(--virid); }

        .lp-mid { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 60px 0; }
        .lp-eyebrow {
          font-family: var(--font-mono); font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: var(--virid);
          display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
        }
        .lp-eyebrow::before { content: ''; width: 28px; height: 1px; background: var(--virid); display: block; }
        .lp-headline {
          font-family: var(--font-display); font-size: clamp(44px, 5.5vw, 76px);
          font-weight: 400; line-height: .91; letter-spacing: -.035em; color: var(--white); margin-bottom: 32px;
        }
        .lp-headline em { font-style: italic; color: transparent; -webkit-text-stroke: 1px rgba(0,212,107,.6); }

        .lp-stats { display: flex; flex-direction: column; gap: 0; border-top: 1px solid rgba(0,212,107,.1); }
        .lp-stat {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0; border-bottom: 1px solid rgba(0,212,107,.06);
        }
        .lp-stat-name { font-family: var(--font-mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--mist); }
        .lp-stat-val { font-family: var(--font-ui); font-size: 13px; font-weight: 700; color: var(--white); }
        .lp-stat-badge {
          font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .08em;
          padding: 3px 10px; border-radius: 100px;
          background: rgba(0,212,107,.1); color: var(--virid); border: 1px solid var(--virid-border);
        }

        .lp-footer-text { font-family: var(--font-mono); font-size: 10px; letter-spacing: .06em; color: rgba(143,168,152,.25); }

        /* ── DIVIDER ── */
        .lp-divider {
          width: 1px; background: rgba(0,212,107,.07); flex-shrink: 0;
          position: relative;
        }
        .lp-divider::after {
          content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--virid); opacity: .3;
          box-shadow: 0 0 12px rgba(0,212,107,.4);
        }

        /* ── RIGHT PANEL ── */
        .lp-right {
          flex: 0.9; display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 48px 60px; background: var(--abyss);
          position: relative;
        }
        .lp-right::before {
          content: ''; position: absolute; top: 0; left: 0; width: 1px; height: 100%;
          background: linear-gradient(180deg, transparent, rgba(0,212,107,.12), transparent);
        }
        .lp-form-wrap { width: 100%; max-width: 380px; }

        .lf-heading {
          margin-bottom: 8px;
        }
        .lf-heading-eyebrow {
          font-family: var(--font-mono); font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
          color: var(--virid); display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
        }
        .lf-heading-eyebrow::before { content: ''; width: 20px; height: 1px; background: var(--virid); display: block; }
        .lf-title {
          font-family: var(--font-display); font-size: 38px; font-weight: 400;
          letter-spacing: -.025em; line-height: .95; color: var(--white); margin-bottom: 8px;
        }
        .lf-title em { font-style: italic; color: var(--virid); }
        .lf-sub {
          font-family: var(--font-ui); font-size: 14px; color: var(--mist); line-height: 1.6; margin-bottom: 36px;
        }

        /* form */
        .lf-form { display: flex; flex-direction: column; gap: 20px; }
        .lf-field { display: flex; flex-direction: column; gap: 8px; }
        .lf-label {
          font-family: var(--font-mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--mist);
        }
        .lf-input {
          width: 100%; padding: 12px 16px;
          background: var(--deep); border: 1px solid rgba(0,212,107,.12);
          border-radius: 10px; font-family: var(--font-ui); font-size: 14px; color: var(--white);
          outline: none; caret-color: var(--virid);
          transition: border-color .2s, box-shadow .2s;
        }
        .lf-input::placeholder { color: rgba(143,168,152,.35); }
        .lf-input:focus { border-color: rgba(0,212,107,.4); box-shadow: 0 0 0 3px rgba(0,212,107,.07); }
        .lf-input.lf-input-err { border-color: rgba(255,77,109,.4); }
        .lf-input.lf-input-err:focus { box-shadow: 0 0 0 3px rgba(255,77,109,.07); }
        .lf-err-msg { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .04em; color: #FF6B8A; }
        .lf-pw-wrap { position: relative; }
        .lf-pw-wrap .lf-input { padding-right: 44px; }
        .lf-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--mist);
          display: flex; align-items: center; transition: color .15s;
        }
        .lf-eye:hover { color: var(--virid); }

        .lf-submit {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 13px; border-radius: 100px;
          font-family: var(--font-ui); font-size: 14px; font-weight: 700;
          background: var(--virid); color: var(--void); border: none; cursor: pointer;
          transition: transform .25s var(--spring), box-shadow .25s; margin-top: 4px;
        }
        .lf-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--glow); }
        .lf-submit:disabled { opacity: .6; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lf-spin { animation: spin 1s linear infinite; }

        .lf-back {
          margin-top: 28px; text-align: center;
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase;
          color: var(--mist);
        }
        .lf-back a { color: var(--virid); text-decoration: none; transition: opacity .2s; }
        .lf-back a:hover { opacity: .75; }

        .lf-skeleton { height: 240px; }

        @media(max-width:860px) {
          .lp-left { display: none; }
          .lp-divider { display: none; }
          .lp-right { flex: 1; padding: 48px 28px; background: var(--void); }
          .lp-right::before { display: none; }
        }
      `}</style>

      <div className="lp-wrap">

        {/* ── LEFT PANEL ── */}
        <div className="lp-left">
          <div className="lp-left-glow" />
          <div className="lp-left-glow-2" />

          <div className="lp-left-content">
            <a href="/" className="lp-logo">
              <div className="lp-logo-mark">
                <svg viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5v3.5M7 9V12.5M1.5 7h3.5M9 7h3.5" stroke="#030A06" strokeWidth="1.9" strokeLinecap="round"/>
                  <circle cx="7" cy="7" r="1.6" fill="#030A06"/>
                </svg>
              </div>
              <span className="lp-logo-name">Fisio<b>Hub</b></span>
            </a>

            <div className="lp-mid">
              <div className="lp-eyebrow">Acesso à plataforma</div>
              <h1 className="lp-headline">
                Sua clínica<br />
                <em>te espera.</em>
              </h1>
              <div className="lp-stats">
                <div className="lp-stat">
                  <span className="lp-stat-name">Agenda</span>
                  <span className="lp-stat-badge">Visual completa</span>
                </div>
                <div className="lp-stat">
                  <span className="lp-stat-name">Prontuários</span>
                  <span className="lp-stat-badge">PDF automático</span>
                </div>
                <div className="lp-stat">
                  <span className="lp-stat-name">Financeiro</span>
                  <span className="lp-stat-badge">DRE integrado</span>
                </div>
                <div className="lp-stat">
                  <span className="lp-stat-name">WhatsApp</span>
                  <span className="lp-stat-badge">Envio automático</span>
                </div>
              </div>
            </div>

            <div className="lp-footer-text">FisioHub — plataforma para fisioterapeutas</div>
          </div>
        </div>

        <div className="lp-divider" />

        {/* ── RIGHT PANEL ── */}
        <div className="lp-right">
          <div className="lp-form-wrap">
            <div className="lf-heading">
              <div className="lf-heading-eyebrow">Login</div>
              <h2 className="lf-title">Bem-vindo<br /><em>de volta.</em></h2>
              <p className="lf-sub">Entre com suas credenciais para acessar o painel da sua clínica.</p>
            </div>

            <Suspense fallback={<div className="lf-skeleton" />}>
              <LoginFormContent />
            </Suspense>

            <p className="lf-back">
              Ainda não tem conta?{' '}
              <Link href="/planos">Ver planos</Link>
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
