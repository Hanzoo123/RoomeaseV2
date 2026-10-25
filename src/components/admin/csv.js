// CSV export for the admin reports. A cell starting with = + - @ (or a tab/return) could run as a
// formula when the file is opened in Excel or Sheets, so those cells are prefixed with an apostrophe.
const FORMULA_START = /^[=+\-@\t\r]/

function cell(value) {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (FORMULA_START.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(columns, rows) {
  const header = columns.map((column) => cell(column.label)).join(',')
  const body = rows.map((row) => columns.map((column) => cell(column.value(row))).join(','))
  return [header, ...body].join('\r\n')
}

export function downloadCsv(filename, columns, rows) {
  // The byte-order mark makes Excel read ₱ and accented names correctly.
  const blob = new Blob(['﻿', toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
