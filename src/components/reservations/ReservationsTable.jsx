import { formatDate } from '../../data/mockData'
import { StatusPill } from '../ui'

export default function ReservationsTable({ reservations, listingName, onView }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-line bg-page/70 text-xs font-semibold">
            <tr>
              {['Date', 'Boarder', 'Property', 'Room Type', 'Status', 'Action'].map((heading) => (
                <th key={heading} scope="col" className="px-5 py-3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="hover:bg-page/50">
                <td className="px-5 py-3.5 whitespace-nowrap text-muted">{formatDate(reservation.date)}</td>
                <td className="px-5 py-3.5 font-medium whitespace-nowrap">{reservation.boarder}</td>
                <td className="px-5 py-3.5 whitespace-nowrap text-muted">{listingName(reservation.listingId)}</td>
                <td className="px-5 py-3.5 whitespace-nowrap text-muted">{reservation.roomType}</td>
                <td className="px-5 py-3.5">
                  <StatusPill status={reservation.status} />
                </td>
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => onView(reservation.id)}
                    aria-label={`View request from ${reservation.boarder}`}
                    className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
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
