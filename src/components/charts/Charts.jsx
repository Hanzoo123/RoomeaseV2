import { useState } from 'react'
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Table2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { STATUS_COLORS, STATUS_ORDER } from './analytics'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)
ChartJS.defaults.font.family = '"Inter Variable", system-ui, sans-serif'

// Chart chrome per theme: recessive hairline grid, secondary-ink text, card surface for gaps.
const THEMES = {
  light: { text: '#66728a', grid: '#e4e8f1', surface: '#ffffff', tooltipBg: '#0f1b33' },
  dark: { text: '#9aa4b5', grid: '#2b3445', surface: '#161d28', tooltipBg: '#000000' },
}

// Bar color per dashboard: landlord green by default, violet on the admin reports.
const ACCENTS = {
  landlord: { light: '#16703f', dark: '#6fd39b' },
  admin: { light: '#5b4bd6', dark: '#b3abff' },
}

function useChartTheme(tone = 'landlord') {
  const { theme } = useTheme()
  return { mode: theme, ...THEMES[theme], accent: ACCENTS[tone][theme] }
}

function baseOptions(colors) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        padding: 10,
        cornerRadius: 8,
        titleFont: { weight: '600' },
        boxPadding: 4,
      },
    },
  }
}

const axisText = (colors) => ({ color: colors.text, font: { size: 11 } })

// Card wrapper with a "Show table" toggle so every chart has a text alternative.
export function ChartCard({ title, subtitle, table, height = 260, children, footer }) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className="card h-100">
      <div className="card-body p-4 d-flex flex-column">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
          <div>
            <h2 className="fs-6 fw-semibold mb-0">{title}</h2>
            {subtitle && <p className="text-xs text-body-secondary mb-0">{subtitle}</p>}
          </div>
          {table && (
            <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none text-nowrap" onClick={() => setShowTable((value) => !value)} aria-pressed={showTable}>
              <Table2 size={14} aria-hidden="true" />
              {showTable ? 'Show chart' : 'Show table'}
            </button>
          )}
        </div>
        {showTable ? (
          <div className="table-responsive">{table}</div>
        ) : (
          <div className="position-relative flex-grow-1" style={{ height, minHeight: height }}>
            {children}
          </div>
        )}
        {footer}
      </div>
    </section>
  )
}

function StatusLegend({ colors, totals }) {
  return (
    <ul className="list-unstyled d-flex flex-wrap column-gap-3 row-gap-1 small mb-0 mt-3">
      {STATUS_ORDER.map((status) => (
        <li key={status} className="d-flex align-items-center gap-2">
          <span className="rounded-1" style={{ width: 10, height: 10, backgroundColor: colors[status] }} aria-hidden="true" />
          <span className="text-body-secondary">{status}</span>
          {totals && <strong>{totals[status]}</strong>}
        </li>
      ))}
    </ul>
  )
}

