import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import MemberFormModal from '../../components/admin/MemberFormModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Select from '../../components/ui/Select.jsx'
import Button from '../../components/ui/Button.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { deleteMember, fetchMember, fetchMembers } from '../../services/adminService.js'
import { formatDate, fullName } from '../../utils/adminFormat.js'
import { getErrorMessage } from '../../utils/errors.js'
import { initials } from '../../utils/format.js'

export default function Members() {
  usePageTitle('Members')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [membership, setMembership] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const list = useList(fetchMembers, { search: debouncedSearch.trim(), status, membership, page, limit: 10 })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [openingId, setOpeningId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  // The list rows do not carry every profile field, so load the full record first
  const openEdit = async (row) => {
    setOpeningId(row.id)
    try {
      setEditing(await fetchMember(row.id))
      setFormOpen(true)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setOpeningId(null)
    }
  }

  const onSaved = () => {
    setFormOpen(false)
    list.reload()
  }

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await deleteMember(deleting.id)
      toast.success('Member deleted')
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

  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const columns = [
    {
      key: 'member',
      header: 'Member',
      cell: (m) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
            {initials(m.firstName, m.lastName)}
          </span>
          <div className="min-w-0">
            <Link to={`/admin/members/${m.id}`} className="font-semibold hover:text-brand">
              {fullName(m)}
            </Link>
            <p className="text-xs text-muted">{m.memberCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (m) => (
        <div>
          <p>{m.email}</p>
          <p className="text-xs text-muted">{m.phone || '–'}</p>
        </div>
      ),
    },
    {
      key: 'membership',
      header: 'Membership',
      cell: (m) =>
        m.membership ? (
          <div className="space-y-1">
            <p>{m.membership.planName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={m.membership.status} />
              <span className="text-xs text-muted">to {formatDate(m.membership.expiryDate)}</span>
            </div>
          </div>
        ) : (
          <span className="text-muted">No membership</span>
        ),
    },
    { key: 'account', header: 'Account', cell: (m) => <StatusBadge status={m.status} /> },
    { key: 'joined', header: 'Joined', cell: (m) => formatDate(m.joinedOn) },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (m) => (
        <div className="flex justify-end">
          <IconButton icon={Eye} label={`View ${fullName(m)}`} to={`/admin/members/${m.id}`} />
          <IconButton icon={Pencil} label={`Edit ${fullName(m)}`} onClick={() => openEdit(m)} disabled={openingId === m.id} />
          <IconButton icon={Trash2} label={`Delete ${fullName(m)}`} onClick={() => setDeleting(m)} danger />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Members" subtitle="Search, add and manage gym members.">
        <Button onClick={openCreate}>
          <Plus size={16} aria-hidden="true" /> Add member
        </Button>
      </PageHeading>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by name, email, phone or member code"
          label="Search members"
        />
        <Select aria-label="Filter by account status" value={status} onChange={changeFilter(setStatus)} className="w-44">
          <option value="">All accounts</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </Select>
        <Select aria-label="Filter by membership" value={membership} onChange={changeFilter(setMembership)} className="w-48">
          <option value="">All memberships</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
          <option value="frozen">Frozen</option>
          <option value="none">No membership</option>
        </Select>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Members"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No members found"
            emptyText="Try a different search or add your first member."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <MemberFormModal open={formOpen} member={editing} onClose={() => setFormOpen(false)} onSaved={onSaved} />

      <ConfirmDialog
        open={!!deleting}
        danger
        title="Delete member?"
        message={
          deleting
            ? `${fullName(deleting)} will no longer be able to log in. Payment and membership history is kept. Members with an active, pending or frozen membership cannot be deleted until it is cancelled.`
            : ''
        }
        confirmLabel="Delete member"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}