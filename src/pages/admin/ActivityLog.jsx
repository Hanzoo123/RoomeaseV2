import { useSearchParams } from 'react-router-dom'
import { Download, History, Search } from 'lucide-react'
import { ROLE_LABEL } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { formatDate } from '../../data/mockData'
import ActivityItem from '../../components/admin/ActivityItem'
import { ACTIVITY_GROUPS, activityInfo } from '../../components/admin/activityLabels'
import { downloadCsv } from '../../components/admin/csv'
import { EmptyState, PageHeader, Tabs } from '../../components/ui'

const TABS = [{ value: 'all', label: 'Everything' }, ...Object.entries(ACTIVITY_GROUPS).map(([value, label]) => ({ value, label }))]
const ACTOR_ROLES = { boarder: 'Boarders', landlord: 'Landlords', admin: 'Admins' }

const CSV_COLUMNS = [
  { label: 'When', value: (entry) => `${new Date(entry.date).toLocaleDateString('en-CA')} ${new Date(entry.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` },
  { label: 'Who', value: (entry) => entry.actorName },
  { label: 'Role', value: (entry) => ROLE_LABEL[entry.actorRole] ?? entry.actorRole },
  { label: 'Action', value: (entry) => activityInfo(entry.action).text },
  { label: 'Target', value: (entry) => entry.targetLabel },
  { label: 'Detail', value: (entry) => entry.detail },
]

function exportCsv(entries) {
  downloadCsv(`roomease-activity-${new Date().toLocaleDateString('en-CA')}.csv`, CSV_COLUMNS, entries)
}

export default function ActivityLog() {
  const { activity } = useData()
  const [params, setParams] = useSearchParams()
  const group = TABS.some((item) => item.value === params.get('group')) ? params.get('group') : 'all'
  const actor = ACTOR_ROLES[params.get('by')] ? params.get('by') : ''
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
  const entries = activity.filter(
    (entry) =>
      (group === 'all' || activityInfo(entry.action).group === group) &&
      (!actor || entry.actorRole === actor) &&
      (!needle || `${entry.actorName} ${entry.targetLabel} ${entry.detail ?? ''}`.toLowerCase().includes(needle)),
  )

  // Grouped by local day, newest first.
  const days = []
  for (const entry of entries) {
    const day = new Date(entry.date).toLocaleDateString('en-CA')
    if (days.at(-1)?.day !== day) days.push({ day, entries: [] })
    days.at(-1).entries.push(entry)
  }

  return (
    <div>
      <PageHeader
        title="Activity Log"
        subtitle="Who approved, rejected, removed or changed what, and when."
        actions={
          <button type="button" className="btn btn-outline-secondary" disabled={!entries.length} onClick={() => exportCsv(entries)}>
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
        }
      />

      <div className="d-flex flex-column flex-lg-row gap-3 mb-3">
        <div className="flex-grow-1">
          <Tabs tabs={TABS} value={group} onChange={(value) => setParam('group', value === 'all' ? '' : value)} label="Activity type" />
        </div>
        <select className="form-select" style={{ maxWidth: '12rem' }} value={actor} onChange={(event) => setParam('by', event.target.value)} aria-label="Done by">
          <option value="">Done by anyone</option>
          {Object.entries(ACTOR_ROLES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="input-icon" style={{ minWidth: '15rem' }}>
          <Search size={16} className="lead-icon" aria-hidden="true" />
          <input type="search" className="form-control" placeholder="Search names or listings" aria-label="Search activity" value={query} onChange={(event) => setParam('q', event.target.value)} />
        </div>
      </div>

      {days.length ? (
        <div className="d-flex flex-column gap-3">
          {days.map(({ day, entries: dayEntries }) => (
            <section key={day} className="card">
              <div className="card-body px-4 py-3">
                <h2 className="text-xs fw-semibold text-uppercase text-body-secondary mb-0" style={{ letterSpacing: '0.05em' }}>
                  {formatDate(day)}
                </h2>
                <ul className="list-unstyled mb-0 activity-list">
                  {dayEntries.map((entry) => (
                    <ActivityItem key={entry.id} entry={entry} />
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState icon={History} title="No activity matches" body="Try another type or clear the search." />
      )}
    </div>
  )
}
