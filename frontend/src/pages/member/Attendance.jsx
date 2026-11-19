import { useState } from 'react'
import { CalendarCheck, TrendingUp, Trophy } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import StatCard from '../../components/admin/StatCard.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import Input from '../../components/ui/Input.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchMyAttendance } from '../../services/portalService.js'
import { formatDate } from '../../utils/adminFormat.js'
import { formatClock, formatMinutes, todayLocal } from '../../utils/dateTime.js'

const COLUMNS = [
  { key: 'date', header: 'Date', cell: (a) => <span className="font-semibold">{formatDate(a.date)}</span> },
  { key: 'in', header: 'Check-in', cell: (a) => formatClock(a.checkInAt) },
  { key: 'out', header: 'Check-out', cell: (a) => (a.checkOutAt ? formatClock(a.checkOutAt) : '–') },
  { key: 'duration', header: 'Duration', cell: (a) => formatMinutes(a.durationMinutes) },
]

export default function MemberAttendance() {
  usePageTitle('My Attendance')
  const [today] = useState(todayLocal)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const list = useList(fetchMyAttendance, { from, to, page, limit: 15 })

  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  return (
    <>
      <PageHeading title="Attendance" subtitle="Your visits to the gym." />

      {list.meta && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={CalendarCheck} label="This month" value={list.meta.thisMonth} hint="Visits" />
          <StatCard icon={TrendingUp} label="Last 30 days" value={list.meta.last30Days} hint="Visits" tone="success" />
          <StatCard icon={Trophy} label="All time" value={list.meta.totalVisits} hint="Visits since you joined" tone="warning" />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input label="From" type="date" value={from} max={to || today} onChange={changeFilter(setFrom)} className="w-44" />
        <Input label="To" type="date" value={to} min={from || undefined} max={today} onChange={changeFilter(setTo)} className="w-44" />
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Your attendance"
            columns={COLUMNS}
            rows={list.data}
            rowKey="id"
            loading={list.loading}
            emptyTitle="No visits found"
            emptyText="Visits are recorded by the front desk when you check in."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}
    </>
  )
}