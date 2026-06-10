import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import { Card, Button, Input, Textarea, Badge, EmptyState } from '../components/ui'
import { competitorsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function CompetitorAnalysis() {
  const [competitors, setCompetitors] = useState([])
  const [activeCompetitor, setActiveCompetitor] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  const [form, setForm] = useState({
    name: '',
    website: '',
    industry: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadCompetitors()
  }, [])

  const loadCompetitors = async () => {
    setLoadingList(true)
    try {
      const { data } = await competitorsAPI.list()
      setCompetitors(data)
      if (data.length > 0 && !activeCompetitor) {
        setActiveCompetitor(data[0])
      }
    } catch (err) {
      toast.error('Failed to load competitor history')
    } finally {
      setLoadingList(false)
    }
  }

  const update = (field, val) => setForm((f) => ({ ...f, [field]: val }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Competitor name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const { data } = await competitorsAPI.analyze({
        name: form.name,
        website: form.website || null,
        industry: form.industry || null,
        notes: form.notes || null,
      })

      setCompetitors((prev) => [data, ...prev])
      setActiveCompetitor(data)
      setForm({ name: '', website: '', industry: '', notes: '' })
      toast.success('Competitor analysis complete!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to analyze competitor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this competitor analysis?')) return

    try {
      await competitorsAPI.delete(id)
      setCompetitors((prev) => prev.filter((c) => c.id !== id))
      if (activeCompetitor?.id === id) {
        setActiveCompetitor(competitors.find((c) => c.id !== id) || null)
      }
      toast.success('Deleted competitor analysis')
    } catch (err) {
      toast.error('Failed to delete competitor')
    }
  }

  // Get current analysis content
  const analysis = activeCompetitor?.analysis || {}

  return (
    <PageWrapper>
      <div style={{ padding: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title">Competitor Analysis</h1>
          <p className="page-subtitle">Analyze competitor positioning, tone, themes, and discover strategic gaps.</p>
        </div>

        {/* Dashboard/Page Grid */}
        <div className="dashboard-grid">
          {/* Main Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* New Competitor Analysis Input Form */}
            <Card style={{ padding: 24 }} hover={false}>
              <h2 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>New Competitor Analysis</h2>
              <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <Input
                    id="competitor-name"
                    label="Competitor Name *"
                    placeholder="e.g. Rival Corp"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    error={errors.name}
                  />
                  <Input
                    id="competitor-website"
                    label="Website URL"
                    placeholder="e.g. https://rivalcorp.com"
                    value={form.website}
                    onChange={(e) => update('website', e.target.value)}
                  />
                  <Input
                    id="competitor-industry"
                    label="Industry"
                    placeholder="e.g. Marketing Automation"
                    value={form.industry}
                    onChange={(e) => update('industry', e.target.value)}
                  />
                </div>
                <Textarea
                  id="competitor-notes"
                  label="Manually Entered Content & Notes (Describe their content strategy, list recent posts, etc.)"
                  placeholder="Paste their bio, descriptions of their social media presence, themes you've noticed, or any specific posting pattern you've observed..."
                  rows={4}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button type="submit" variant="primary" loading={isLoading} id="analyze-competitor-btn">
                    🔎 Analyze Competitor
                  </Button>
                </div>
              </form>
            </Card>

            {/* Analysis Loading State */}
            {isLoading && (
              <Card style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div className="spinner spinner-lg" />
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Analyzing Competitor...</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Our AI agent is parsing details, modeling tone, identifying opportunities, and extracting hashtags.</p>
                </div>
              </Card>
            )}

            {/* Analysis Result display */}
            {!isLoading && activeCompetitor && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Heading info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
                  <div>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }} className="gradient-text">
                      {activeCompetitor.name}
                    </h2>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      {activeCompetitor.website && (
                        <a
                          href={activeCompetitor.website.startsWith('http') ? activeCompetitor.website : `https://${activeCompetitor.website}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 13, color: 'var(--accent-cyan-light)', textDecoration: 'underline' }}
                        >
                          {activeCompetitor.website}
                        </a>
                      )}
                      {activeCompetitor.industry && (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          • {activeCompetitor.industry}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Analyzed on {new Date(activeCompetitor.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* 1. Competitor Overview */}
                <Card style={{ padding: 24 }} hover={false}>
                  <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--accent-violet-light)' }}>
                    1. Competitor Overview
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                    {analysis.Overview || 'No overview generated.'}
                  </p>
                </Card>

                {/* 2 & 4. Tone Analysis (Strengths & Weaknesses) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  <Card style={{ padding: 24 }} hover={false}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#4ade80' }}>
                      2. Strengths & Tone Analysis
                    </h3>
                    {analysis.Strengths && analysis.Strengths.length > 0 ? (
                      <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {analysis.Strengths.map((str, idx) => (
                          <li key={idx} style={{ lineHeight: '1.5' }}>{str}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No strengths noted.</p>
                    )}
                  </Card>

                  <Card style={{ padding: 24 }} hover={false}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#f87171' }}>
                      4. Weaknesses & Gaps
                    </h3>
                    {analysis.Weaknesses && analysis.Weaknesses.length > 0 ? (
                      <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {analysis.Weaknesses.map((weak, idx) => (
                          <li key={idx} style={{ lineHeight: '1.5' }}>{weak}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No weaknesses noted.</p>
                    )}
                  </Card>
                </div>

                {/* 3 & 5. Content Themes & Popular Hashtags */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  <Card style={{ padding: 24 }} hover={false}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--accent-cyan-light)' }}>
                      3. Content Themes & Posting Strategy
                    </h3>
                    {analysis["Popular Themes"] && analysis["Popular Themes"].length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {analysis["Popular Themes"].map((theme, idx) => (
                          <Badge key={idx} variant="violet">{theme}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No themes noted.</p>
                    )}
                  </Card>

                  <Card style={{ padding: 24 }} hover={false}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#fbbf24' }}>
                      5. Popular Hashtags
                    </h3>
                    {analysis["Popular Hashtags"] && analysis["Popular Hashtags"].length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {analysis["Popular Hashtags"].map((tag, idx) => (
                          <Badge key={idx} variant="cyan">{tag}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No hashtags noted.</p>
                    )}
                  </Card>
                </div>

                {/* 6 & 7. Content Opportunities & Recommended Actions */}
                <Card style={{ padding: 24 }} hover={false}>
                  <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--accent-violet-light)' }}>
                    6. Content Opportunities
                  </h3>
                  {analysis.Opportunities && analysis.Opportunities.length > 0 ? (
                    <ul style={{ paddingLeft: 18, fontSize: 14, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {analysis.Opportunities.map((opp, idx) => (
                        <li key={idx} style={{ lineHeight: '1.6' }}>{opp}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 20 }}>No opportunities observed.</p>
                  )}

                  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '20px 0' }} />

                  <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#4ade80' }}>
                    7. Recommended Actions
                  </h3>
                  {analysis.Recommendations && analysis.Recommendations.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.Recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '12px 14px', background: 'var(--bg-input)',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <span style={{ color: 'var(--accent-cyan-light)', fontWeight: 600 }}>💡</span>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.5' }}>{rec}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No recommendations observed.</p>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Empty State */}
            {!isLoading && !activeCompetitor && (
              <EmptyState
                icon="🔎"
                title="No competitor analyzed yet"
                description="Input a competitor name, industry, and some notes above to run a competitive analysis."
              />
            )}
          </div>

          {/* Right Column / History Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card style={{ padding: 20 }} hover={false}>
              <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Saved Competitors</h3>
              
              {loadingList ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <div className="spinner" />
                </div>
              ) : competitors.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                  No analyzed competitors.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {competitors.map((c) => {
                    const isActive = activeCompetitor?.id === c.id
                    return (
                      <motion.div
                        key={c.id}
                        onClick={() => setActiveCompetitor(c)}
                        whileHover={{ x: 2 }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: isActive ? 'var(--accent-violet-dim)' : 'var(--bg-input)',
                          borderRadius: 'var(--radius-md)',
                          border: isActive ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          gap: 12
                        }}
                      >
                        <div style={{
                          width: 32, height: 32,
                          background: 'var(--gradient-brand)',
                          borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, flexShrink: 0,
                          color: '#fff'
                        }}>
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.industry || 'No industry'}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(c.id, e)}
                          style={{
                            background: 'none', border: 'none', color: '#f87171',
                            fontSize: 14, cursor: 'pointer', opacity: 0.7, padding: '4px 6px'
                          }}
                          title="Delete Analysis"
                          className="delete-comp-btn"
                        >
                          ✕
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
