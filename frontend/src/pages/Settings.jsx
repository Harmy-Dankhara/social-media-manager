import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import PageWrapper from '../components/layout/PageWrapper'
import { Card, Button, Input } from '../components/ui'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'

export default function Settings() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()

  // Profile fields
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileErrors, setProfileErrors] = useState({})

  // API Key fields
  const [apiKey, setApiKey] = useState('')
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')

  // Notifications fields
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPush, setNotifPush] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  // Danger Zone
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Initial load
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '')
      setProfileEmail(user.email || '')
      setApiKey(user.gemini_api_key || '')
      try {
        const parsed = JSON.parse(user.notification_preferences || '{}')
        setNotifEmail(parsed.email !== false)
        setNotifPush(!!parsed.push)
      } catch {
        setNotifEmail(true)
        setNotifPush(false)
      }
    }
  }, [user])

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileErrors({})

    const errors = {}
    if (!profileName.trim()) errors.name = 'Name is required'
    if (!profileEmail.trim()) errors.email = 'Email is required'
    if (password && password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (password && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors)
      return
    }

    setProfileLoading(true)
    try {
      const data = {
        name: profileName,
        email: profileEmail,
      }
      if (password) {
        data.password = password
        data.confirm_password = confirmPassword
      }

      const res = await authAPI.updateProfile(data)
      setUser(res.data)
      setPassword('')
      setConfirmPassword('')
      toast.success('Profile updated successfully!')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to update profile'
      setProfileErrors({ global: detail })
      toast.error(detail)
    } finally {
      setProfileLoading(false)
    }
  }

  // API Key Save
  const handleSaveApiKey = async (e) => {
    e.preventDefault()
    setApiKeyError('')

    if (!apiKey.trim()) {
      setApiKeyError('API Key cannot be empty')
      return
    }

    setApiKeyLoading(true)
    try {
      const res = await authAPI.updateApiKeys({ gemini_api_key: apiKey })
      setUser(res.data)
      toast.success('Gemini API Key saved successfully!')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to save API Key'
      setApiKeyError(detail)
      toast.error(detail)
    } finally {
      setApiKeyLoading(false)
    }
  }

  // Notifications Save
  const handleSaveNotifications = async () => {
    setNotifLoading(true)
    try {
      const prefs = JSON.stringify({ email: notifEmail, push: notifPush })
      const res = await authAPI.updateNotifications({ notification_preferences: prefs })
      setUser(res.data)
      toast.success('Notification preferences updated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update notifications')
    } finally {
      setNotifLoading(false)
    }
  }

  // Delete Account
  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')

    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type "DELETE" to confirm')
      return
    }

    if (!confirm('Are you absolutely sure you want to permanently delete your account? This action cannot be undone.')) {
      return
    }

    setDeleteLoading(true)
    try {
      await authAPI.deleteAccount()
      toast.success('Your account has been deleted')
      logout()
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to delete account'
      setDeleteError(detail)
      toast.error(detail)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account settings, API integrations, and notification preferences.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* PROFILE SETTINGS */}
          <Card style={{ padding: 28 }} hover={false}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Profile Information</h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {profileErrors.global && (
                <div style={{ color: 'var(--accent-violet-light)', fontSize: 13, background: 'rgba(124,58,237,0.1)', padding: '10px 14px', borderRadius: 6 }}>
                  {profileErrors.global}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label="Full Name"
                  id="profileName"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  error={profileErrors.name}
                />
                <Input
                  label="Email Address"
                  id="profileEmail"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  error={profileErrors.email}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                <Input
                  label="New Password (optional)"
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={profileErrors.password}
                />
                <Input
                  label="Confirm New Password"
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={profileErrors.confirmPassword}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <Button type="submit" loading={profileLoading} id="save-profile-btn">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* API KEYS */}
          <Card style={{ padding: 28 }} hover={false}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>API Integrations</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Add your custom Gemini API key to enable high-volume AI generations with custom rate limits.
            </p>
            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Gemini API Key"
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                error={apiKeyError}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button type="submit" variant="cyan" loading={apiKeyLoading} id="save-apikey-btn">
                  Save API Key
                </Button>
              </div>
            </form>
          </Card>

          {/* NOTIFICATION PREFERENCES */}
          <Card style={{ padding: 28 }} hover={false}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.checked)}
                  style={{
                    width: 18, height: 18,
                    accentColor: 'var(--accent-violet)',
                    cursor: 'pointer',
                  }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Email Alerts</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receive email notifications when schedules posts go live or fail.</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                <input
                  type="checkbox"
                  checked={notifPush}
                  onChange={(e) => setNotifPush(e.target.checked)}
                  style={{
                    width: 18, height: 18,
                    accentColor: 'var(--accent-violet)',
                    cursor: 'pointer',
                  }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>In-app Push Notifications</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Get real-time agent updates and notifications in your browser.</div>
                </div>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <Button onClick={handleSaveNotifications} loading={notifLoading} id="save-notifications-btn">
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>

          {/* DANGER ZONE */}
          <Card style={{ padding: 28, border: '1px solid rgba(239, 68, 68, 0.3)' }} hover={false}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>Danger Zone</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Permanently delete your account and all associated brand configurations, generated content, and scheduled posts.
            </p>
            <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label='To confirm, type "DELETE" below'
                id="deleteConfirmText"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                error={deleteError}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
                <Button type="submit" variant="danger" loading={deleteLoading} id="delete-account-btn">
                  Delete Account
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}
