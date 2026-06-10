import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import { Card, Button, Badge, Modal, EmptyState } from '../components/ui'
import { schedulerAPI, contentAPI } from '../services/api'
import useBrandStore from '../store/brandStore'
import toast from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns'

const PLATFORM_COLORS = { instagram: '#e1306c', linkedin: '#0077b5', twitter: '#1da1f2', facebook: '#1877f2' }
const PLATFORM_ICONS = { instagram: '📸', linkedin: '💼', twitter: '🐦', facebook: '📘' }
const STATUS_VARIANT = { scheduled: 'cyan', posted: 'green', cancelled: 'red' }

function CalendarDay({ date, posts, isCurrentMonth, onClick }) {
  const platformDots = [...new Set(posts.map((p) => p.platform))]

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      onClick={() => posts.length > 0 && onClick(date, posts)}
      style={{
        padding: '8px 6px', minHeight: 72, borderRadius: 'var(--radius-sm)',
        background: isToday(date) ? 'var(--accent-violet-dim)' : 'var(--bg-input)',
        border: isToday(date) ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--border-subtle)',
        cursor: posts.length > 0 ? 'pointer' : 'default',
        opacity: isCurrentMonth ? 1 : 0.35,
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        fontSize: 12, fontWeight: isToday(date) ? 700 : 400,
        color: isToday(date) ? 'var(--accent-violet-light)' : 'var(--text-secondary)',
        marginBottom: 6,
      }}>{format(date, 'd')}</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {platformDots.slice(0, 4).map((platform) => (
          <div key={platform} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: PLATFORM_COLORS[platform] || 'var(--accent-violet)',
            boxShadow: `0 0 4px ${PLATFORM_COLORS[platform] || 'var(--accent-violet)'}60`,
          }} />
        ))}
        {posts.length > 4 && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{posts.length - 4}</div>
        )}
      </div>
    </motion.div>
  )
}

