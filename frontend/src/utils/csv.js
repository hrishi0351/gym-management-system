const FORMULA_START = /^[=+\-@\t\r]/

function cell(value) {
  let text = value == null ? '' : String(value)
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

/** Downloads a CSV file. The BOM makes Excel read UTF-8 (names, ₹) correctly. */
export function downloadCsv(filename, headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(cell).join(','))
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}