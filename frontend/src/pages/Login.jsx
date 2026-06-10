import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button, Input } from '../components/ui'
import useAuthStore from '../store/authStore'

const TESTIMONIALS = [
  { text: '"SocialMind AI tripled our engagement in 2 weeks. The brand voice is spot on."' },
  { text: '"Finally an AI that actually understands our brand. The RAG pipeline is a game-changer."' },
  { text: '"Our team saves 15+ hours a week on social media. Worth every penny."' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [testimonialIdx] = useState(0)

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!form.password) errs.password = 'Password is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const res = await login(form.email, form.password)
    if (res.success) {
      navigate('/dashboard')
    } else {
      setForm(f => ({ ...f, password: '' }))
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Left: Form ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: 'clamp(40px, 6vw, 80px)',
          maxWidth: 520,
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✦</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>SocialMind AI</span>
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Sign in to your SocialMind AI account</p>
        </div>



        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input
            id="login-email"
            label="Email address"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value })
              if (error) clearError()
              if (errors.email) setErrors({ ...errors, email: null })
            }}
            error={errors.email || (error ? ' ' : '')}
          />
          <Input
            id="login-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value })
              if (error) clearError()
              if (errors.password) setErrors({ ...errors, password: null })
            }}
            error={errors.password || (error ? ' ' : '')}
          />
          {error && (
            <span className="input-error" style={{ marginTop: -12, display: 'block' }}>
              {error}
            </span>
          )}

          <Button type="submit" variant="primary" size="lg" loading={isLoading} id="login-submit" style={{ width: '100%', marginTop: 4 }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-violet-light)', fontWeight: 600 }}>Create one free</Link>
        </div>
      </motion.div>

      {/* ── Right: Animated gradient panel ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', padding: 48,
          background: 'var(--bg-navy)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        {/* Background orbs */}
        <div className="orb orb-violet animate-glow" style={{ width: 400, height: 400, top: -100, right: -100, opacity: 0.3 }} />
        <div className="orb orb-cyan animate-glow" style={{ width: 300, height: 300, bottom: -50, left: -80, opacity: 0.2, animationDelay: '1.5s' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 380, textAlign: 'center' }}>
          <motion.div
            className="animate-float"
            style={{ fontSize: 64, marginBottom: 24 }}
          >🚀</motion.div>

          <h2 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
            AI that works <span className="gradient-text">24/7</span> for your brand
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            Join thousands of brands automating their social media presence with AI.
          </p>

          {/* Testimonial */}
          <motion.div
            key={testimonialIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: 24, textAlign: 'left' }}
          >
            <div style={{ color: 'var(--accent-violet-light)', fontSize: 24, marginBottom: 12, lineHeight: 1 }}>"</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>{TESTIMONIALS[testimonialIdx].text}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'var(--gradient-brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                ✦
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Verified Customer</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Verified Review</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
