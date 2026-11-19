import { useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarClock, Pencil, Plus, Trash2, Users } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import ClassFormModal from '../../components/admin/ClassFormModal.jsx'
import ClassSchedulesModal from '../../components/admin/ClassSchedulesModal.jsx'
import ClassBookingsModal from '../../components/admin/ClassBookingsModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Select from '../../components/ui/Select.jsx'
import Button from '../../components/ui/Button.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { deleteClass, fetchClasses } from '../../services/adminService.js'
import { getErrorMessage } from '../../utils/errors.js'
import { DIFFICULTY } from '../../utils/format.js'

export default function AdminClasses() {
  usePageTitle('Classes')
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const list = useList(fetchClasses, { search: debouncedSearch.trim(), active, page, limit: 10 })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [scheduleId, setScheduleId] = useState(null)
  const [bookingsFor, setBookingsFor] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const openForm = (cls) => {
    setEditing(cls)
    setFormOpen(true)
  }

  const onSaved = () => {
    setFormOpen(false)
    list.reload()
  }

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await deleteClass(deleting.id)
      toast.success('Class deleted')
      setDeleting(null)
      if (list.data?.length === 1 && page > 1) setPage((p) => p - 1)
      else list.reload()
    } catch (error) {
      toast.error(getErrorMessage(error)) // e.g. upcoming bookings exist
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  const columns = [
    {
      key: 'class',
      header: 'Class',
      cell: (c) => (
        <div>
          <p className="font-semibold">{c.name}</p>
          <p className="text-xs text-muted">{[c.category, c.location].filter(Boolean).join(' · ') || '–'}</p>
        </div>
      ),
    },
    {
      key: 'trainer',
      header: 'Trainer',
      cell: (c) => (c.trainer ? c.trainer.name : <span className="text-muted">Unassigned</span>),
    },
    {
      key: 'level',
      header: 'Level',
      cell: (c) => {
        const d = DIFFICULTY[c.difficulty] || DIFFICULTY.all_levels
        return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.className}`}>{d.label}</span>
      },
    },
    { key: 'capacity', header: 'Capacity', cell: (c) => `${c.capacity} · ${c.durationMinutes} min` },
    { key: 'slots', header: 'Weekly slots', cell: (c) => c.schedules.length },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (c) => (
        <div className="flex justify-end">
          <IconButton icon={CalendarClock} label={`Schedule of ${c.name}`} onClick={() => setScheduleId(c.id)} />
          <IconButton icon={Users} label={`Bookings of ${c.name}`} onClick={() => setBookingsFor(c)} />
          <IconButton icon={Pencil} label={`Edit ${c.name}`} onClick={() => openForm(c)} />
          <IconButton icon={Trash2} label={`Delete ${c.name}`} onClick={() => setDeleting(c)} danger />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Classes" subtitle="Group classes, their weekly timetable and member bookings.">
        <Button onClick={() => openForm(null)}>
          <Plus size={16} aria-hidden="true" /> Add class
        </Button>
      </PageHeading>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by class name or category"
          label="Search classes"
        />
        <Select
          aria-label="Filter by status"
          value={active}
          onChange={(event) => {
            setActive(event.target.value)
            setPage(1)
          }}
          className="w-44"
        >
          <option value="">All classes</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Classes"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No classes found"
            emptyText="Add your first class to start taking bookings."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <ClassFormModal open={formOpen} cls={editing} onClose={() => setFormOpen(false)} onSaved={onSaved} />
      <ClassSchedulesModal classId={scheduleId} onClose={() => setScheduleId(null)} onChanged={list.reload} />
      <ClassBookingsModal cls={bookingsFor} onClose={() => setBookingsFor(null)} />

      <ConfirmDialog
        open={!!deleting}
        danger
        title="Delete class?"
        message={
          deleting
            ? `“${deleting.name}” and its time slots will be removed. A class with upcoming bookings cannot be deleted, so deactivate it instead (Edit, then untick Active).`
            : ''
        }
        confirmLabel="Delete class"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}