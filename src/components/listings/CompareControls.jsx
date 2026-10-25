import { Link, useLocation } from 'react-router-dom'
import { Check, Scale, X } from 'lucide-react'
import { MAX_COMPARE, useData } from '../../context/DataContext'
import { useSitePaths } from '../../context/SitePaths'
import { useToast } from '../../context/ToastContext'
import { ListingImage } from '../ui'

export function CompareButton({ listing, className = '' }) {
  const { compare, toggleCompare } = useData()
  const toast = useToast()
  const selected = compare.includes(listing.id)
  const full = !selected && compare.length >= MAX_COMPARE

  function handleClick() {
    if (full) {
      toast(`You can compare up to ${MAX_COMPARE} rooms. Remove one first.`, 'info')
      return
    }
    toggleCompare(listing.id)
    toast(selected ? `${listing.name} removed from compare.` : `Added to compare (${compare.length + 1} of ${MAX_COMPARE}).`, selected ? 'info' : 'success')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      aria-label={selected ? `Remove ${listing.name} from compare` : `Add ${listing.name} to compare`}
      title={full ? `You can compare up to ${MAX_COMPARE} rooms` : selected ? 'Remove from compare' : 'Add to compare'}
      className={`btn ${selected ? 'btn-primary' : 'btn-outline-secondary'} ${className}`}
    >
      {selected ? <Check size={16} aria-hidden="true" /> : <Scale size={16} aria-hidden="true" />}
    </button>
  )
}

// Pages where boarders pick rooms; elsewhere (messages, forms) the tray would cover content.
const COMPARE_BAR_PAGES = [/^\/boarder$/, /^\/boarder\/browse$/, /^\/boarder\/rooms\//, /^\/boarder\/favorites$/, /^\/rooms$/, /^\/rooms\/(?!compare$)/]

export function useCompareBarVisible() {
  const { compare } = useData()
  const { pathname } = useLocation()
  return compare.length > 0 && COMPARE_BAR_PAGES.some((pattern) => pattern.test(pathname))
}

// Floating tray on room pages showing the rooms picked for comparison.
export function CompareBar() {
  const { compare, listingById, toggleCompare, clearCompare } = useData()
  const paths = useSitePaths()
  const visible = useCompareBarVisible()
  if (!visible) return null

  return (
    <div className={`compare-bar card shadow-lg ${paths.isPublic ? 'compare-bar-centered' : ''}`} role="region" aria-label="Rooms to compare">
      <div className="card-body py-2 px-3 d-flex align-items-center gap-3">
        <div className="d-flex gap-2">
          {compare.map((id) => {
            const listing = listingById(id)
            if (!listing) return null
            return (
              <div key={id} className="position-relative">
                <div className="thumb-square" style={{ width: '3rem', height: '3rem' }} title={listing.name}>
                  <ListingImage listing={listing} kind="room" />
                </div>
                <button type="button" className="compare-remove" onClick={() => toggleCompare(id)} aria-label={`Remove ${listing.name} from compare`}>
                  <X size={10} />
                </button>
              </div>
            )
          })}
        </div>
        <p className="small mb-0 d-none d-sm-block">
          <strong>{compare.length}</strong> of {MAX_COMPARE} selected
        </p>
        <div className="ms-auto d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearCompare}>
            Clear
          </button>
          <Link to={paths.compare} className={`btn btn-sm btn-primary ${compare.length < 2 ? 'disabled' : ''}`} aria-disabled={compare.length < 2}>
            <Scale size={14} aria-hidden="true" />
            Compare
          </Link>
        </div>
      </div>
    </div>
  )
}
