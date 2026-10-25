import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle({ className = 'icon-btn' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button type="button" onClick={toggleTheme} className={className} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Light mode' : 'Dark mode'}>
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

// Bootstrap placeholder skeleton shown while a page's code is loading.
export function PageSkeleton() {
  return (
    <div className="placeholder-glow" aria-busy="true" aria-label="Loading">
      <span className="placeholder col-4 col-md-3 rounded-2 mb-2" style={{ height: '1.75rem' }} />
      <span className="placeholder col-7 col-md-5 rounded-2 d-block mb-4" />
      <div className="row g-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="col-md-4">
            <div className="card">
              <span className="placeholder w-100 rounded-top-4" style={{ height: '9rem' }} />
              <div className="card-body">
                <span className="placeholder col-8 rounded-2 mb-2" />
                <span className="placeholder col-5 rounded-2 d-block mb-3" />
                <span className="placeholder col-12 rounded-2 d-block" style={{ height: '2.25rem' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-page">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  )
}
