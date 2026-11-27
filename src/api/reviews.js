import { api } from './client'
import { appListingId } from './ids'

// Reviews and landlord replies (GET/POST /listings/{id}/reviews, /reviews/…).

function toAppReview(review, listingId) {
  return {
    id: review.id,
    listingId,
    name: review.name,
    rating: review.rating,
    comment: review.comment,
    date: review.date,
    reply: review.reply,
    mine: Boolean(review.mine),
  }
}

// { reviews, rating: { average, count }, canReview } for one listing.
const reviewsOf = (listing) => (response) =>
  response.ok
    ? { ok: true, reviews: response.data.reviews.map((review) => toAppReview(review, listing.id)), rating: response.data.rating, canReview: response.data.canReview }
    : response

export const fetchReviews = async (listing) => reviewsOf(listing)(await api(`/listings/${listing.dbId}/reviews`))
// One review per boarder per listing: saving again edits it.
export const postReview = async (listing, fields) => reviewsOf(listing)(await api(`/listings/${listing.dbId}/reviews`, { method: 'POST', body: fields }))
export const removeReview = async (listing, review) => reviewsOf(listing)(await api(`/reviews/${review.id}`, { method: 'DELETE' }))
// An empty text removes the reply.
export const postReply = async (listing, review, text) => reviewsOf(listing)(await api(`/landlord/reviews/${review.id}/reply`, { method: 'POST', body: { text } }))

// For the home page: the count and average across live listings, and a few five-star reviews.
export async function fetchReviewHighlights() {
  const response = await api('/reviews/highlights')
  if (!response.ok) return response
  const { count, average, reviews } = response.data
  return { ok: true, count, average, reviews: reviews.map((review) => toAppReview(review, appListingId(review.listing))) }
}
