import Sidebar from './Sidebar'

export default function PageWrapper({ children, title, subtitle }) {
  return (
    <div className="app-layout">
      <Sidebar />
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