export default function Scheduler() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [contentList, setContentList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ contentId: '', platform: 'instagram', date: '', time: '09:00', brandId: '' })
  const { brands } = useBrandStore()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [schedRes, contentRes] = await Promise.all([
        schedulerAPI.list(),
        contentAPI.list(),
      ])
      setScheduledPosts(schedRes.data)
      setContentList(contentRes.data.filter((c) => c.status === 'draft'))
    } catch { } finally { setLoading(false) }
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOffset = startOfMonth(currentMonth).getDay()
  const paddedDays = [...Array(firstDayOffset).fill(null), ...days]

  const getPostsForDay = (date) =>
    scheduledPosts.filter((p) => p.status !== 'cancelled' && isSameDay(new Date(p.scheduled_at), date))

  const dayPosts = selectedDay ? getPostsForDay(selectedDay) : []

  useEffect(() => {
    if (dayModalOpen && dayPosts.length === 0) {
      setDayModalOpen(false)
    }
  }, [dayPosts.length, dayModalOpen])

  const handleDayClick = (date, posts) => {
    setSelectedDay(date)
    setDayModalOpen(true)
  }

  const handleSchedule = async () => {
    try {
      const brand = brands[0]
      await schedulerAPI.schedule({
        content_id: scheduleForm.contentId,
        brand_id: scheduleForm.brandId || brand?.id,
        platform: scheduleForm.platform,
        scheduled_at: `${scheduleForm.date}T${scheduleForm.time}:00Z`,
      })
      toast.success('Post scheduled!')
      setScheduleModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to schedule')
    }
  }

  const handleCancel = async (id) => {
    try {
      await schedulerAPI.cancel(id)
      toast.success('Schedule cancelled')
      loadData()
    } catch { toast.error('Failed to cancel') }
  }

  const next7 = scheduledPosts
    .filter((p) => {
      if (p.status === 'cancelled') return false
      const d = new Date(p.scheduled_at)
      const now = new Date()
      const in7 = new Date()
      in7.setDate(in7.getDate() + 7)
      return d >= now && d <= in7
    })
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))

  return (
    <PageWrapper>
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Scheduler</h1>
            <p className="page-subtitle">Plan and manage your content calendar</p>
          </div>
          <Button variant="primary" onClick={() => setScheduleModalOpen(true)} id="new-schedule-btn">
            + Schedule Post
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>

          {/* Calendar */}
          <Card style={{ padding: 24 }}>
            {/* Month Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} id="prev-month">←</Button>
              <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>{format(currentMonth, 'MMMM yyyy')}</h3>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} id="next-month">→</Button>
            </div>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {paddedDays.map((date, i) => (
                date ? (
                  <CalendarDay
                    key={i}
                    date={date}
                    posts={getPostsForDay(date)}
                    isCurrentMonth={true}
                    onClick={handleDayClick}
                  />
                ) : (
                  <div key={i} />
                )
              ))}
            </div>
          </Card>

          {/* Upcoming 7 days */}
          <Card style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Upcoming (7 days)</h3>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <div className="spinner" />
              </div>
            ) : next7.length === 0 ? (
              <EmptyState icon="📅" title="No posts scheduled" description="Schedule content to see your upcoming posts here" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {next7.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{PLATFORM_ICONS[p.platform] || '📄'}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: PLATFORM_COLORS[p.platform] || 'var(--text-secondary)' }}>
                          {p.platform}
                        </span>
                      </div>
                      <Badge variant={STATUS_VARIANT[p.status] || 'gray'}>{p.status}</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      📅 {format(new Date(p.scheduled_at), 'MMM d, h:mm a')}
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleCancel(p.id)} id={`cancel-${p.id}`} style={{ fontSize: 11 }}>
                      Cancel
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Day Modal */}
        <Modal isOpen={dayModalOpen} onClose={() => setDayModalOpen(false)} title={selectedDay ? format(selectedDay, 'MMMM d, yyyy') : ''}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dayPosts.map((p) => (
              <div key={p.id} style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{PLATFORM_ICONS[p.platform]}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: PLATFORM_COLORS[p.platform] }}>{p.platform}</span>
                  </div>
                  <Badge variant={STATUS_VARIANT[p.status] || 'gray'}>{p.status}</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(p.scheduled_at), 'h:mm a')}</div>
                {p.status !== 'cancelled' && (
                  <Button variant="danger" size="sm" onClick={() => handleCancel(p.id)} id={`modal-cancel-${p.id}`} style={{ marginTop: 8, fontSize: 11 }}>
                    Cancel Schedule
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Modal>

        {/* Schedule Modal */}
        <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Schedule a Post">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="input-label">Select Post</label>
              <select className="input-field" value={scheduleForm.contentId} onChange={(e) => setScheduleForm((f) => ({ ...f, contentId: e.target.value }))} id="sched-content" style={{ cursor: 'pointer' }}>
                <option value="" style={{ background: 'var(--bg-navy)' }}>-- Choose a draft post --</option>
                {contentList.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: 'var(--bg-navy)' }}>
                    [{c.platform}] {(c.caption || 'No caption').slice(0, 50)}...
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Platform</label>
              <select className="input-field" value={scheduleForm.platform} onChange={(e) => setScheduleForm((f) => ({ ...f, platform: e.target.value }))} id="sched-platform" style={{ cursor: 'pointer' }}>
                {['instagram', 'linkedin', 'twitter', 'facebook'].map((p) => (
                  <option key={p} value={p} style={{ background: 'var(--bg-navy)' }}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Date</label>
              <input type="date" className="input-field" value={scheduleForm.date} onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))} id="sched-date" min={new Date().toISOString().split('T')[0]} style={{ cursor: 'pointer' }} />
            </div>
            <div>
              <label className="input-label">Time</label>
              <input type="time" className="input-field" value={scheduleForm.time} onChange={(e) => setScheduleForm((f) => ({ ...f, time: e.target.value }))} id="sched-time" style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost" onClick={() => setScheduleModalOpen(false)} style={{ flex: 1 }} id="sched-cancel">Cancel</Button>
              <Button variant="primary" onClick={handleSchedule} style={{ flex: 1 }} id="sched-confirm">Schedule</Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageWrapper>
  )
}
