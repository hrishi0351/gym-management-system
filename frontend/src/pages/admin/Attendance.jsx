import { useState } from 'react'
import toast from 'react-hot-toast'
import { LogIn, LogOut } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import CheckInModal from '../../components/admin/CheckInModal.jsx'
import Input from '../../components/ui/Input.jsx'
import Checkbox from '../../components/ui/Checkbox.jsx'
import Button from '../../components/ui/Button.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { checkOut, fetchAttendance } from '../../services/adminService.js'
import { formatDate } from '../../utils/adminFormat.js'
import { formatClock, formatMinutes, todayLocal } from '../../utils/dateTime.js'
import { getErrorMessage } from '../../utils/errors.js'

export default function Attendance() {
  usePageTitle('Attendance')
  const [today] = useState(todayLocal)
  const [date, setDate] = useState(today)
  const [search, setSearch] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const list = useList(fetchAttendance, {
    date,
    search: debouncedSearch.trim(),
    open: openOnly ? 'true' : '',
    page,
    limit: 20,
  })

  const [checkInOpen, setCheckInOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const isToday = date === today

  const doCheckOut = async (row) => {
    setBusyId(row.memberId)
    try {
      await checkOut(row.memberId)
      toast.success(`${row.memberName} checked out`)
      list.reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'member',
      header: 'Member',
      cell: (a) => (
        <div>
          <p className="font-semibold">{a.memberName}</p>
          <p className="text-xs text-muted">{a.memberCode}</p>
        </div>
      ),
    },
    { key: 'in', header: 'Check-in', cell: (a) => formatClock(a.checkInAt) },
    {
      key: 'out',
      header: 'Check-out',
      cell: (a) =>
        a.checkOutAt ? (
          formatClock(a.checkOutAt)
        ) : (
          <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">In the gym</span>
        ),
    },
    { key: 'duration', header: 'Duration', cell: (a) => formatMinutes(a.durationMinutes) },
    { key: 'notes', header: 'Notes', cell: (a) => a.notes || '–' },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (a) =>
        !a.checkOutAt && isToday ? (
          <Button size="sm" variant="secondary" onClick={() => doCheckOut(a)} loading={busyId === a.memberId}>
            <LogOut size={15} aria-hidden="true" /> Check out
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeading title="Attendance" subtitle="Daily visits. Check members in and out at the front desk.">
        <Button onClick={() => setCheckInOpen(true)}>
          <LogIn size={16} aria-hidden="true" /> Check in member
        </Button>
      </PageHeading>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by member name or code"
          label="Search attendance"
        />
        <Input
          label="Date"
          type="date"
          value={date}
          max={today}
          onChange={(event) => {
            setDate(event.target.value || today)
            setPage(1)
          }}
          className="w-44"
        />
        <Checkbox
          label="Still in the gym"
          checked={openOnly}
          onChange={(event) => {
            setOpenOnly(event.target.checked)
            setPage(1)
          }}
          className="pb-3"
        />
      </div>

      {list.meta && (
        <p className="mb-3 text-sm text-muted">
          {formatDate(date)}: <span className="font-semibold text-fg">{list.meta.total}</span>{' '}
          {list.meta.total === 1 ? 'visit' : 'visits'} ·{' '}
          <span className="font-semibold text-success">{list.meta.currentlyIn}</span> in the gym now
        </p>
      )}

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Attendance"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No visits recorded"
            emptyText={isToday ? 'Nobody has checked in yet today.' : 'No check-ins were recorded on this date.'}
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <CheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSaved={() => {
          setCheckInOpen(false)
          setDate(today)
          setPage(1)
          list.reload()
        }}
      />
    </>
  )
}