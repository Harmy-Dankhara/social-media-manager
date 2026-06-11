import { useState } from 'react'
import Sidebar from './Sidebar'

export default function PageWrapper({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Sidebar with mobile toggle classes and callbacks */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Sticky Header Bar */}
      <div className="mobile-top-nav">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar menu">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, flexShrink: 0,
            boxShadow: '0 4px 10px rgba(124,58,237,0.3)',
          }}>✦</div>
          <span className="mobile-logo-text">SocialMind AI</span>
        </div>
      </div>

      {/* Backdrop overlay for closing the sidebar on mobile clicks */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="page-content">
        {(title || subtitle) && (
          <header className="page-header">
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </header>
        )}
        {children}
      </main>
    </div>
  )
}

