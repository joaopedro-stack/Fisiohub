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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Nunito:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream:       #F8F6F2;
          --cream-2:     #EEE9E0;
          --white:       #FFFFFF;
          --forest:      #1B4A34;
          --forest-mid:  #2D6E4A;
          --forest-lite: #4D9668;
          --sage:        #7BAA88;
          --sage-2:      #B2CAB9;
          --sage-bg:     #EAF1EC;
          --ink:         #1A1E1C;
          --ink-2:       #4A5650;
          --ink-3:       #8A9490;
          --font-d:      'Playfair Display', Georgia, serif;
          --font-ui:     'Nunito', system-ui, sans-serif;
          --spring:      cubic-bezier(.34,1.56,.64,1);
          --sh-md:       0 8px 32px rgba(27,74,52,.11);
        }

        .lp-wrap {
          font-family: var(--font-ui);
          min-height: 100vh; display: flex;
          background: var(--forest); color: var(--white);
          -webkit-font-smoothing: antialiased;
        }

        /* ── LEFT PANEL (Forest green brand) ── */
        .lp-left {
          flex: 1.1; position: relative; overflow: hidden;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 52px 56px; min-height: 100vh;
        }
        /* Subtle dot grid */
        .lp-left::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px);
          background-size: 26px 26px;
        }
        /* Diagonal stripe overlay */
        .lp-left::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: repeating-linear-gradient(-52deg, transparent, transparent 88px, rgba(255,255,255,.025) 88px, rgba(255,255,255,.025) 89px);
        }
        .lp-blob-1 {
          position: absolute; width: 560px; height: 560px; border-radius: 50%;
          background: radial-gradient(circle, rgba(75,150,104,.35) 0%, transparent 68%);
          bottom: -140px; left: -100px; pointer-events: none;
          animation: blobShift 12s ease-in-out infinite;
        }
        .lp-blob-2 {
          position: absolute; width: 360px; height: 360px; border-radius: 50%;
          background: radial-gradient(circle, rgba(178,202,185,.15) 0%, transparent 70%);
          top: 40px; right: -80px; pointer-events: none;
          animation: blobShift 16s 4s ease-in-out infinite reverse;
        }
        @keyframes blobShift {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(16px,-22px) scale(1.04); }
        }

        .lp-left-inner { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }

        .lp-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }
        .lp-logo-mark {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lp-logo-mark svg { width: 16px; height: 16px; }
        .lp-logo-name { font-size: 16px; font-weight: 800; color: rgba(255,255,255,.9); }
        .lp-logo-name b { color: rgba(178,202,185,.9); }

        .lp-mid { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 60px 0; }
        .lp-eyebrow {
          font-size: 10.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
          color: rgba(178,202,185,.8); display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
        }
        .lp-eyebrow::before { content: ''; width: 22px; height: 1.5px; background: rgba(178,202,185,.6); display: block; border-radius: 2px; }

        .lp-headline {
          font-family: var(--font-d);
          font-size: clamp(44px, 5.5vw, 76px);
          font-weight: 700; line-height: .91; letter-spacing: -.032em; color: var(--white); margin-bottom: 40px;
        }
        .lp-headline em { font-style: italic; color: rgba(178,202,185,.9); }

        .lp-features { display: flex; flex-direction: column; gap: 12px; }
        .lp-feat {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 12px;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.08);
          backdrop-filter: blur(8px);
          transition: background .2s;
        }
        .lp-feat:hover { background: rgba(255,255,255,.1); }
        .lp-feat-icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          background: rgba(178,202,185,.15); border: 1px solid rgba(178,202,185,.2);
          display: flex; align-items: center; justify-content: center; font-size: 15px;
        }
        .lp-feat-name { font-size: 13.5px; font-weight: 700; color: rgba(255,255,255,.85); margin-bottom: 2px; }
        .lp-feat-desc { font-size: 11.5px; font-weight: 500; color: rgba(178,202,185,.6); }

        .lp-footer-text { font-size: 11px; font-weight: 500; color: rgba(178,202,185,.3); letter-spacing: .03em; }

        /* ── DIVIDER ── */
        .lp-divider {
          width: 1px; background: rgba(255,255,255,.08); flex-shrink: 0; position: relative;
        }
        .lp-divider::after {
          content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(178,202,185,.5);
          box-shadow: 0 0 12px rgba(178,202,185,.4);
        }

        /* ── RIGHT PANEL (Form) ── */
        .lp-right {
          flex: 0.9; display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 52px 64px; background: #F5F2EE;
          position: relative;
        }
        .lp-right::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(27,74,52,.04) 1.2px, transparent 1.2px);
          background-size: 28px 28px;
        }
        .lp-right::after {
          content: ''; position: absolute; top: 0; left: 0; width: 1px; height: 100%;
          background: linear-gradient(180deg, transparent, rgba(27,74,52,.12), transparent);
        }
        .lp-form-wrap { position: relative; z-index: 1; }
        .lp-form-wrap { width: 100%; max-width: 380px; }

        /* form heading */
        .lf-heading { margin-bottom: 32px; }
        .lf-heading-eyebrow {
          font-size: 10.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
          color: var(--forest); display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
        }
        .lf-heading-eyebrow::before { content: ''; width: 20px; height: 1.5px; background: var(--forest-lite); display: block; border-radius: 2px; }
        .lf-title {
          font-family: var(--font-d); font-size: 38px; font-weight: 700;
          letter-spacing: -.025em; line-height: .93; color: var(--ink); margin-bottom: 10px;
        }
        .lf-title em { font-style: italic; color: var(--forest); }
        .lf-sub { font-size: 14px; font-weight: 500; color: var(--ink-2); line-height: 1.65; }

        /* form fields */
        .lf-form { display: flex; flex-direction: column; gap: 20px; }
        .lf-field { display: flex; flex-direction: column; gap: 7px; }
        .lf-label { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-2); }
        .lf-input {
          width: 100%; padding: 12px 16px;
          background: var(--white); border: 1.5px solid rgba(27,74,52,.12);
          border-radius: 12px; font-family: var(--font-ui); font-size: 15px; color: var(--ink);
          outline: none; caret-color: var(--forest);
          transition: border-color .2s, box-shadow .2s;
        }
        .lf-input::placeholder { color: rgba(138,148,144,.5); }
        .lf-input:focus { border-color: var(--forest-lite); box-shadow: 0 0 0 3px rgba(27,74,52,.07); }
        .lf-input.lf-input-err { border-color: rgba(200,60,40,.45); }
        .lf-input.lf-input-err:focus { box-shadow: 0 0 0 3px rgba(200,60,40,.08); }
        .lf-err-msg { font-size: 11.5px; font-weight: 600; color: #C83C28; }
        .lf-pw-wrap { position: relative; }
        .lf-pw-wrap .lf-input { padding-right: 46px; }
        .lf-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--ink-3);
          display: flex; align-items: center; transition: color .15s;
        }
        .lf-eye:hover { color: var(--forest); }

        .lf-submit {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 14px;
          border-radius: 100px; font-family: var(--font-ui); font-size: 15px; font-weight: 700;
          background: var(--forest); color: var(--white); border: none; cursor: pointer; margin-top: 4px;
          transition: transform .25s var(--spring), box-shadow .25s, background .2s;
        }
        .lf-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(27,74,52,.3); background: var(--forest-mid); }
        .lf-submit:disabled { opacity: .6; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lf-spin { animation: spin 1s linear infinite; }

        .lf-back {
          margin-top: 28px; text-align: center;
          font-size: 13px; font-weight: 600; color: var(--ink-3);
        }
        .lf-back a { color: var(--forest); text-decoration: none; font-weight: 700; transition: opacity .2s; }
        .lf-back a:hover { opacity: .75; }

        .lf-skeleton { height: 240px; }

        @media(max-width:860px) {
          .lp-left { display: none; }
          .lp-divider { display: none; }
          .lp-right { flex: 1; padding: 48px 24px; background: var(--cream); }
          .lp-right::before { display: none; }
        }
      `}</style>

      <div className="lp-wrap">

        {/* ── LEFT PANEL ── */}
        <div className="lp-left">
          <div className="lp-blob-1" />
          <div className="lp-blob-2" />

          <div className="lp-left-inner">
            <a href="/" className="lp-logo">
              <div className="lp-logo-mark">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="rgba(255,255,255,.9)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="8" cy="8" r="2" fill="rgba(255,255,255,.9)"/>
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
              <div className="lp-features">
                {[
                  { icon: '📅', name: 'Agenda visual', desc: 'Conflitos detectados automaticamente' },
                  { icon: '📋', name: 'Prontuários', desc: 'PDF gerado com um clique' },
                  { icon: '💰', name: 'Financeiro', desc: 'DRE mensal consolidado' },
                  { icon: '💬', name: 'WhatsApp', desc: 'Confirmações automáticas' },
                ].map((f) => (
                  <div key={f.name} className="lp-feat">
                    <div className="lp-feat-icon">{f.icon}</div>
                    <div>
                      <div className="lp-feat-name">{f.name}</div>
                      <div className="lp-feat-desc">{f.desc}</div>
                    </div>
                  </div>
                ))}
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
