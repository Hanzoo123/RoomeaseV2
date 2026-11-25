import { formatPeso } from '../../data/mockData'
import { freeSlotsOf } from '../../data/rooms'

// A listing's rooms: type, rent and free beds of each.
export default function RoomsTable({ rooms, showOccupancy = false }) {
  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle small mb-0">
        <thead>
          <tr>
            <th scope="col">Room</th>
            <th scope="col">Type</th>
            <th scope="col" className="text-end">
              Monthly rent
            </th>
            {showOccupancy && (
              <th scope="col" className="text-end">
                Occupied
              </th>
            )}
            <th scope="col" className="text-end">
              Free slots
            </th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => {
            const free = room.freeSlots ?? freeSlotsOf(room)
            return (
              <tr key={room.id}>
                <td className="fw-medium">{room.name}</td>
                <td>{room.type}</td>
                <td className="text-end text-nowrap">{formatPeso(room.rent)}</td>
                {showOccupancy && (
                  <td className="text-end text-nowrap">
                    {room.slotsTaken} of {room.capacity}
                  </td>
                )}
                <td className="text-end">
                  {free > 0 ? (
                    <span className="badge bg-success-subtle text-success-emphasis">
                      {free} of {room.capacity}
                    </span>
                  ) : (
                    <span className="badge bg-secondary-subtle text-secondary-emphasis">{room.isOpen ? 'Full' : 'Closed'}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
