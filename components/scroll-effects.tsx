'use client'
import { useEffect } from 'react'

export default function ScrollEffects() {
  useEffect(() => {
    // ── Scroll progress bar ──────────────────────────
    const bar = document.getElementById('scroll-progress')
    const onScroll = () => {
      if (!bar) return
      const h = document.documentElement.scrollHeight - window.innerHeight
      bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`
    }

    // ── Scroll-reveal (IntersectionObserver) ─────────
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('sr-visible')
        }),
      { threshold: 0.07, rootMargin: '0px 0px -52px 0px' }
    )
    document.querySelectorAll('.sr').forEach((el) => io.observe(el))

    // ── Counter animation ────────────────────────────
    const countIO = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const el = e.target as HTMLElement
          if (e.isIntersecting && !el.dataset.animated) {
            el.dataset.animated = '1'
            const target = parseInt(el.dataset.count ?? '0')
            let n = 0
            const step = Math.max(1, Math.ceil(target / 38))
            const t = setInterval(() => {
              n = Math.min(n + step, target)
              el.textContent = String(n)
              if (n >= target) clearInterval(t)
            }, 26)
          }
        }),
      { threshold: 0.55 }
    )
    document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el))

    // ── Parallax ─────────────────────────────────────
    const onParallax = () => {
      const y = window.scrollY
      document.querySelectorAll<HTMLElement>('.par-slow').forEach((el) => {
        el.style.transform = `translateY(${y * 0.18}px)`
      })
      document.querySelectorAll<HTMLElement>('.par-up').forEach((el) => {
        el.style.transform = `translateY(${y * -0.12}px)`
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scroll', onParallax, { passive: true })

    return () => {
      io.disconnect()
      countIO.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onParallax)
    }
  }, [])

  return null
}