export function RequestsByMonthChart({ months, perMonth }) {
  const colors = useChartTheme()
  const statusColors = STATUS_COLORS[colors.mode]
  const data = {
    labels: months.map((month) => month.label),
    datasets: STATUS_ORDER.map((status) => ({
      label: status,
      data: perMonth[status],
      backgroundColor: statusColors[status],
      borderColor: colors.surface,
      borderWidth: { top: 2 },
      borderSkipped: 'start',
      borderRadius: 3,
      maxBarThickness: 24,
      stack: 'requests',
    })),
  }
  const options = {
    ...baseOptions(colors),
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: axisText(colors) },
      y: { stacked: true, beginAtZero: true, ticks: { ...axisText(colors), precision: 0 }, grid: { color: colors.grid, lineWidth: 1 }, border: { display: false } },
    },
  }
  const table = (
    <table className="table table-sm small mb-0">
      <thead>
        <tr>
          <th scope="col">Month</th>
          {STATUS_ORDER.map((status) => (
            <th key={status} scope="col" className="text-end">
              {status}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {months.map((month, index) => (
          <tr key={month.key}>
            <th scope="row" className="fw-normal">
              {month.label}
            </th>
            {STATUS_ORDER.map((status) => (
              <td key={status} className="text-end">
                {perMonth[status][index]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
  return (
    <ChartCard title="Reservation requests per month" subtitle="Last 6 months, by status" table={table} footer={<StatusLegend colors={statusColors} />}>
      <Bar data={data} options={options} aria-label="Stacked column chart of reservation requests per month by status" role="img" />
    </ChartCard>
  )
}

export function StatusBreakdownChart({ totals }) {
  const colors = useChartTheme()
  const statusColors = STATUS_COLORS[colors.mode]
  const total = STATUS_ORDER.reduce((sum, status) => sum + totals[status], 0)
  const data = {
    labels: STATUS_ORDER,
    datasets: [
      {
        data: STATUS_ORDER.map((status) => totals[status]),
        backgroundColor: STATUS_ORDER.map((status) => statusColors[status]),
        borderColor: colors.surface,
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  }
  const options = { ...baseOptions(colors), cutout: '68%' }
  const table = (
    <table className="table table-sm small mb-0">
      <tbody>
        {STATUS_ORDER.map((status) => (
          <tr key={status}>
            <th scope="row" className="fw-normal">
              {status}
            </th>
            <td className="text-end">{totals[status]}</td>
            <td className="text-end text-body-secondary">{total ? Math.round((totals[status] / total) * 100) : 0}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
  return (
    <ChartCard title="Request status" subtitle="All requests so far" table={table} height={200} footer={<StatusLegend colors={statusColors} totals={totals} />}>
      <Doughnut data={data} options={options} aria-label="Doughnut chart of reservation requests by status" role="img" />
      <div className="position-absolute top-50 start-50 translate-middle text-center pe-none">
        <p className="fs-3 fw-bold lh-1 mb-0">{total}</p>
        <p className="text-xs text-body-secondary mb-0">requests</p>
      </div>
    </ChartCard>
  )
}

// One measure per chart, as horizontal bars (names are long, so they read better on the y-axis).
export function ListingBarChart({ title, subtitle, rows, valueLabel, max, format = (value) => value, tone }) {
  const colors = useChartTheme(tone)
  const data = {
    labels: rows.map((row) => row.label),
    datasets: [
      {
        label: valueLabel,
        data: rows.map((row) => row.value),
        backgroundColor: colors.accent,
        borderRadius: 4,
        borderSkipped: 'start',
        maxBarThickness: 22,
      },
    ],
  }
  const options = {
    ...baseOptions(colors),
    indexAxis: 'y',
    plugins: {
      ...baseOptions(colors).plugins,
      tooltip: { ...baseOptions(colors).plugins.tooltip, callbacks: { label: (item) => ` ${valueLabel}: ${format(item.raw)}` } },
    },
    scales: {
      x: { beginAtZero: true, max, ticks: { ...axisText(colors), precision: 0, maxTicksLimit: 6, maxRotation: 0, callback: (value) => format(value) }, grid: { color: colors.grid, lineWidth: 1 }, border: { display: false } },
      y: { grid: { display: false }, border: { display: false }, ticks: { ...axisText(colors), color: colors.text, autoSkip: false } },
    },
  }
  const table = (
    <table className="table table-sm small mb-0">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row" className="fw-normal">
              {row.label}
            </th>
            <td className="text-end">{format(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
  return (
    <ChartCard title={title} subtitle={subtitle} table={table} height={Math.max(160, rows.length * 44)}>
      <Bar data={data} options={options} aria-label={`Bar chart: ${title}`} role="img" />
    </ChartCard>
  )
}

// One count per month as columns (e.g. new accounts), with the same table fallback.
export function MonthlyBarChart({ title, subtitle, months, values, valueLabel, tone }) {
  const colors = useChartTheme(tone)
  const data = {
    labels: months.map((month) => month.label),
    datasets: [{ label: valueLabel, data: values, backgroundColor: colors.accent, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 28 }],
  }
  const options = {
    ...baseOptions(colors),
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: axisText(colors) },
      y: { beginAtZero: true, ticks: { ...axisText(colors), precision: 0 }, grid: { color: colors.grid, lineWidth: 1 }, border: { display: false } },
    },
  }
  const table = (
    <table className="table table-sm small mb-0">
      <tbody>
        {months.map((month, index) => (
          <tr key={month.key}>
            <th scope="row" className="fw-normal">
              {month.label}
            </th>
            <td className="text-end">{values[index]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
  return (
    <ChartCard title={title} subtitle={subtitle} table={table}>
      <Bar data={data} options={options} aria-label={`Column chart: ${title}`} role="img" />
    </ChartCard>
  )
}
