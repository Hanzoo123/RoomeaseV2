import { Fragment } from 'react'
import { Star, StarHalf } from 'lucide-react'

// Read-only star display, rounded to the nearest half star.
export function Stars({ value, size = 14, className = '' }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className={`stars ${className}`} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((position) => {
        if (rounded >= position) return <Star key={position} size={size} fill="currentColor" aria-hidden="true" />
        if (rounded >= position - 0.5) return <StarHalf key={position} size={size} fill="currentColor" aria-hidden="true" />
        return <Star key={position} size={size} className="opacity-25" aria-hidden="true" />
      })}
    </span>
  )
}

// Compact "★ 4.7 (12)" label for cards and lists.
export function RatingBadge({ rating, className = '' }) {
  if (!rating.count) return <span className={`text-xs text-body-secondary ${className}`}>No reviews yet</span>
  return (
    <span className={`d-inline-flex align-items-center gap-1 text-xs ${className}`}>
      <Star size={13} className="text-warning" fill="currentColor" aria-hidden="true" />
      <strong className="text-body">{rating.average.toFixed(1)}</strong>
      <span className="text-body-secondary">
        ({rating.count} {rating.count === 1 ? 'review' : 'reviews'})
      </span>
    </span>
  )
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

// Accessible 1–5 star picker built from radio buttons.
export function StarInput({ value, onChange, name = 'rating' }) {
  return (
    <div className="d-flex align-items-center gap-3">
      <fieldset className="star-input border-0 p-0 m-0">
        <legend className="visually-hidden">Your rating</legend>
        {[5, 4, 3, 2, 1].map((star) => (
          <Fragment key={star}>
            <input type="radio" id={`${name}-${star}`} name={name} value={star} checked={value === star} onChange={() => onChange(star)} />
            <label htmlFor={`${name}-${star}`} title={LABELS[star]}>
              <Star size={28} fill="currentColor" aria-hidden="true" />
              <span className="visually-hidden">
                {star} {star === 1 ? 'star' : 'stars'}
              </span>
            </label>
          </Fragment>
        ))}
      </fieldset>
      {value > 0 && <span className="small fw-medium text-body-secondary">{LABELS[value]}</span>}
    </div>
  )
}
