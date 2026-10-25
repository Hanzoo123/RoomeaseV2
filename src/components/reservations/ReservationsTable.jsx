import { formatDate } from '../../data/mockData'
import { StatusPill } from '../ui'

export default function ReservationsTable({ reservations, listingName, onView }) {
  return (
    <div className="card overflow-hidden">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 table-min">
          <thead>
            <tr className="text-xs">
              {['Date', 'Boarder', 'Property', 'Room Type', 'Status', 'Action'].map((heading) => (
                <th key={heading} scope="col" className="px-4 py-3 fw-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id}>
                <td className="px-4 py-3 text-nowrap text-body-secondary">{formatDate(reservation.date)}</td>
                <td className="px-4 py-3 text-nowrap fw-medium">{reservation.boarder}</td>
                <td className="px-4 py-3 text-nowrap text-body-secondary">{listingName(reservation.listingId)}</td>
                <td className="px-4 py-3 text-nowrap text-body-secondary">{reservation.roomType}</td>
                <td className="px-4 py-3">
                  <StatusPill status={reservation.status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onView(reservation.id)}
                    aria-label={`View request from ${reservation.boarder}`}
                    className="btn btn-sm btn-primary px-3"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
