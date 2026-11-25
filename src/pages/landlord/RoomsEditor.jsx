import { Plus, Trash2 } from 'lucide-react'
import { formatPeso, ROOM_TYPES } from '../../data/mockData'
import { formRoom, freeSlotsOf, MAX_ROOMS, roomValues, summarizeRooms, TYPE_BEDS } from '../../data/rooms'
import { SelectField, TextField } from '../../components/ui/form'

function nextName(rooms) {
  const taken = new Set(rooms.map((room) => room.name.trim().toLowerCase()))
  let number = rooms.length + 1
  while (taken.has(`room ${number}`)) number += 1
  return `Room ${number}`
}

// Each room's name, type, rent and beds. Used by the listing form in both modes.
export default function RoomsEditor({ rooms, errors, onChange }) {
  const valid = rooms.filter((room) => Number(room.rent) > 0 && Number(room.capacity) > 0).map(roomValues)
  const summary = summarizeRooms(valid)

  const change = (key, field, value) =>
    onChange(
      rooms.map((room) => {
        if (room.key !== key) return room
        // A new type brings its usual beds, unless the landlord already changed them.
        if (field === 'type' && Number(room.capacity) === (TYPE_BEDS[room.type] ?? 1)) return { ...room, type: value, capacity: String(TYPE_BEDS[value] ?? 1) }
        return { ...room, [field]: value }
      }),
      field,
    )
  const digits = (key, field, length) => (event) => change(key, field, event.target.value.replace(/\D/g, '').slice(0, length))
  const add = () => {
    const last = rooms.at(-1)
    onChange([...rooms, formRoom({ name: nextName(rooms), type: last?.type, rent: Number(last?.rent) || undefined, capacity: last ? Number(last.capacity) || undefined : undefined })], 'rooms')
  }
  const remove = (key) => onChange(rooms.filter((room) => room.key !== key), 'rooms')

  return (
    <div className="d-flex flex-column gap-3">
      <p className="small text-body-secondary mb-0">
        Add each room with its own type, rent and beds. Boarders see your lowest rent first, and the free beds of each room.
        {valid.length > 0 && (
          <span className="d-block fw-medium text-body mt-1">
            {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} · {summary.price === summary.priceMax ? formatPeso(summary.price) : `${formatPeso(summary.price)}–${formatPeso(summary.priceMax)}`} a month · {summary.availableSlots}{' '}
            free {summary.availableSlots === 1 ? 'bed' : 'beds'}
          </span>
        )}
      </p>
      <ol className="list-unstyled d-flex flex-column gap-3 mb-0">
        {rooms.map((room, index) => {
          const error = (field) => errors[`rooms.${index}.${field}`]
          const id = (field) => `${room.key}-${field}`
          const free = Number(room.capacity) > 0 ? freeSlotsOf({ isOpen: room.isOpen, capacity: Number(room.capacity), slotsTaken: Number(room.slotsTaken || 0) }) : 0
          const locked = room.activeRequests > 0
          return (
            <li key={room.key} className="border rounded-3 p-3">
              <div className="row g-3">
                <div className="col-sm-6">
                  <TextField id={id('name')} label="Room name" maxLength={60} placeholder="e.g. Room 1" value={room.name} onChange={(event) => change(room.key, 'name', event.target.value)} error={error('name')} />
                </div>
                <div className="col-sm-6">
                  <SelectField id={id('type')} label="Room type" value={room.type} onChange={(event) => change(room.key, 'type', event.target.value)} error={error('type')}>
                    {ROOM_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </SelectField>
                </div>
                <div className="col-sm-4">
                  <TextField id={id('rent')} label="Monthly rent (₱)" inputMode="numeric" placeholder="2500" value={room.rent} onChange={digits(room.key, 'rent', 6)} error={error('rent')} />
                </div>
                <div className="col-6 col-sm-4">
                  <TextField id={id('capacity')} label="Beds" inputMode="numeric" value={room.capacity} onChange={digits(room.key, 'capacity', 3)} error={error('capacity')} />
                </div>
                <div className="col-6 col-sm-4">
                  <TextField id={id('slotsTaken')} label="Beds taken" inputMode="numeric" value={room.slotsTaken} onChange={digits(room.key, 'slotsTaken', 3)} error={error('slotsTaken')} />
                </div>
              </div>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
                <div className="form-check form-switch mb-0">
                  <input id={id('open')} type="checkbox" role="switch" className="form-check-input" checked={room.isOpen} onChange={(event) => change(room.key, 'isOpen', event.target.checked)} />
                  <label htmlFor={id('open')} className="form-check-label small">
                    Taking boarders
                    <span className="text-body-secondary"> · {room.isOpen ? `${free} free ${free === 1 ? 'bed' : 'beds'}` : 'closed'}</span>
                  </label>
                </div>
                {rooms.length > 1 &&
                  (locked ? (
                    <span className="text-xs text-body-secondary">Has booking requests, so it can’t be removed. Close it instead.</span>
                  ) : (
                    <button type="button" className="btn btn-link btn-sm p-0 link-danger text-decoration-none d-inline-flex align-items-center gap-1" onClick={() => remove(room.key)}>
                      <Trash2 size={14} aria-hidden="true" />
                      Remove {room.name.trim() || `room ${index + 1}`}
                    </button>
                  ))}
              </div>
            </li>
          )
        })}
      </ol>
      {errors.rooms && <div className="invalid-feedback d-block mt-0">{errors.rooms}</div>}
      {rooms.length < MAX_ROOMS && (
        <div>
          <button type="button" className="btn btn-outline-primary" onClick={add}>
            <Plus size={16} aria-hidden="true" />
            Add a room
          </button>
        </div>
      )}
    </div>
  )
}
