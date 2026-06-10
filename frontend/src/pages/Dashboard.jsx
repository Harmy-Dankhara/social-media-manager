import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import { Card, Button, Badge, EmptyState } from '../components/ui'
import { contentAPI, analyticsAPI, competitorsAPI } from '../services/api'
import useBrandStore from '../store/brandStore'
import useContentStore from '../store/contentStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { useState } from 'react'

const PLATFORM_COLOR = { instagram: '#e1306c', linkedin: '#0077b5', twitter: '#1da1f2', facebook: '#1877f2' }
const PLATFORM_ICON = { instagram: '📸', linkedin: '💼', twitter: '🐦', facebook: '📘' }

function StatCard({ label, value, icon, change, color }) {
  return (
    <motion.div
      className="glass-card stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stat-label">{label}</span>
        <div style={{ fontSize: 20 }}>{icon}</div>
      </div>
      <div className="stat-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      {change && <div className="stat-change">↑ {change}</div>}
    </motion.div>
  )
}

function AgentActivityPanel({ steps }) {
  return (
    <Card style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700 }}>Agent Activity</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </div>
      </div>
      {steps.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
          No active generation. Start generating content to see agent activity here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
          {steps.slice().reverse().map((step, i) => (
            <motion.div
              key={step.timestamp}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: 13, color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '6px 10px',
                background: i === 0 ? 'var(--accent-violet-dim)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                border: i === 0 ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
              }}
            >
              {step.message}
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { brands, fetchBrands } = useBrandStore()
  const { agentSteps } = useContentStore()
  const [recentContent, setRecentContent] = useState([])
  const [stats, setStats] = useState({ total: 0, scheduled: 0, engagement: '3.7%', brands: 0, competitors: 0 })
  const [loading, setLoading] = useState(true)

  useWebSocket()

  useEffect(() => {
    fetchBrands()
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [contentRes, analyticsRes, competitorsRes] = await Promise.all([
        contentAPI.list(),
        analyticsAPI.get({ days: 30 }),
        competitorsAPI.list().catch(() => ({ data: [] })),
      ])
      setRecentContent(contentRes.data.slice(0, 5))
      setStats({
        total: analyticsRes.data.summary.total_posts_generated,
        scheduled: analyticsRes.data.summary.posts_scheduled_this_week,
        engagement: `${analyticsRes.data.summary.avg_engagement_rate}%`,
        brands: analyticsRes.data.summary.active_brands,
        competitors: competitorsRes.data.length,
      })
    } catch {
      // silently fail — use defaults
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div style={{ padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back! Here's your brand performance at a glance.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/content-studio')} id="quick-generate-btn">
            ⚡ Generate Content
          </Button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Total Posts Generated" value={stats.total} icon="📝" change="24% this month" color="var(--accent-violet-light)" />
          <StatCard label="Scheduled This Week" value={stats.scheduled} icon="📅" change="8 more than last week" color="var(--accent-cyan-light)" />
          <StatCard label="Avg Engagement Rate" value={stats.engagement} icon="📈" change="0.5% this week" color="#fbbf24" />
          <StatCard label="Active Brands" value={stats.brands} icon="✦" color="#4ade80" />
          <StatCard label="Competitors Analyzed" value={stats.competitors} icon="🔎" color="var(--accent-cyan-light)" />
        </div>

        {/* Main content */}
        <div className="dashboard-grid">

          {/* Recent Content */}
          <Card style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700 }}>Recent Content</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/content-studio')} id="view-content-btn">View All</Button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : recentContent.length === 0 ? (
              <EmptyState
                icon="✍️"
                title="No content yet"
                description="Generate your first AI-powered post to see it here"
                action={
                  <Button variant="primary" size="sm" onClick={() => navigate('/content-studio')} id="empty-generate-btn">
                    Generate Content
                  </Button>
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentContent.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      padding: '14px 16px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{PLATFORM_ICON[item.platform] || '📄'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: PLATFORM_COLOR[item.platform] || 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {item.platform}
                        </span>
                        <Badge variant={item.status === 'scheduled' ? 'cyan' : item.status === 'posted' ? 'green' : 'gray'}>
                          {item.status}
                        </Badge>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.caption || 'No caption'}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AgentActivityPanel steps={agentSteps} />

            {/* Quick setup CTA */}
            {brands.length === 0 && (
              <motion.div
                className="glass-card"
                style={{ padding: 24, background: 'var(--accent-violet-dim)', border: '1px solid rgba(124,58,237,0.3)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
                <h4 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Set up your first brand</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Create your brand profile and upload your guidelines to unlock AI-powered content.
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate('/brand-setup')} id="setup-brand-cta" style={{ width: '100%' }}>
                  Set Up Brand →
                </Button>
              </motion.div>
            )}

            {/* Brands list */}
            {brands.length > 0 && (
              <Card style={{ padding: 20 }}>
                <h4 style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Your Brands</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {brands.slice(0, 3).map((brand) => (
                    <div key={brand.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: 'var(--gradient-brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {brand.name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{brand.industry}</div>
                      </div>
                      <Badge variant={brand.rag_status === 'ready' ? 'green' : brand.rag_status === 'indexing' ? 'yellow' : 'gray'}>
                        {brand.rag_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
