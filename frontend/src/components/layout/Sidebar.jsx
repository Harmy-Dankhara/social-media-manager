import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/brand-setup', icon: '✦', label: 'Brand Setup' },
  { to: '/content-studio', icon: '✦', label: 'Content Studio' },
  { to: '/scheduler', icon: '◷', label: 'Scheduler' },
  { to: '/analytics', icon: '◈', label: 'Analytics' },
  { to: '/competitors', icon: '◈', label: 'Competitor Analysis' },
  { to: '/settings', icon: '◎', label: 'Settings' },
]

const PLATFORM_ICONS = {
  Dashboard: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity=".9" /><rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity=".6" /><rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity=".6" /><rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity=".3" /></svg>
  ),
  'Brand Setup': (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
  ),
  'Content Studio': (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 20h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
  ),
  Scheduler: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="8" cy="15" r="1.5" fill="currentColor" /><circle cx="12" cy="15" r="1.5" fill="currentColor" /></svg>
  ),
  Analytics: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M3 20h18M5 20V12m4 8V8m4 12V4m4 16v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  ),
  'Competitor Analysis': (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  Settings: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" /></svg>
  ),
}

export default function Sidebar({ isOpen, onClose }) {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!dropdownOpen) return

    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [dropdownOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`app-sidebar ${isOpen ? 'open' : ''}`}
      style={{
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        padding: '0 0 16px',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          whileHover={{ scale: 1.02 }}
        >
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
            boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
          }}>✦</div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>
              SocialMind
            </div>
            <div style={{ fontSize: 10, color: 'var(--accent-violet-light)', letterSpacing: '1px', textTransform: 'uppercase' }}>AI</div>
          </div>
        </motion.div>

        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink key={to} to={to} id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`} onClick={onClose}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 3 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--accent-violet-dim)' : 'transparent',
                  color: isActive ? 'var(--accent-violet-light)' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  border: isActive ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {PLATFORM_ICONS[label]}
                </span>
                <span>{label}</span>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto', width: 5, height: 5,
                    background: 'var(--accent-violet-light)',
                    borderRadius: '50%',
                    boxShadow: '0 0 6px var(--accent-violet)',
                  }} />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-subtle)', position: 'relative' }}>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="profile-dropdown-menu"
            >
              <button
                className="profile-dropdown-item"
                onClick={() => {
                  setDropdownOpen(false)
                  onClose?.()
                  navigate('/settings')
                }}
              >
                <span>◎</span> Settings & Profile
              </button>
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 6px' }} />
              <button
                className="profile-dropdown-item logout-item"
                onClick={() => {
                  setDropdownOpen(false)
                  onClose?.()
                  handleLogout()
                }}
                style={{ color: '#f87171' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ marginRight: 2 }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>Logout</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Footer Card */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: dropdownOpen ? 'var(--accent-violet-dim)' : 'var(--bg-card)',
            border: dropdownOpen ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          className="profile-card-footer"
        >
          <div style={{
            width: 32, height: 32,
            background: 'var(--gradient-brand)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10, padding: 4, transition: 'all 0.2s' }}>
            {dropdownOpen ? '▼' : '▲'}
          </div>
        </div>
      </div>
    </aside>
  )
}
