import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import { Button, Input, Textarea } from '../components/ui'
import { brandsAPI } from '../services/api'
import toast from 'react-hot-toast'

const VOICE_OPTIONS = ['Professional', 'Casual', 'Witty', 'Inspirational', 'Bold']
const INDUSTRIES = ['Technology', 'Fashion', 'Food & Beverage', 'Healthcare', 'Finance', 'Education', 'Retail', 'Travel', 'Real Estate', 'Marketing', 'Entertainment', 'Other']

const STEPS = ['Brand Basics', 'Target Audience', 'Brand Voice', 'Upload Docs']

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
}

export default function BrandSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [createdBrandId, setCreatedBrandId] = useState(null)
  const [ragStatus, setRagStatus] = useState(null) // null | 'uploading' | 'done'
  const [uploadedFile, setUploadedFile] = useState(null)

  const [form, setForm] = useState({
    name: '', industry: 'Technology', website: '', description: '',
    ageRange: '', interests: '', location: '',
    brandVoice: 'Professional',
  })
  const [errors, setErrors] = useState({})

  const update = (field, val) => setForm((f) => ({ ...f, [field]: val }))

  const validateStep = () => {
    const errs = {}
    if (step === 0) {
      if (!form.name.trim()) errs.name = 'Brand name is required'
      if (!form.description.trim()) errs.description = 'Description is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = async () => {
    if (!validateStep()) return
    if (step < STEPS.length - 1) {
      setDir(1)
      setStep((s) => s + 1)
    } else {
      await handleSubmit()
    }
  }

  const goBack = () => {
    setDir(-1)
    setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const payload = {
        name: form.name,
        industry: form.industry,
        website: form.website || null,
        description: form.description,
        brand_voice: form.brandVoice,
        target_audience: {
          age_range: form.ageRange || null,
          interests: form.interests ? form.interests.split(',').map((s) => s.trim()).filter(Boolean) : [],
          location: form.location || null,
        },
      }
      const { data } = await brandsAPI.create(payload)
      setCreatedBrandId(data.id)
      toast.success('Brand created successfully!')

      // If file was selected, upload it
      if (uploadedFile) {
        setRagStatus('uploading')
        await brandsAPI.uploadDoc(data.id, uploadedFile)
        setRagStatus('done')
        toast.success('Brand documents indexed by AI!')
      } else {
        setRagStatus('done')
      }

      setTimeout(() => navigate('/content-studio'), 1500)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create brand')
    } finally {
      setIsLoading(false)
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <PageWrapper>
      <div style={{ padding: '32px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 className="page-title">Set Up Your Brand</h1>
          <p className="page-subtitle">Configure your brand profile for AI-powered content generation</p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            {STEPS.map((s, i) => (
              <span key={s} style={{ fontSize: 12, fontWeight: 600, color: i <= step ? 'var(--accent-violet-light)' : 'var(--text-muted)', transition: 'color 0.3s' }}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
          <div className="progress-bar-wrap">
            <motion.div className="progress-bar-fill" animate={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step dots */}
        <div className="step-dots" style={{ marginBottom: 32, justifyContent: 'center' }}>
          {STEPS.map((_, i) => (
            <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        {/* Step Content */}
        <motion.div className="glass-card" style={{ padding: 36, overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence custom={dir} mode="wait">
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >

              {/* Step 0: Brand Basics */}
              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Brand Basics</h2>
                  <Input id="brand-name" label="Brand Name *" placeholder="e.g. Acme Corp" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="input-label">Industry *</label>
                    <select className="input-field" value={form.industry} onChange={(e) => update('industry', e.target.value)} id="brand-industry" style={{ cursor: 'pointer' }}>
                      {INDUSTRIES.map((ind) => <option key={ind} value={ind} style={{ background: 'var(--bg-navy)' }}>{ind}</option>)}
                    </select>
                  </div>
                  <Input id="brand-website" label="Website URL" placeholder="https://yourcompany.com" value={form.website} onChange={(e) => update('website', e.target.value)} />
                  <Textarea id="brand-desc" label="Brand Description *" placeholder="Describe your brand, what you do, and what makes you unique..." rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} error={errors.description} />
                </div>
              )}

              {/* Step 1: Target Audience */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Target Audience</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>Tell the AI who your content should speak to.</p>
                  <Input id="brand-age" label="Age Range" placeholder="e.g. 25-40" value={form.ageRange} onChange={(e) => update('ageRange', e.target.value)} />
                  <Textarea id="brand-interests" label="Interests (comma-separated)" placeholder="e.g. fitness, health, wellness, sustainability" rows={3} value={form.interests} onChange={(e) => update('interests', e.target.value)} />
                  <Input id="brand-location" label="Primary Location" placeholder="e.g. United States, Global" value={form.location} onChange={(e) => update('location', e.target.value)} />
                </div>
              )}

              {/* Step 2: Brand Voice */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Brand Voice</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Select the tone that best represents your brand's personality.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    {VOICE_OPTIONS.map((voice) => (
                      <motion.button
                        key={voice}
                        id={`voice-${voice.toLowerCase()}`}
                        onClick={() => update('brandVoice', voice)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          padding: '16px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: form.brandVoice === voice ? '2px solid var(--accent-violet)' : '1px solid var(--border-subtle)',
                          background: form.brandVoice === voice ? 'var(--accent-violet-dim)' : 'var(--bg-input)',
                          color: form.brandVoice === voice ? 'var(--accent-violet-light)' : 'var(--text-secondary)',
                          fontWeight: form.brandVoice === voice ? 700 : 400,
                          fontSize: 14,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: form.brandVoice === voice ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
                        }}
                      >
                        {form.brandVoice === voice ? '✓ ' : ''}{voice}
                      </motion.button>
                    ))}
                  </div>
                  <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {form.brandVoice === 'Professional' && '"We\'re excited to announce our latest innovation in customer solutions..."'}
                      {form.brandVoice === 'Casual' && '"Hey! Big news — we just dropped something you\'re gonna love! 🎉"'}
                      {form.brandVoice === 'Witty' && '"Plot twist: your Monday just got 10x better. You\'re welcome. 😏"'}
                      {form.brandVoice === 'Inspirational' && '"Every journey begins with a single step. Today, we take ours together. 🌟"'}
                      {form.brandVoice === 'Bold' && '"WE JUST CHANGED THE GAME. No more excuses. This is the future. 🔥"'}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Upload Docs */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Upload Brand Documents</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Upload your brand guidelines, style guide, or any PDF/text document. The AI will index these using RAG for hyper-personalized content.
                  </p>

                  <motion.label
                    htmlFor="doc-upload"
                    whileHover={{ scale: 1.01 }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 12, padding: '40px 24px',
                      border: `2px dashed ${uploadedFile ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-lg)',
                      background: uploadedFile ? 'var(--accent-cyan-dim)' : 'var(--bg-input)',
                      cursor: 'pointer', transition: 'all 0.3s',
                    }}
                  >
                    <span style={{ fontSize: 36 }}>{uploadedFile ? '✅' : '📄'}</span>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                        {uploadedFile ? uploadedFile.name : 'Click to upload or drag & drop'}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF, TXT, or DOC — max 10MB</div>
                    </div>
                    <input id="doc-upload" type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }} onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} />
                  </motion.label>

                  {ragStatus === 'uploading' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--accent-violet-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124,58,237,0.3)' }}>
                      <div className="spinner" />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-violet-light)' }}>Brand Intelligence Loading...</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pinecone is indexing your documents</div>
                      </div>
                    </div>
                  )}

                  {ragStatus === 'done' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.25)' }}
                    >
                      <span style={{ fontSize: 20 }}>✅</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#4ade80' }}>Brand ready! Redirecting to Content Studio...</div>
                      </div>
                    </motion.div>
                  )}

                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    ℹ️ You can skip this step and upload documents later from Brand Settings.
                  </p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
            <Button variant="ghost" onClick={goBack} disabled={step === 0} id="brand-back-btn">← Back</Button>
            <Button variant="primary" onClick={goNext} loading={isLoading} id="brand-next-btn">
              {step === STEPS.length - 1 ? (isLoading ? 'Creating...' : 'Create Brand →') : 'Next →'}
            </Button>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  )
}
