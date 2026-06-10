import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import { Card, Badge, EmptyState, Button } from '../components/ui'
import { analyticsAPI } from '../services/api'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const PLATFORM_COLORS_MAP = {
  instagram: '#e1306c', linkedin: '#0077b5', twitter: '#1da1f2', facebook: '#1877f2',
}

const DATE_RANGES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-navy)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13,
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color || 'var(--accent-violet-light)' }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [days])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await analyticsAPI.get({ days })
      setData(res.data)
    } catch { } finally { setLoading(false) }
  }

  const pieData = data?.content_by_platform?.map((p) => ({
    name: p.platform,
    value: p.count,
  })) || []

  return (
    <PageWrapper>
      <div style={{ padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Track your AI content performance across platforms</p>
          </div>
          {/* Date range picker */}
          <div style={{ display: 'flex', gap: 8 }}>
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDays(r.value)}
                id={`range-${r.value}`}
                style={{
                  padding: '7px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, cursor: 'pointer',
                  background: days === r.value ? 'var(--accent-violet-dim)' : 'var(--bg-input)',
                  border: `1px solid ${days === r.value ? 'rgba(124,58,237,0.4)' : 'var(--border-subtle)'}`,
                  color: days === r.value ? 'var(--accent-violet-light)' : 'var(--text-secondary)',
                  fontWeight: days === r.value ? 600 : 400,
                  transition: 'all 0.2s',
                }}
              >{r.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : !data ? (
          <EmptyState icon="📊" title="No analytics data yet" description="Start generating and scheduling content to see your performance metrics" />
        ) : (
          <>
            {/* Stats row */}
            <div className="stats-grid">
              {[
                { label: 'Posts Generated', value: data.summary.total_posts_generated, icon: '📝', color: 'var(--accent-violet-light)' },
                { label: 'Scheduled Posts', value: data.summary.posts_scheduled_this_week, icon: '📅', color: 'var(--accent-cyan-light)' },
                { label: 'Avg Engagement', value: `${data.summary.avg_engagement_rate}%`, icon: '📈', color: '#fbbf24' },
                { label: 'Active Brands', value: data.summary.active_brands, icon: '✦', color: '#4ade80' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="glass-card stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -2 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="stat-label">{stat.label}</span>
                    <span style={{ fontSize: 20 }}>{stat.icon}</span>
                  </div>
                  <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Charts grid */}
            <div className="analytics-grid-two">

              {/* Line chart: Posts over time */}
              <Card style={{ padding: 24, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Posts Generated Over Time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.posts_over_time}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="posts" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Bar chart: Content by platform */}
              <Card style={{ padding: 24, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Content by Platform</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.content_by_platform}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="platform" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.content_by_platform.map((entry) => (
                        <Cell key={entry.platform} fill={PLATFORM_COLORS_MAP[entry.platform] || '#7c3aed'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <div className="analytics-grid-trend">

              {/* Area chart: Engagement trend */}
              <Card style={{ padding: 24, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Engagement Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.engagement_trend.slice(-30)}>
                    <defs>
                      <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="engagement" name="Engagement %" stroke="#06b6d4" strokeWidth={2} fill="url(#engGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Pie chart: Platform breakdown */}
              <Card style={{ padding: 24, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Platform Breakdown</h3>
                {pieData.length === 0 ? (
                  <EmptyState icon="🥧" title="No data yet" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={PLATFORM_COLORS_MAP[entry.name] || '#7c3aed'} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                      {pieData.map((entry) => (
                        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS_MAP[entry.name] || '#7c3aed' }} />
                            <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{entry.name}</span>
                          </div>
                          <span style={{ fontWeight: 600 }}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Top Content */}
            {data.top_content?.length > 0 && (
              <Card style={{ padding: 24, marginTop: 20 }}>
                <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Top Performing Content</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.top_content.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 14px', background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.caption || 'No caption'}
                        </div>
                      </div>
                      <Badge variant={item.status === 'posted' ? 'green' : item.status === 'scheduled' ? 'cyan' : 'gray'}>
                        {item.status}
                      </Badge>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, textTransform: 'capitalize' }}>
                        {item.platform}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
