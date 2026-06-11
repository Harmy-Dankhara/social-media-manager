import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui'

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.12 } } }

const FEATURES = [
  {
    icon: '🧠',
    title: 'Brand Intelligence',
    desc: 'Upload your brand docs and guidelines. Our RAG pipeline indexes them into a vector database, giving the AI deep knowledge of your brand voice, tone, and messaging.',
    color: 'var(--accent-violet)',
  },
  {
    icon: '✨',
    title: 'Content Generation',
    desc: 'GPT-4o powered content creation tailored to each platform. Instagram captions, LinkedIn thought-leadership, punchy tweets — all in your exact brand voice.',
    color: 'var(--accent-cyan)',
  },
  {
    icon: '⚡',
    title: 'Autonomous Scheduling',
    desc: 'Our LangGraph agent analyzes optimal posting times, schedules content across platforms, and monitors performance — all without manual intervention.',
    color: '#f59e0b',
  },
]

const STEPS = [
  { num: '01', title: 'Set Up Your Brand', desc: 'Upload brand guidelines, define your voice, and describe your audience. The AI learns everything about your brand.' },
  { num: '02', title: 'Generate Content', desc: 'Describe your campaign topic. The AI agent creates platform-specific posts streaming live as they\'re created.' },
  { num: '03', title: 'Schedule & Grow', desc: 'Review, edit, and schedule posts with a single click. Watch your presence grow across every platform automatically.' },
]

const PLANS = [
  { name: 'Free', price: '$0', period: '/forever', features: ['2 brands', '15 posts/month', 'Basic scheduling', 'Gemini Flash model', 'Email support'], cta: 'Start Free', variant: 'ghost' },
  { name: 'Pro', price: '$49', period: '/month', features: ['8 brands', '100 posts/month', 'Advanced analytics', 'Priority scheduling', 'Custom brand voice', 'Priority support'], cta: 'Get Pro', variant: 'primary', popular: true },
  { name: 'Agency', price: '$199', period: '/month', features: ['Unlimited brands', 'Unlimited posts', 'White-label', 'API access', 'Dedicated account manager', 'Custom integrations'], cta: 'Contact Us', variant: 'ghost' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
          }}>✦</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>SocialMind AI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')} id="nav-login">Log In</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')} id="nav-signup">Get Started Free</Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px' }}>
        {/* Orbs */}
        <div className="orb orb-violet animate-glow" style={{ width: 600, height: 600, top: -100, left: -200, opacity: 0.25 }} />
        <div className="orb orb-cyan animate-glow" style={{ width: 500, height: 500, top: -50, right: -150, opacity: 0.18, animationDelay: '1s' }} />
        <div className="orb orb-violet animate-glow" style={{ width: 400, height: 400, bottom: -100, right: 100, opacity: 0.12, animationDelay: '2s' }} />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{
            maxWidth: 800,
            width: '100%',
            position: 'relative',
            zIndex: 1,
            padding: '0 12px',
          }}
        >
          <motion.div variants={fadeUp}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px',
              background: 'var(--accent-violet-dim)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 'var(--radius-full)',
              fontSize: 13, color: 'var(--accent-violet-light)',
              marginBottom: 28, fontWeight: 500,
            }}>
              <span style={{ width: 6, height: 6, background: 'var(--accent-violet)', borderRadius: '50%', boxShadow: '0 0 6px var(--accent-violet)' }} />
              Powered by Advanced AI + LangGraph + RAG
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            style={{ fontFamily: 'Syne', fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-1.5px' }}
          >
            Your Brand.{' '}
            <span className="gradient-text">Everywhere.</span>
            <br />Automatically.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}
          >
            AI that creates, schedules, and manages your social media —
            powered by RAG + Agentic AI. Watch content stream live as the agent works.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" size="xl" onClick={() => navigate('/register')} id="hero-cta-primary">
              Get Started Free
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Button>
            <Button variant="ghost" size="xl" onClick={() => navigate('/login')} id="hero-cta-demo">
              Watch Demo
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="M10 8l6 4-6 4V8z" fill="currentColor" /></svg>
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={fadeUp}
            style={{
              marginTop: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              color: 'var(--text-muted)',
              fontSize: 13,
              flexWrap: 'wrap',
              padding: '0 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#fbbf24' }}>★★★★★</span>
              <span>4.9/5 from 2k+ brands</span>
            </div>
            <div style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />
            <div>No credit card required</div>
            <div style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />
            <div>Free forever plan</div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 14 }}>
            Everything your brand needs,{' '}
            <span className="gradient-text">automated</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
            Three AI-powered pillars that turn your brand into a social media powerhouse
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{ padding: 32 }}
              whileHover={{ y: -6, boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${f.color}22` }}
            >
              <div style={{
                width: 52, height: 52,
                background: `${f.color}18`,
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 20,
                border: `1px solid ${f.color}30`,
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 12, color: f.color }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-navy)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 14 }}>
              From setup to viral in <span className="gradient-text">3 steps</span>
            </h2>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{
                  display: 'flex',
                  gap: 28,
                  padding: '28px 0',
                  borderBottom: i < STEPS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  fontFamily: 'Syne', fontSize: 48, fontWeight: 800,
                  background: 'var(--gradient-brand)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  flexShrink: 0, lineHeight: 1,
                }}>{step.num}</div>
                <div>
                  <h3 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 14 }}>
            Simple, <span className="gradient-text">transparent</span> pricing
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{
                padding: 32, position: 'relative', overflow: 'hidden',
                border: plan.popular ? '1px solid rgba(124,58,237,0.5)' : '1px solid var(--border-subtle)',
                boxShadow: plan.popular ? '0 0 40px rgba(124,58,237,0.2)' : undefined,
              }}
              whileHover={{ y: -4 }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'var(--gradient-violet)',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.5px',
                }}>POPULAR</div>
              )}
              <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                <span style={{ fontFamily: 'Syne', fontSize: 40, fontWeight: 800 }}>{plan.price}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{plan.period}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Button variant={plan.variant} style={{ width: '100%' }} onClick={() => navigate('/register')} id={`plan-${plan.name.toLowerCase()}`}>
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--bg-navy)', padding: '40px 40px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: 'var(--gradient-brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✦</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 700 }}>SocialMind AI</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>© 2026 SocialMind AI. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ cursor: 'pointer' }}>Privacy</span>
            <span style={{ cursor: 'pointer' }}>Terms</span>
            <span style={{ cursor: 'pointer' }}>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
