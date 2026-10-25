import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, UserCheck, Users, UserX } from 'lucide-react'
import { ROLE_LABEL, useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../data/mockData'
import ReasonDialog from '../../components/admin/ReasonDialog'
import ListingStatus from '../../components/listings/ListingStatus'
import Avatar from '../../components/ui/Avatar'
import { EmptyState, Modal, PageHeader, StatusPill, Tabs } from '../../components/ui'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'boarder', label: 'Boarders' },
  { value: 'landlord', label: 'Landlords' },
  { value: 'admin', label: 'Admins' },
  { value: 'inactive', label: 'Deactivated' },
]

const ROLE_BADGE = { boarder: 'bg-primary-subtle text-primary-emphasis', landlord: 'bg-success-subtle text-success-emphasis', admin: 'bg-dark-subtle text-dark-emphasis' }
const DEACTIVATE_SUGGESTIONS = ['Posting listings for houses they don’t own.', 'Harassing other users.', 'Duplicate or fake account.']

function UserDetails({ account, onClose }) {
  const { listings, reservations, listingById } = useData()
  const owned = listings.filter((listing) => listing.ownerId === account.id)
  const requests = reservations.filter((reservation) => reservation.boarderId === account.id)

  return (
    <Modal title="Account details" onClose={onClose}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <Avatar person={account} className="avatar-lg" />
        <div>
          <p className="fw-semibold mb-0">{account.name}</p>
          <p className="small text-body-secondary mb-0">
            {ROLE_LABEL[account.role]} · {account.active ? 'Active' : 'Deactivated'}
          </p>
        </div>
      </div>
      <dl className="row small mb-0">
        <dt className="col-4 fw-normal text-body-secondary">Email</dt>
        <dd className="col-8 text-break">{account.email}</dd>
        <dt className="col-4 fw-normal text-body-secondary">Phone</dt>
        <dd className="col-8">{account.phone || '—'}</dd>
        <dt className="col-4 fw-normal text-body-secondary">Joined</dt>
        <dd className="col-8">{account.createdAt ? formatDate(account.createdAt) : '—'}</dd>
      </dl>
      {account.role === 'landlord' && (
        <>
          <h3 className="fs-6 fw-semibold mt-3">Listings ({owned.length})</h3>
          <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
            {owned.map((listing) => (
              <li key={listing.id} className="d-flex justify-content-between gap-2">
                <Link to={`/admin/listings/${listing.id}`} className="text-decoration-none">
                  {listing.name}
                </Link>
                <ListingStatus listing={listing} />
              </li>
            ))}
            {!owned.length && <li className="text-body-secondary">No listings yet.</li>}
          </ul>
        </>
      )}
      {account.role === 'boarder' && (
        <>
          <h3 className="fs-6 fw-semibold mt-3">Reservation requests ({requests.length})</h3>
          <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
            {requests.map((reservation) => (
              <li key={reservation.id} className="d-flex justify-content-between align-items-center gap-2">
                <span>
                  {listingById(reservation.listingId)?.name ?? 'Removed listing'} <span className="text-body-secondary">· {formatDate(reservation.date)}</span>
                </span>
                <StatusPill status={reservation.status} />
              </li>
            ))}
            {!requests.length && <li className="text-body-secondary">No requests yet.</li>}
          </ul>
        </>
      )}
    </Modal>
  )
}

