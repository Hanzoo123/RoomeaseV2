import { useState } from 'react'
import { LoaderCircle, MessageSquareReply, Pencil, Star, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { timeAgo } from '../../data/mockData'
import { TextArea } from '../ui/form'
import { Notice } from '../ui'
import { StarInput, Stars } from './Stars'
import useListingReviews from './useListingReviews'

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
}

function Summary({ reviews, rating }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((item) => item.rating === star).length }))
  return (
    <div className="row g-4 align-items-center">
      <div className="col-sm-4 text-center text-sm-start">
        <p className="display-5 fw-bold mb-0 lh-1">{rating.count ? rating.average.toFixed(1) : '–'}</p>
        <Stars value={rating.average} size={18} className="my-2" />
        <p className="small text-body-secondary mb-0">
          {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
        </p>
      </div>
      <div className="col-sm-8">
        {counts.map(({ star, count }) => (
          <div key={star} className="d-flex align-items-center gap-2 small mb-1">
            <span className="text-body-secondary" style={{ width: '1.75rem' }}>
              {star}★
            </span>
            <div
              className="progress rating-bar flex-grow-1"
              role="progressbar"
              aria-label={`${star} star reviews`}
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={rating.count}
            >
              <div className="progress-bar" style={{ width: `${rating.count ? (count / rating.count) * 100 : 0}%` }} />
            </div>
            <span className="text-body-secondary text-end" style={{ width: '1.5rem' }}>
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewForm({ listing, existing, onSave, onDone }) {
  const toast = useToast()
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!rating) return setError('Choose a star rating.')
    if (comment.trim().length < 10) return setError('Write at least a short sentence (10 characters or more).')
    setBusy(true)
    const result = await onSave({ rating, comment: comment.trim() })
    setBusy(false)
    if (!result.ok) return setError(result.error)
    setError('')
    toast(existing ? 'Your review was updated.' : 'Thanks! Your review is now posted.')
    onDone?.()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="border rounded-4 p-3 p-sm-4 d-flex flex-column gap-3">
      <p className="fw-semibold mb-0">{existing ? 'Edit your review' : 'Rate your stay'}</p>
      <StarInput value={rating} onChange={setRating} name={`rating-${listing.id}`} />
      <TextArea
        id={`review-${listing.id}`}
        label="Your review"
        placeholder="What was it like living here? Mention cleanliness, safety, the landlord and the neighborhood."
        maxLength={600}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="d-flex gap-2 justify-content-end">
        {onDone && existing && (
          <button type="button" className="btn btn-outline-secondary" onClick={onDone}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Star size={16} aria-hidden="true" />}
          {existing ? 'Save review' : 'Post review'}
        </button>
      </div>
    </form>
  )
}

function ReplyForm({ review, onReply, onDone }) {
  const toast = useToast()
  const [text, setText] = useState(review.reply?.text ?? '')
  const [busy, setBusy] = useState(false)

  return (
    <form
      className="mt-2 d-flex flex-column gap-2"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        const result = await onReply(review, text.trim())
        setBusy(false)
        if (!result.ok) return toast(result.error, 'error')
        toast(text.trim() ? 'Reply posted.' : 'Reply removed.')
        onDone()
      }}
    >
      <label htmlFor={`reply-${review.id}`} className="visually-hidden">
        Reply to {review.name}
      </label>
      <textarea
        id={`reply-${review.id}`}
        className="form-control"
        rows={2}
        maxLength={400}
        placeholder="Thank the boarder or respond to their feedback"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="d-flex gap-2 justify-content-end">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-sm btn-primary" disabled={busy}>
          {busy && <LoaderCircle size={14} className="spin" aria-hidden="true" />}
          Save reply
        </button>
      </div>
    </form>
  )
}

function ReviewItem({ review, landlordMode, ownerName, onEdit, onDelete, onReply }) {
  const toast = useToast()
  const [replying, setReplying] = useState(false)
  const isMine = review.mine

  return (
    <li className="py-3 border-top">
      <div className="d-flex gap-3">
        <span className="avatar avatar-soft">{initials(review.name)}</span>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex flex-wrap align-items-center column-gap-2">
            <span className="fw-semibold small">{review.name}</span>
            {isMine && <span className="badge bg-primary-subtle text-primary-emphasis">You</span>}
            <span className="text-xs text-body-secondary">· {timeAgo(review.date)}</span>
          </div>
          <Stars value={review.rating} size={13} className="mt-1" />
          <p className="small mt-2 mb-0" style={{ lineHeight: 1.65 }}>
            {review.comment}
          </p>

          {review.reply && !replying && (
            <div className="review-reply rounded-3 px-3 py-2 mt-2 small">
              <span className="fw-semibold">{ownerName}</span> <span className="text-xs text-body-secondary">· Landlord reply</span>
              <p className="mb-0 mt-1">{review.reply.text}</p>
            </div>
          )}
          {replying && <ReplyForm review={review} onReply={onReply} onDone={() => setReplying(false)} />}

          <div className="d-flex gap-3 mt-2">
            {landlordMode && !replying && (
              <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setReplying(true)}>
                <MessageSquareReply size={14} aria-hidden="true" />
                {review.reply ? 'Edit reply' : 'Reply'}
              </button>
            )}
            {isMine && (
              <>
                <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={onEdit}>
                  <Pencil size={14} aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 link-danger text-decoration-none"
                  onClick={async () => {
                    const result = await onDelete(review)
                    toast(result.ok ? 'Your review was deleted.' : result.error, result.ok ? 'info' : 'error')
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

// Rating summary, review list and (for eligible boarders) the review form.
export default function ReviewsSection({ listing, landlordMode = false }) {
  const { ownerOf } = useData()
  const { loading, error, reviews, rating, canReview, save, remove, reply } = useListingReviews(listing)
  const [editing, setEditing] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const mine = reviews.find((item) => item.mine)
  const eligible = !landlordMode && canReview
  const visible = showAll ? reviews : reviews.slice(0, 4)
  const ownerName = ownerOf(listing).name

  return (
    <section className="card" id="reviews">
      <div className="card-body p-4">
        <h2 className="h5 fw-semibold mb-4">Ratings & reviews</h2>
        {loading ? (
          <div className="placeholder-glow" aria-busy="true" aria-label="Loading reviews">
            <span className="placeholder col-12 rounded-3" style={{ height: '7rem' }} />
          </div>
        ) : error ? (
          <p className="small text-body-secondary mb-0">{error}</p>
        ) : (
          <>
            <Summary reviews={reviews} rating={rating} />

            {!landlordMode && (
              <div className="mt-4">
                {eligible && (!mine || editing) && <ReviewForm key={mine?.id ?? 'new'} listing={listing} existing={mine} onSave={save} onDone={mine ? () => setEditing(false) : undefined} />}
                {!eligible && <p className="small text-body-secondary bg-page rounded-3 px-3 py-2 mb-0">Only boarders who have stayed here (an approved reservation) can leave a review.</p>}
              </div>
            )}

            {reviews.length > 0 ? (
              <ul className="list-unstyled mt-4 mb-0">
                {visible.map((review) => (
                  <ReviewItem key={review.id} review={review} landlordMode={landlordMode} ownerName={ownerName} onEdit={() => setEditing(true)} onDelete={remove} onReply={reply} />
                ))}
              </ul>
            ) : (
              <p className="small text-body-secondary mt-4 mb-0">No reviews yet.</p>
            )}

            {reviews.length > 4 && (
              <button type="button" className="btn btn-outline-secondary w-100 mt-2" onClick={() => setShowAll((value) => !value)}>
                {showAll ? 'Show fewer reviews' : `Show all ${reviews.length} reviews`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
