import { useState } from 'react'
import { Building2, CalendarCheck, Download, DoorOpen, UserPlus, Wallet } from 'lucide-react'
import { ROLE_LABEL, useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { AREAS, formatPeso, ROOM_TYPES } from '../../data/mockData'
import { lastMonths, STATUS_ORDER } from '../../components/charts/analytics'
import { ListingBarChart, MonthlyBarChart, RequestsByMonthChart, StatusBreakdownChart } from '../../components/charts/Charts'
import { downloadCsv } from '../../components/admin/csv'
import { listingStatus } from '../../components/listings/ListingStatus'
import { PageHeader, StatCard } from '../../components/ui'

const DAY = 24 * 60 * 60 * 1000
const today = () => new Date().toLocaleDateString('en-CA')

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

export default function Reports() {
  const { accounts } = useAuth()
  const { listings, reservations, listingById, ownerOf } = useData()
  const toast = useToast()
  const [monthAgo] = useState(() => new Date(Date.now() - 30 * DAY).toISOString())

  const live = listings.filter((listing) => listing.approval === 'Approved' && !listing.removed)
  const totalRooms = live.reduce((sum, listing) => sum + listing.totalRooms, 0)
  const openRooms = live.reduce((sum, listing) => sum + listing.availableRooms, 0)
  const occupancy = totalRooms ? Math.round(((totalRooms - openRooms) / totalRooms) * 100) : 0
  const thisMonth = today().slice(0, 7)
  const requestsThisMonth = reservations.filter((reservation) => reservation.date.startsWith(thisMonth)).length
  const approved = reservations.filter((reservation) => reservation.status === 'Approved').length
  const decided = approved + reservations.filter((reservation) => reservation.status === 'Declined').length
  const newAccounts = accounts.filter((account) => account.createdAt && account.createdAt > monthAgo).length

  const months = lastMonths(6)
  const perMonth = Object.fromEntries(STATUS_ORDER.map((status) => [status, months.map(() => 0)]))
  for (const reservation of reservations) {
    const index = months.findIndex((month) => reservation.date.startsWith(month.key))
    if (index >= 0 && perMonth[reservation.status]) perMonth[reservation.status][index] += 1
  }
  const statusTotals = Object.fromEntries(STATUS_ORDER.map((status) => [status, reservations.filter((item) => item.status === status).length]))
  // createdAt is a UTC timestamp; its local date decides the month.
  const signupsPerMonth = months.map((month) => accounts.filter((account) => account.createdAt && new Date(account.createdAt).toLocaleDateString('en-CA').startsWith(month.key)).length)

  const byArea = AREAS.map((area) => ({ label: area, listings: live.filter((listing) => listing.area === area) }))
  const byType = ROOM_TYPES.map((type) => ({ label: type, value: live.filter((listing) => listing.roomType === type).length }))

  const exports = [
    {
      label: 'Listings',
      file: 'roomease-listings',
      rows: listings,
      columns: [
        { label: 'Name', value: (listing) => listing.name },
        { label: 'Landlord', value: (listing) => ownerOf(listing).name },
        { label: 'Area', value: (listing) => listing.area },
        { label: 'Address', value: (listing) => listing.address },
        { label: 'Room type', value: (listing) => listing.roomType },
        { label: 'Monthly rent (PHP)', value: (listing) => listing.price },
        { label: 'Rooms', value: (listing) => listing.totalRooms },
        { label: 'Open rooms', value: (listing) => listing.availableRooms },
        { label: 'Status', value: (listing) => listingStatus(listing).label },
        { label: 'Submitted', value: (listing) => listing.submittedAt?.slice(0, 10) },
        { label: 'Views', value: (listing) => listing.views },
      ],
    },
    {
      label: 'Accounts',
      file: 'roomease-accounts',
      rows: accounts,
      columns: [
        { label: 'Name', value: (account) => account.name },
        { label: 'Email', value: (account) => account.email },
        { label: 'Phone', value: (account) => account.phone },
        { label: 'Role', value: (account) => ROLE_LABEL[account.role] },
        { label: 'Status', value: (account) => (account.active ? 'Active' : 'Deactivated') },
        { label: 'Joined', value: (account) => account.createdAt?.slice(0, 10) },
      ],
    },
    {
      label: 'Reservations',
      file: 'roomease-reservations',
      rows: reservations,
      columns: [
        { label: 'Requested', value: (reservation) => reservation.date },
        { label: 'Boarder', value: (reservation) => reservation.boarder },
        { label: 'Boarding house', value: (reservation) => listingById(reservation.listingId)?.name ?? 'Removed listing' },
        { label: 'Room type', value: (reservation) => reservation.roomType },
        { label: 'Move-in', value: (reservation) => reservation.moveIn },
        { label: 'Status', value: (reservation) => reservation.status },
        { label: 'Landlord note', value: (reservation) => reservation.landlordNote },
      ],
    },
  ]

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        title="Reports"
        subtitle="How RoomEase is doing across Baybay City."
        actions={
          <div className="d-flex flex-wrap gap-2" role="group" aria-label="Download CSV">
            {exports.map((item) => (
              <button
                key={item.label}
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  downloadCsv(`${item.file}-${today()}.csv`, item.columns, item.rows)
                  toast(`${item.label} CSV downloaded.`)
                }}
              >
                <Download size={16} aria-hidden="true" />
                {item.label} CSV
              </button>
            ))}
          </div>
        }
      />

      <div className="row g-3">
        <div className="col-6 col-xl">
          <StatCard icon={Building2} value={live.length} label="Live listings" iconClassName="text-primary" />
        </div>
        <div className="col-6 col-xl">
          <StatCard icon={DoorOpen} value={`${occupancy}%`} label={`Rooms taken (${openRooms} of ${totalRooms} open)`} iconClassName="text-success" />
        </div>
        <div className="col-6 col-xl">
          <StatCard icon={Wallet} value={formatPeso(Math.round(average(live.map((listing) => listing.price))))} label="Average monthly rent" iconClassName="text-warning" />
        </div>
        <div className="col-6 col-xl">
          <StatCard icon={CalendarCheck} value={requestsThisMonth} label={`Requests this month · ${decided ? Math.round((approved / decided) * 100) : 0}% approved`} iconClassName="text-info" />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard icon={UserPlus} value={newAccounts} label="New accounts in 30 days" iconClassName="text-primary" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-8">
          <RequestsByMonthChart months={months} perMonth={perMonth} />
        </div>
        <div className="col-xl-4">
          <StatusBreakdownChart totals={statusTotals} />
        </div>
        <div className="col-lg-6">
          <MonthlyBarChart title="New accounts per month" subtitle="Boarders, landlords and admins, last 6 months" months={months} values={signupsPerMonth} valueLabel="New accounts" tone="admin" />
        </div>
        <div className="col-lg-6">
          <ListingBarChart title="Live listings by room type" subtitle="What boarders can choose from" rows={byType} valueLabel="Listings" tone="admin" />
        </div>
        <div className="col-lg-6">
          <ListingBarChart
            title="Live listings by area"
            subtitle="Where the boarding houses are"
            rows={byArea.map((area) => ({ label: area.label, value: area.listings.length }))}
            valueLabel="Listings"
            tone="admin"
          />
        </div>
        <div className="col-lg-6">
          <ListingBarChart
            title="Average rent by area"
            subtitle="Monthly rent of live listings"
            rows={byArea.map((area) => ({ label: area.label, value: Math.round(average(area.listings.map((listing) => listing.price))) }))}
            valueLabel="Average rent"
            format={(value) => formatPeso(value)}
            tone="admin"
          />
        </div>
      </div>
    </div>
  )
}
