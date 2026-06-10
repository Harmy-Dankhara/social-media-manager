import { motion } from 'framer-motion'

export function Spinner({ size = 'base', className = '' }) {
  const cls = `spinner${size === 'sm' ? ' spinner-sm' : size === 'lg' ? ' spinner-lg' : ''} ${className}`
  return <div className={cls} />
}

export function Button({
  children,
  variant = 'primary',
  size = 'base',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  id,
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    cyan: 'btn-cyan',
    danger: 'btn-danger',
  }[variant] || 'btn-primary'

  const sizeClass = { sm: 'btn-sm', lg: 'btn-lg', xl: 'btn-xl' }[size] || ''

  return (
    <motion.button
      id={id}
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </motion.button>
  )
}

export function Card({ children, className = '', hover = true, onClick, style }) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      style={style}
      onClick={onClick}
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export function Badge({ children, variant = 'violet' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function Input({
  label,
  error,
  id,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label className="input-label" htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        className={`input-field ${error ? 'error' : ''} ${className}`}
        {...props}
      />
      {error && error.trim() && <span className="input-error">{error}</span>}
    </div>
  )
}

export function Textarea({ label, error, id, className = '', rows = 4, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label className="input-label" htmlFor={id}>{label}</label>}
      <textarea
        id={id}
        rows={rows}
        className={`input-field ${error ? 'error' : ''} ${className}`}
        style={{ resize: 'vertical', minHeight: 100 }}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 520 }) {
  if (!isOpen) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-card"
        style={{ width: '100%', maxWidth, padding: 28, position: 'relative' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

export function Select({ label, error, id, options = [], value, onChange, className = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label className="input-label" htmlFor={id}>{label}</label>}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`input-field ${error ? 'error' : ''} ${className}`}
        style={{ cursor: 'pointer' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-navy)' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
      {action}
    </div>
  )
}
