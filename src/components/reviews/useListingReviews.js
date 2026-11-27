import { useEffect, useState } from 'react'
import { postReply, postReview, fetchReviews, removeReview } from '../../api/reviews'
import { USE_API } from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'

const EMPTY = { key: null, error: '', reviews: [], rating: { average: 0, count: 0 }, canReview: false }

// One listing's reviews and what the signed-in person may do with them. With the API they
// load from /listings/{id}/reviews (again when someone else signs in); the demo reads its own.
// Returns { loading, error, reviews, rating, canReview, save, remove, reply }; each review
// has `mine`, and the actions resolve to { ok } or { ok: false, error, fields }.
export default function useListingReviews(listing) {
  const { user } = useAuth()
  const data = useData()
  const dbId = USE_API ? listing.dbId : null
  const key = dbId ? `${dbId}:${user?.id ?? 'guest'}` : null
  const [state, setState] = useState(EMPTY)

  useEffect(() => {
    if (!key) return undefined
    let current = true
    fetchReviews({ id: listing.id, dbId }).then((result) => {
      if (!current) return
      setState(result.ok ? { key, error: '', reviews: result.reviews, rating: result.rating, canReview: result.canReview } : { ...EMPTY, key, error: result.error })
    })
    return () => {
      current = false
    }
  }, [key, dbId, listing.id])

  if (!USE_API) {
    return {
      loading: false,
      error: '',
      reviews: data.reviewsFor(listing.id).map((review) => ({ ...review, mine: Boolean(user) && review.userId === user.id })),
      rating: data.ratingOf(listing.id),
      canReview: data.canReview(listing.id),
      save: async (fields) => (data.saveReview(listing, fields), { ok: true }),
      remove: async (review) => (data.deleteReview(review.id), { ok: true }),
      reply: async (review, text) => (data.replyToReview(review.id, text), { ok: true }),
    }
  }

  // After a change, the new list comes back; the listing's rating on cards reloads too.
  const apply = (result) => {
    if (result.ok) {
      setState({ key, error: '', reviews: result.reviews, rating: result.rating, canReview: result.canReview })
      data.reloadListings()
    }
    return result
  }
  return {
    ...state,
    loading: state.key !== key,
    save: async (fields) => apply(await postReview(listing, fields)),
    remove: async (review) => apply(await removeReview(listing, review)),
    reply: async (review, text) => apply(await postReply(listing, review, text)),
  }
}
