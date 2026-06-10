import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button, Input } from '../components/ui'
import useAuthStore from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const res = await register(form.name, form.email, form.password, form.confirmPassword)
    if (res.success) navigate('/brand-setup')
  }

  const PERKS = ['RAG-powered brand intelligence', 'GPT-4o content generation', 'Multi-platform scheduling', 'Real-time AI streaming']

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Left: Gradient panel ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', padding: 48,
          background: 'var(--bg-navy)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <div className="orb orb-violet animate-glow" style={{ width: 500, height: 500, top: -150, left: -150, opacity: 0.25 }} />
        <div className="orb orb-cyan animate-glow" style={{ width: 350, height: 350, bottom: 0, right: -100, opacity: 0.2, animationDelay: '2s' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 380 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
            Start growing your brand <span className="gradient-text">today</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
            Join thousands of marketers and agency owners using SocialMind AI to automate their social presence.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PERKS.map((perk, i) => (
              <motion.div
                key={perk}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{
                  width: 28, height: 28,
                  background: 'var(--accent-violet-dim)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: 'var(--accent-violet-light)', flexShrink: 0,
                }}>✓</div>
                <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{perk}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 28, marginTop: 48 }}>
            {[['2k+', 'Brands'], ['10M+', 'Posts'], ['99.9%', 'Uptime']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Right: Form ── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: 'clamp(40px, 6vw, 80px)',
          maxWidth: 520,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✦</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>SocialMind AI</span>
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Get started for free — no credit card required</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 14, marginBottom: 20 }}
          >{error}</motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input id="reg-name" label="Full name" placeholder="Alex Johnson" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input id="reg-email" label="Email address" type="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          <Input id="reg-password" label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
          <Input id="reg-confirm" label="Confirm password" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} />

          <Button type="submit" variant="primary" size="lg" loading={isLoading} id="register-submit" style={{ width: '100%', marginTop: 4 }}>
            {isLoading ? 'Creating account...' : 'Create Free Account'}
          </Button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-violet-light)', fontWeight: 600 }}>Sign in</Link>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  )
}
