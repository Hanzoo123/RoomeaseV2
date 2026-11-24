import { CloudOff } from 'lucide-react'
import { EmptyState } from '../ui'

// Placeholder cards while the listings load from the API.
export function ListingsLoading({ count = 3, className = 'col-sm-6 col-xl-4' }) {
  return (
    <div className="row g-4 placeholder-glow" aria-busy="true" aria-label="Loading boarding houses">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={className}>
          <div className="card h-100 overflow-hidden">
            <span className="placeholder w-100" style={{ aspectRatio: '16 / 10' }} />
            <div className="card-body">
              <span className="placeholder col-8 rounded" />
              <span className="placeholder col-5 rounded mt-2 d-block" />
              <span className="placeholder col-4 rounded mt-3 d-block" style={{ height: '1.5rem' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// When the listings couldn't be loaded (e.g. WAMP isn't running).
export function ListingsError({ error, onRetry }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="Boarding houses couldn’t be loaded"
      body={error}
      action={
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      }
    />
  )
}
