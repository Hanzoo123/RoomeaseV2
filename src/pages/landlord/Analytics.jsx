import { Link } from 'react-router-dom'
import { ChartColumn, DoorOpen, Eye, Star, ThumbsUp } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { landlordAnalytics } from '../../components/charts/analytics'
import { ListingBarChart, RequestsByMonthChart, StatusBreakdownChart } from '../../components/charts/Charts'
import { Stars } from '../../components/reviews/Stars'
import { EmptyState, PageHeader } from '../../components/ui'

function Kpi({ icon: Icon, label, value, detail, children }) {
  return (
    <div className="card h-100">
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-2 text-body-secondary small mb-2">
          <Icon size={16} className="text-primary" aria-hidden="true" />
          {label}
        </div>
        <p className="fs-2 fw-bold tracking-tight lh-1 mb-1">{value}</p>
        {detail && <p className="text-xs text-body-secondary mb-0">{detail}</p>}
        {children}
      </div>
    </div>
  )
}

export default function Analytics() {
  const { myListings, incomingReservations, reviews } = useData()

  if (myListings.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="How your boarding houses are doing." />
        <EmptyState
          icon={ChartColumn}
          title="No data yet"
          body="Add a listing to start seeing views, requests and occupancy."
          action={
            <Link to="/landlord/add-listing" className="btn btn-primary">
              Add New Listing
            </Link>
          }
        />
      </div>
    )
  }

  const { months, perMonth, statusTotals, perListing, kpis } = landlordAnalytics({ listings: myListings, reservations: incomingReservations, reviews })

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader title="Analytics" subtitle="How your boarding houses are doing. Updated as boarders view, request and review your listings." />

      <div className="row g-3 stagger">
        <div className="col-6 col-xl-3">
          <Kpi icon={DoorOpen} label="Occupancy" value={`${kpis.occupancy}%`} detail={`${kpis.occupiedRooms} of ${kpis.totalRooms} rooms filled`}>
            <div className="progress mt-2" role="progressbar" aria-label="Occupancy" aria-valuenow={kpis.occupancy} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-bar" style={{ width: `${kpis.occupancy}%` }} />
            </div>
          </Kpi>
        </div>
        <div className="col-6 col-xl-3">
          <Kpi icon={ThumbsUp} label="Approval rate" value={`${kpis.approvalRate}%`} detail={`${statusTotals.Approved} approved · ${statusTotals.Declined} declined`} />
        </div>
        <div className="col-6 col-xl-3">
          <Kpi icon={Star} label="Average rating" value={kpis.reviewCount ? kpis.averageRating.toFixed(1) : '–'} detail={`${kpis.reviewCount} reviews`}>
            {kpis.reviewCount > 0 && <Stars value={kpis.averageRating} className="mt-1" />}
          </Kpi>
        </div>
        <div className="col-6 col-xl-3">
          <Kpi icon={Eye} label="Listing views" value={kpis.totalViews.toLocaleString('en-PH')} detail={`${kpis.totalRequests} reservation requests`} />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <RequestsByMonthChart months={months} perMonth={perMonth} />
        </div>
        <div className="col-lg-4">
          <StatusBreakdownChart totals={statusTotals} />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <ListingBarChart
            title="Occupancy by property"
            subtitle="Share of rooms currently filled"
            valueLabel="Occupancy"
            max={100}
            format={(value) => `${value}%`}
            rows={perListing.map((item) => ({ label: item.listing.name, value: item.occupancy }))}
          />
        </div>
        <div className="col-lg-6">
          <ListingBarChart
            title="Views by property"
            subtitle="Times boarders opened each listing"
            valueLabel="Views"
            rows={perListing.map((item) => ({ label: item.listing.name, value: item.views }))}
          />
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="card-body p-4 pb-2">
          <h2 className="fs-6 fw-semibold mb-0">Listing performance</h2>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0 table-min small">
            <thead>
              <tr>
                <th scope="col" className="px-4">Property</th>
                <th scope="col" className="text-end">Views</th>
                <th scope="col" className="text-end">Requests</th>
                <th scope="col" className="text-end">Approval rate</th>
                <th scope="col">Rating</th>
                <th scope="col" className="px-4" style={{ width: '22%' }}>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {perListing.map((item) => (
                <tr key={item.listing.id}>
                  <th scope="row" className="px-4 fw-medium">
                    <Link to={`/landlord/listings/${item.listing.id}`} className="text-reset-link">
                      {item.listing.name}
                    </Link>
                  </th>
                  <td className="text-end">{item.views.toLocaleString('en-PH')}</td>
                  <td className="text-end">{item.requests}</td>
                  <td className="text-end">{item.approvalRate === null ? '–' : `${item.approvalRate}%`}</td>
                  <td>
                    {item.rating === null ? (
                      <span className="text-body-secondary">No reviews</span>
                    ) : (
                      <span className="d-inline-flex align-items-center gap-1">
                        <Star size={13} className="text-warning" fill="currentColor" aria-hidden="true" />
                        {item.rating.toFixed(1)} <span className="text-body-secondary">({item.reviewCount})</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" role="progressbar" aria-label={`${item.listing.name} occupancy`} aria-valuenow={item.occupancy} aria-valuemin={0} aria-valuemax={100}>
                        <div className="progress-bar" style={{ width: `${item.occupancy}%` }} />
                      </div>
                      <span className="text-nowrap" style={{ width: '2.75rem' }}>
                        {item.occupancy}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
