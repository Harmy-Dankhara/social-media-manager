import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import { Button, Card, Badge, EmptyState } from '../components/ui'
import { contentAPI } from '../services/api'
import useBrandStore from '../store/brandStore'
import useContentStore from '../store/contentStore'
import { useWebSocket } from '../hooks/useWebSocket'
import toast from 'react-hot-toast'

const PLATFORMS = ['instagram', 'linkedin', 'twitter', 'facebook']
const CONTENT_TYPES = ['Post', 'Carousel', 'Story', 'Thread']
const PLATFORM_COLORS = { instagram: '#e1306c', linkedin: '#0077b5', twitter: '#1da1f2', facebook: '#1877f2' }
const PLATFORM_ICONS = { instagram: '📸', linkedin: '💼', twitter: '🐦', facebook: '📘' }
const PLATFORM_CHAR_LIMIT = { instagram: 2200, linkedin: 3000, twitter: 280, facebook: 500 }

function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 6 }}>
      <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
    </span>
  )
}

function AgentSteps({ steps, isGenerating }) {
  if (steps.length === 0 && !isGenerating) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 16, marginBottom: 20,
        background: 'var(--accent-violet-dim)',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-violet-light)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
        Agent Activity {isGenerating && <ThinkingDots />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((step, i) => (
          <motion.div
            key={step.timestamp}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ fontSize: 13, color: i === steps.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {step.message}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function StreamingText({ text }) {
  const [displayed, setDisplayed] = useState('')
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setDisplayed('')
    setIdx(0)
  }, [text])

  useEffect(() => {
    if (!text) return
    const words = text.split(' ')
    if (idx >= words.length) return
    const timer = setTimeout(() => {
      setDisplayed((d) => (d ? d + ' ' + words[idx] : words[idx]))
      setIdx((i) => i + 1)
    }, 40)
    return () => clearTimeout(timer)
  }, [idx, text])

  return <span>{displayed || text}</span>
}

function PostCard({ post, platform, index, onEdit, onSchedule, onRegenerate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedCaption, setEditedCaption] = useState(post.caption || '')
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(post.formatted_caption || post.caption || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    onEdit(index, { caption: editedCaption, formatted_caption: editedCaption })
    setIsEditing(false)
  }

  const limit = PLATFORM_CHAR_LIMIT[platform] || 2200
  const charCount = (post.caption || '').length
  const isOverLimit = charCount > limit

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card"
      style={{ padding: 20, marginBottom: 16 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{PLATFORM_ICONS[platform]}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: PLATFORM_COLORS[platform] || 'var(--text-primary)', textTransform: 'capitalize' }}>
            {platform}
          </span>
          <Badge variant="gray">Post {index + 1}</Badge>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="ghost" size="sm" onClick={copy} id={`copy-${platform}-${index}`}>
            {copied ? '✅' : '📋'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} id={`edit-${platform}-${index}`}>
            ✏️ Edit
          </Button>
        </div>
      </div>

      {/* Caption */}
      {isEditing ? (
        <div style={{ marginBottom: 14 }}>
          <textarea
            value={editedCaption}
            onChange={(e) => setEditedCaption(e.target.value)}
            className="input-field"
            rows={6}
            style={{ resize: 'vertical', fontSize: 14 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} id={`save-${platform}-${index}`}>Save</Button>
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)',
          background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
          padding: 14, marginBottom: 14, whiteSpace: 'pre-wrap',
        }}>
          {post._streaming ? (
            <span style={{ color: 'var(--text-muted)' }}>Generating<ThinkingDots /></span>
          ) : (
            <StreamingText text={post.caption || ''} />
          )}
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {post.hashtags.map((tag) => (
            <span key={tag} style={{ fontSize: 12, color: 'var(--accent-cyan-light)', background: 'var(--accent-cyan-dim)', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(6,182,212,0.2)' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Emojis */}
      {post.emojis && post.emojis.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, fontSize: 18 }}>
          {post.emojis.map((emoji, i) => <span key={i}>{emoji}</span>)}
        </div>
      )}

      {/* Character count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: isOverLimit ? '#f87171' : 'var(--text-muted)' }}>
          {charCount}/{limit} characters {isOverLimit && '⚠️ Over limit'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
        <Button variant="primary" size="sm" onClick={() => onSchedule(post)} id={`schedule-${platform}-${index}`} style={{ flex: 1 }}>
          📅 Schedule
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onRegenerate(platform, index)} id={`regen-${platform}-${index}`}>
          🔄 Regenerate
        </Button>
      </div>
    </motion.div>
  )
}

function ScheduleModal({ post, platform, isOpen, onClose, onConfirm }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const { brands } = useBrandStore()
  const [selectedBrand, setSelectedBrand] = useState(brands[0]?.id || '')

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 440, padding: 28 }}
      >
        <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Schedule Post</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="input-label">Brand</label>
            <select className="input-field" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} style={{ cursor: 'pointer' }} id="schedule-brand">
              {brands.map((b) => <option key={b.id} value={b.id} style={{ background: 'var(--bg-navy)' }}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Date</label>
            <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} id="schedule-date" min={new Date().toISOString().split('T')[0]} style={{ cursor: 'pointer' }} />
          </div>
          <div>
            <label className="input-label">Time</label>
            <input type="time" className="input-field" value={time} onChange={(e) => setTime(e.target.value)} id="schedule-time" style={{ cursor: 'pointer' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }} id="schedule-cancel">Cancel</Button>
          <Button variant="primary" onClick={() => onConfirm({ date, time, brand_id: selectedBrand })} style={{ flex: 1 }} id="schedule-confirm">
            Schedule
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ContentStudio() {
  const { brands, fetchBrands } = useBrandStore()
  const { generatedPosts, agentSteps, isGenerating, generationComplete, updatePost, clearGeneration, addGeneratedPost } = useContentStore()
  const [form, setForm] = useState({
    brandId: '',
    platforms: ['instagram'],
    contentType: 'Post',
    topic: '',
    numPosts: 3,
  })
  const [activePlatform, setActivePlatform] = useState('instagram')
  const [scheduleModal, setScheduleModal] = useState({ open: false, post: null, platform: null })
  const [errors, setErrors] = useState({})

  useWebSocket()

  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    if (brands.length > 0 && !form.brandId) {
      setForm((f) => ({ ...f, brandId: brands[0].id }))
    }
  }, [brands])

  const togglePlatform = (p) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }))
  }

  const validate = () => {
    const errs = {}
    if (!form.brandId) errs.brandId = 'Select a brand'
    if (form.platforms.length === 0) errs.platforms = 'Select at least one platform'
    if (!form.topic.trim()) errs.topic = 'Enter a topic or campaign brief'
    return errs
  }

  const handleGenerate = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    clearGeneration()

    // Set active platform to first selected
    if (form.platforms.length > 0) setActivePlatform(form.platforms[0])

    try {
      await contentAPI.generate({
        brand_id: form.brandId,
        platforms: form.platforms,
        content_type: form.contentType.toLowerCase(),
        topic: form.topic,
        num_posts: form.numPosts,
      })
    } catch (err) {
      toast.error('Failed to start generation')
    }
  }

  const handleSchedule = async ({ date, time, brand_id }) => {
    const { post, platform } = scheduleModal
    if (!post || !date || !time) return

    try {
      const { schedulerAPI } = await import('../services/api')
      await schedulerAPI.schedule({
        content_id: post.id || 'temp',
        brand_id,
        platform,
        scheduled_at: `${date}T${time}:00Z`,
      })
      toast.success('Post scheduled!')
      setScheduleModal({ open: false, post: null, platform: null })
    } catch {
      toast.error('Failed to schedule post')
    }
  }

  const activePosts = generatedPosts[activePlatform] || []
  const platformsWithContent = Object.keys(generatedPosts).filter((p) => (generatedPosts[p] || []).length > 0)

  return (
    <PageWrapper>
      <div style={{ padding: '32px', height: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="page-title">Content Studio</h1>
          <p className="page-subtitle">Generate AI-powered content across all your platforms</p>
        </div>

        <div className="studio-grid">

          {/* ── Left Panel: Controls ── */}
          <Card className="studio-sidebar" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Generation Settings</h3>

            {/* Brand */}
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Brand</label>
              {brands.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 0' }}>
                  No brands yet.{' '}
                  <a href="/brand-setup" style={{ color: 'var(--accent-violet-light)' }}>Create one →</a>
                </div>
              ) : (
                <select
                  className={`input-field ${errors.brandId ? 'error' : ''}`}
                  value={form.brandId}
                  onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                  id="cs-brand"
                  style={{ cursor: 'pointer' }}
                >
                  {brands.map((b) => <option key={b.id} value={b.id} style={{ background: 'var(--bg-navy)' }}>{b.name}</option>)}
                </select>
              )}
              {errors.brandId && <span className="input-error">{errors.brandId}</span>}
            </div>

            {/* Platforms */}
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Platforms</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {PLATFORMS.map((p) => (
                  <motion.button
                    key={p}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => togglePlatform(p)}
                    id={`platform-${p}`}
                    style={{
                      padding: '6px 12px', borderRadius: 'var(--radius-full)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: form.platforms.includes(p) ? `${PLATFORM_COLORS[p]}22` : 'var(--bg-input)',
                      border: `1px solid ${form.platforms.includes(p) ? PLATFORM_COLORS[p] + '60' : 'var(--border-subtle)'}`,
                      color: form.platforms.includes(p) ? PLATFORM_COLORS[p] : 'var(--text-secondary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </motion.button>
                ))}
              </div>
              {errors.platforms && <span className="input-error">{errors.platforms}</span>}
            </div>

            {/* Content Type */}
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Content Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, contentType: t }))}
                    id={`type-${t.toLowerCase()}`}
                    style={{
                      padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: 'pointer',
                      background: form.contentType === t ? 'var(--accent-violet-dim)' : 'var(--bg-input)',
                      border: `1px solid ${form.contentType === t ? 'rgba(124,58,237,0.4)' : 'var(--border-subtle)'}`,
                      color: form.contentType === t ? 'var(--accent-violet-light)' : 'var(--text-secondary)',
                      fontWeight: form.contentType === t ? 600 : 400,
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div style={{ marginBottom: 16 }}>
              <label className="input-label" htmlFor="cs-topic">Topic / Campaign Brief</label>
              <textarea
                id="cs-topic"
                rows={4}
                className={`input-field ${errors.topic ? 'error' : ''}`}
                placeholder="e.g. Launch our new summer collection, focusing on sustainability and eco-friendly materials..."
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
              {errors.topic && <span className="input-error">{errors.topic}</span>}
            </div>

            {/* Num posts */}
            <div style={{ marginBottom: 24 }}>
              <label className="input-label">Posts per Platform: {form.numPosts}</label>
              <input
                type="range" min={1} max={7} value={form.numPosts}
                onChange={(e) => setForm((f) => ({ ...f, numPosts: Number(e.target.value) }))}
                id="cs-num-posts"
                style={{ width: '100%', accentColor: 'var(--accent-violet)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                <span>1</span><span>7</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              loading={isGenerating}
              disabled={isGenerating}
              id="generate-content-btn"
              style={{ width: '100%', fontSize: 15 }}
            >
              {isGenerating ? '🤖 Generating...' : '⚡ Generate Content'}
            </Button>

            {generationComplete && (
              <Button variant="ghost" size="sm" onClick={clearGeneration} style={{ width: '100%', marginTop: 10 }} id="clear-content-btn">
                Clear & Start Over
              </Button>
            )}
          </Card>

          {/* ── Right Panel: Generated Content ── */}
          <div>
            {/* Agent Steps */}
            <AgentSteps steps={agentSteps} isGenerating={isGenerating} />

            {/* Empty state */}
            {!isGenerating && platformsWithContent.length === 0 && (
              <Card style={{ padding: 0 }}>
                <EmptyState
                  icon="✨"
                  title="Your generated content will appear here"
                  description="Configure your settings on the left and click Generate to create AI-powered posts that stream live, word by word."
                />
              </Card>
            )}

            {/* Platform tabs */}
            {(isGenerating || platformsWithContent.length > 0) && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {form.platforms.map((p) => (
                    <motion.button
                      key={p}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActivePlatform(p)}
                      id={`tab-${p}`}
                      style={{
                        padding: '8px 18px', borderRadius: 'var(--radius-full)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: activePlatform === p ? `${PLATFORM_COLORS[p]}22` : 'var(--bg-input)',
                        border: `1px solid ${activePlatform === p ? PLATFORM_COLORS[p] + '60' : 'var(--border-subtle)'}`,
                        color: activePlatform === p ? PLATFORM_COLORS[p] : 'var(--text-secondary)',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                      {(generatedPosts[p] || []).length > 0 && (
                        <span style={{
                          background: PLATFORM_COLORS[p], color: '#fff',
                          borderRadius: '50%', width: 18, height: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700,
                        }}>{(generatedPosts[p] || []).length}</span>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Posts for active platform */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePlatform}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {isGenerating && activePosts.length === 0 && (
                      <Card style={{ padding: 32, textAlign: 'center' }}>
                        <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                          AI is crafting your {activePlatform} posts<ThinkingDots />
                        </p>
                      </Card>
                    )}

                    {activePosts.filter((p) => !p._streaming).map((post, i) => (
                      <PostCard
                        key={`${activePlatform}-${i}`}
                        post={post}
                        platform={activePlatform}
                        index={i}
                        onEdit={(idx, updates) => updatePost(activePlatform, idx, updates)}
                        onSchedule={(post) => setScheduleModal({ open: true, post, platform: activePlatform })}
                        onRegenerate={() => toast('Regenerate: trigger a new generation run')}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {scheduleModal.open && (
          <ScheduleModal
            isOpen={scheduleModal.open}
            post={scheduleModal.post}
            platform={scheduleModal.platform}
            onClose={() => setScheduleModal({ open: false, post: null, platform: null })}
            onConfirm={handleSchedule}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
