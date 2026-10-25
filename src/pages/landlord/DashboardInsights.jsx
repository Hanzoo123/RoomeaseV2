import { useData } from '../../context/DataContext'
import { landlordAnalytics } from '../../components/charts/analytics'
import { RequestsByMonthChart, StatusBreakdownChart } from '../../components/charts/Charts'
import { SectionHeader } from '../../components/ui'

// Loaded lazily from the landlord dashboard so Chart.js isn't in the main bundle.
export default function DashboardInsights() {
  const { myListings, incomingReservations, reviews } = useData()
  const { months, perMonth, statusTotals } = landlordAnalytics({ listings: myListings, reservations: incomingReservations, reviews })

  return (
    <section>
      <SectionHeader title="Insights" actionTo="/landlord/analytics" actionLabel="View analytics" />
      <div className="row g-3">
        <div className="col-lg-8">
          <RequestsByMonthChart months={months} perMonth={perMonth} />
        </div>
        <div className="col-lg-4">
          <StatusBreakdownChart totals={statusTotals} />
        </div>
      </div>
    </section>
  )
}