export default function ManageUsers() {
  const { user, accounts, setAccountActive } = useAuth()
  const { listings, reservations, logEvent } = useData()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [deactivating, setDeactivating] = useState(null)
  const [viewing, setViewing] = useState(null)

  const tab = TABS.some((item) => item.value === params.get('tab')) ? params.get('tab') : 'all'
  const query = params.get('q') ?? ''
  const setParam = (key, value) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const needle = query.trim().toLowerCase()
  const searched = accounts.filter((account) => !needle || `${account.name} ${account.email} ${account.phone ?? ''}`.toLowerCase().includes(needle))
  const inTab = (account, value) => (value === 'all' ? true : value === 'inactive' ? !account.active : account.role === value)
  const rows = searched.filter((account) => inTab(account, tab)).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  const counts = Object.fromEntries(TABS.map(({ value }) => [value, searched.filter((account) => inTab(account, value)).length]))

  const activitySummary = (account) => {
    if (account.role === 'landlord') {
      const count = listings.filter((listing) => listing.ownerId === account.id).length
      return `${count} ${count === 1 ? 'listing' : 'listings'}`
    }
    if (account.role === 'boarder') {
      const count = reservations.filter((reservation) => reservation.boarderId === account.id).length
      return `${count} ${count === 1 ? 'request' : 'requests'}`
    }
    return 'Administrator'
  }

  function reactivate(account) {
    setAccountActive(account.id, true)
    logEvent('user.activated', 'user', account.id, account.name)
    toast(`${account.name} can sign in again.`)
  }

  return (
    <div>
      <PageHeader title="Manage Users" subtitle="Everyone with a RoomEase account. Deactivated accounts can’t sign in until they are reactivated." />

      <div className="d-flex flex-column flex-lg-row gap-3 mb-3">
        <div className="flex-grow-1">
          <Tabs tabs={TABS.map((item) => ({ ...item, count: counts[item.value] }))} value={tab} onChange={(value) => setParam('tab', value === 'all' ? '' : value)} label="Account type" />
        </div>
        <div className="input-icon" style={{ minWidth: '16rem' }}>
          <Search size={16} className="lead-icon" aria-hidden="true" />
          <input type="search" className="form-control" placeholder="Search name, email or phone" aria-label="Search users" value={query} onChange={(event) => setParam('q', event.target.value)} />
        </div>
      </div>

      {rows.length ? (
        <div className="card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Activity</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((account) => {
                  const isMe = account.id === user.id
                  return (
                    <tr key={account.id} className={account.active ? '' : 'opacity-75'}>
                      <td style={{ minWidth: '15rem' }}>
                        <div className="d-flex align-items-center gap-3">
                          <Avatar person={account} />
                          <div style={{ minWidth: 0 }}>
                            <p className="small fw-semibold mb-0">
                              {account.name}
                              {isMe && <span className="text-body-secondary fw-normal"> (you)</span>}
                            </p>
                            <p className="text-xs text-body-secondary text-truncate mb-0">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${ROLE_BADGE[account.role]}`}>{ROLE_LABEL[account.role]}</span>
                      </td>
                      <td className="small text-nowrap">{account.phone || <span className="text-body-secondary">—</span>}</td>
                      <td className="small text-body-secondary text-nowrap">{account.createdAt ? formatDate(account.createdAt) : '—'}</td>
                      <td className="small text-nowrap">{activitySummary(account)}</td>
                      <td>
                        <span className={`badge rounded-pill ${account.active ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'}`}>
                          {account.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <div className="d-flex justify-content-end gap-2">
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setViewing(account)}>
                            View
                          </button>
                          {isMe ? null : account.active ? (
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeactivating(account)}>
                              <UserX size={14} aria-hidden="true" />
                              Deactivate
                            </button>
                          ) : (
                            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => reactivate(account)}>
                              <UserCheck size={14} aria-hidden="true" />
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={Users} title="No accounts match" body="Try another tab or search." />
      )}

      {deactivating && (
        <ReasonDialog
          title={`Deactivate ${deactivating.name}?`}
          intro={`They’re signed out and can’t sign in until you reactivate the account.${deactivating.role === 'landlord' ? ' Their listings stay as they are; remove them separately if needed.' : ''}`}
          suggestions={DEACTIVATE_SUGGESTIONS}
          confirmLabel="Deactivate account"
          onClose={() => setDeactivating(null)}
          onConfirm={(reason) => {
            setAccountActive(deactivating.id, false)
            logEvent('user.deactivated', 'user', deactivating.id, deactivating.name, reason)
            toast(`${deactivating.name} was deactivated.`, 'info')
            setDeactivating(null)
          }}
        />
      )}
      {viewing && <UserDetails account={accounts.find((account) => account.id === viewing.id) ?? viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
