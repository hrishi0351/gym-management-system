import { useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, Trash2 } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import EnquiryModal from '../../components/admin/EnquiryModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Select from '../../components/ui/Select.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { deleteEnquiry, fetchEnquiries } from '../../services/adminService.js'
import { formatDateTime } from '../../utils/adminFormat.js'
import { getErrorMessage } from '../../utils/errors.js'

export default function Enquiries() {
  usePageTitle('Enquiries')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const list = useList(fetchEnquiries, { search: debouncedSearch.trim(), status, page, limit: 10 })

  const [viewId, setViewId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await deleteEnquiry(deleting.id)
      toast.success('Enquiry deleted')
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
      key: 'who',
      header: 'Contact',
      cell: (e) => (
        <div className="min-w-0">
          <button type="button" onClick={() => setViewId(e.id)} className="cursor-pointer text-left font-semibold hover:text-brand">
            {e.name}
          </button>
          <p className="text-xs text-muted">{e.email}</p>
          <p className="text-xs text-muted">{e.phone || 'No phone'}</p>
        </div>
      ),
    },
    { key: 'plan', header: 'Interested in', cell: (e) => e.planName || <span className="text-muted">Not specified</span> },
    {
      key: 'message',
      header: 'Message',
      cell: (e) => <p className="line-clamp-2 max-w-xs text-muted">{e.message || '–'}</p>,
    },
    { key: 'status', header: 'Status', cell: (e) => <StatusBadge status={e.status} /> },
    { key: 'received', header: 'Received', cell: (e) => formatDateTime(e.createdAt) },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (e) => (
        <div className="flex justify-end">
          <IconButton icon={Eye} label={`Open enquiry from ${e.name}`} onClick={() => setViewId(e.id)} />
          <IconButton icon={Trash2} label={`Delete enquiry from ${e.name}`} onClick={() => setDeleting(e)} danger />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading
        title="Enquiries"
        subtitle="People who asked about a plan or sent a membership request from the website."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by name, email or phone"
          label="Search enquiries"
        />
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setPage(1)
          }}
          className="w-44"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </Select>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Enquiries"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No enquiries found"
            emptyText="New enquiries from the website appear here."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <EnquiryModal
        enquiryId={viewId}
        onClose={() => setViewId(null)}
        onSaved={() => {
          setViewId(null)
          list.reload()
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        danger
        title="Delete enquiry?"
        message={deleting ? `The enquiry from ${deleting.name} will be removed permanently.` : ''}
        confirmLabel="Delete enquiry"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}