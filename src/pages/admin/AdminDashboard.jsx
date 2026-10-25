import { Link } from 'react-router-dom'
import { ArrowRight, Building2, CircleCheck, ClipboardCheck, Inbox, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { formatPeso, timeAgo } from '../../data/mockData'
import ActivityItem from '../../components/admin/ActivityItem'
import StreetArt from '../../components/illustrations/StreetArt'
import ListingStatus from '../../components/listings/ListingStatus'
import { EmptyState, ListingImage, SectionHeader, StatCard, WelcomeBanner } from '../../components/ui'

export default function AdminDashboard() {
  const { user, accounts } = useAuth()
  const { listings, reservations, activity, contactMessages, counts, ownerOf } = useData()

  // Oldest first: the landlord who has waited longest is reviewed first.
  const queue = listings.filter((listing) => listing.approval === 'Pending' && !listing.removed).sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''))
  const live = listings.filter((listing) => listing.approval === 'Approved' && !listing.removed)
  const boarders = accounts.filter((account) => account.role === 'boarder')
  const landlords = accounts.filter((account) => account.role === 'landlord')
  const unread = contactMessages.filter((message) => !message.read)
  const pendingRequests = reservations.filter((reservation) => reservation.status === 'Pending').length

  return (
    <div className="d-flex flex-column gap-4">
      <WelcomeBanner
        title={`Welcome back, ${user.firstName}!`}
        subtitle={queue.length ? `${queue.length} ${queue.length === 1 ? 'listing is' : 'listings are'} waiting for your review.` : 'Every listing has been reviewed. Nice work.'}
        art={<StreetArt variant={2} />}
      />

      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <StatCard icon={ClipboardCheck} value={counts.pendingListings} label="Listings in review" iconClassName="text-warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon={Building2} value={live.length} label="Live listings" iconClassName="text-success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon={Users} value={boarders.length + landlords.length} label={`${boarders.length} boarders · ${landlords.length} landlords`} iconClassName="text-primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon={Inbox} value={unread.length} label="Unread contact messages" iconClassName="text-info" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-7 d-flex flex-column gap-4">
          <section>
            <SectionHeader title="Waiting for review" actionTo="/admin/listings" actionLabel="Manage listings" />
            {queue.length ? (
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                {queue.map((listing) => (
                  <li key={listing.id} className="card">
                    <div className="card-body p-3 d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                      <div className="thumb-square flex-shrink-0" style={{ width: '4.5rem', height: '4.5rem' }}>
                        <ListingImage listing={listing} kind="house" />
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <p className="fw-semibold mb-0">{listing.name}</p>
                          <ListingStatus listing={listing} />
                        </div>
                        <p className="small text-body-secondary mb-0">
                          {ownerOf(listing).name} · {listing.area} · {formatPeso(listing.price)}/month
                        </p>
                        <p className="text-xs text-body-secondary mb-0">Submitted {listing.submittedAt ? timeAgo(listing.submittedAt) : 'recently'}</p>
                      </div>
                      <Link to={`/admin/listings/${listing.id}`} className="btn btn-primary flex-shrink-0">
                        Review
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CircleCheck} title="Nothing to review" body="New listings show up here as soon as a landlord submits them." />
            )}
          </section>

          <section className="card">
            <div className="card-body p-4">
              <SectionHeader title="Contact inbox" actionTo="/admin/inbox" actionLabel="Open inbox" />
              {unread.length ? (
                <ul className="list-unstyled mb-0">
                  {unread.slice(0, 3).map((message) => (
                    <li key={message.id} className="border-top py-3">
                      <div className="d-flex justify-content-between gap-3">
                        <p className="small fw-semibold mb-0">
                          {message.name} <span className="fw-normal text-body-secondary">· {message.topic}</span>
                        </p>
                        <span className="text-2xs text-body-secondary text-nowrap">{timeAgo(message.date)}</span>
                      </div>
                      <p className="small text-body-secondary text-truncate mb-0">{message.message}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small text-body-secondary mb-0">No unread messages.</p>
              )}
            </div>
          </section>
        </div>

        <div className="col-xl-5 d-flex flex-column gap-4">
          <section className="card">
            <div className="card-body p-4">
              <SectionHeader title="Recent activity" actionTo="/admin/activity" actionLabel="Full log" />
              <ul className="list-unstyled mb-0 activity-list">
                {activity.slice(0, 6).map((entry) => (
                  <ActivityItem key={entry.id} entry={entry} />
                ))}
              </ul>
            </div>
          </section>

          <section className="cta-accent rounded-4 text-white p-4 d-flex gap-3">
            <ShieldCheck size={28} className="flex-shrink-0" aria-hidden="true" />
            <div>
              <h2 className="h6 fw-semibold mb-1">Across the site</h2>
              <p className="small text-white text-opacity-75 mb-0">
                {pendingRequests} reservation {pendingRequests === 1 ? 'request is' : 'requests are'} waiting on landlords, and {live.reduce((sum, listing) => sum + listing.availableRooms, 0)} rooms are
                open in live listings.
              </p>
              <Link to="/admin/reports" className="btn btn-sm btn-light text-primary mt-3">
                View reports
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
