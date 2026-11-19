import { useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Plus, Star, Trash2 } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import TrainerFormModal from '../../components/admin/TrainerFormModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Button from '../../components/ui/Button.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { deleteTrainer, fetchTrainers } from '../../services/adminService.js'
import { fullName } from '../../utils/adminFormat.js'
import { getErrorMessage } from '../../utils/errors.js'
import { initials } from '../../utils/format.js'

export default function AdminTrainers() {
  usePageTitle('Trainers')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const list = useList(fetchTrainers, { search: debouncedSearch.trim(), page, limit: 10 })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const openForm = (trainer) => {
    setEditing(trainer)
    setFormOpen(true)
  }

  const onSaved = () => {
    setFormOpen(false)
    list.reload()
  }

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await deleteTrainer(deleting.id)
      toast.success('Trainer deleted')
      setDeleting(null)
      if (list.data?.length === 1 && page > 1) setPage((p) => p - 1)
      else list.reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  const columns = [
    {
      key: 'trainer',
      header: 'Trainer',
      cell: (t) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
            {initials(t.firstName, t.lastName)}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold">
              {fullName(t)}
              {t.isFeatured && (
                <>
                  <Star size={14} className="fill-current text-warning" aria-hidden="true" />
                  <span className="sr-only">Featured</span>
                </>
              )}
            </p>
            <p className="text-xs text-muted">{t.specialization || 'No specialization'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (t) => (
        <div>
          <p>{t.email}</p>
          <p className="text-xs text-muted">{t.phone || '–'}</p>
        </div>
      ),
    },
    {
      key: 'experience',
      header: 'Experience',
      cell: (t) => `${t.experienceYears} ${t.experienceYears === 1 ? 'year' : 'years'}`,
    },
    { key: 'members', header: 'Active members', cell: (t) => t.memberCount },
    { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (t) => (
        <div className="flex justify-end">
          <IconButton icon={Pencil} label={`Edit ${fullName(t)}`} onClick={() => openForm(t)} />
          <IconButton icon={Trash2} label={`Delete ${fullName(t)}`} onClick={() => setDeleting(t)} danger />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Trainers" subtitle="Manage the coaching team shown on your website.">
        <Button onClick={() => openForm(null)}>
          <Plus size={16} aria-hidden="true" /> Add trainer
        </Button>
      </PageHeading>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by name, email or specialization"
          label="Search trainers"
        />
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Trainers"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No trainers found"
            emptyText="Add your first trainer to show them on the website."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <TrainerFormModal open={formOpen} trainer={editing} onClose={() => setFormOpen(false)} onSaved={onSaved} />

      <ConfirmDialog
        open={!!deleting}
        danger
        title="Delete trainer?"
        message={
          deleting
            ? `${fullName(deleting)} will no longer be able to log in. Their member assignments end and their classes become unassigned.`
            : ''
        }
        confirmLabel="Delete trainer"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}