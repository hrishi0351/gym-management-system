import { useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, Trash2 } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import ContactMessageModal from '../../components/admin/ContactMessageModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Select from '../../components/ui/Select.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { deleteContactMessage, fetchContactMessages } from '../../services/adminService.js'
import { formatDateTime } from '../../utils/adminFormat.js'
import { getErrorMessage } from '../../utils/errors.js'

export default function Messages() {
  usePageTitle('Contact Messages')
  const [search, setSearch] = useState('')
  const [isRead, setIsRead] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const list = useList(fetchContactMessages, { search: debouncedSearch.trim(), isRead, page, limit: 10 })

  const [viewId, setViewId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Opening a message marks it as read on the server, so refresh the list when the dialog closes
  const closeView = () => {
    setViewId(null)
    list.reload()
  }

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await deleteContactMessage(deleting.id)
      toast.success('Message deleted')
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
      key: 'from',
      header: 'From',
      cell: (m) => (
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.isRead ? 'bg-transparent' : 'bg-brand'}`}
          />
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setViewId(m.id)}
              className={`cursor-pointer text-left hover:text-brand ${m.isRead ? 'font-medium' : 'font-bold'}`}
            >
              {m.name}
            </button>
            <p className="text-xs text-muted">{m.email}</p>
            {!m.isRead && <span className="sr-only">Unread</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      cell: (m) => (
        <div className="max-w-md">
          <p className={`line-clamp-1 ${m.isRead ? '' : 'font-semibold'}`}>{m.subject}</p>
          <p className="line-clamp-1 text-xs text-muted">{m.message}</p>
        </div>
      ),
    },
    { key: 'received', header: 'Received', cell: (m) => formatDateTime(m.createdAt) },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (m) => (
        <div className="flex justify-end">
          <IconButton icon={Eye} label={`Open message from ${m.name}`} onClick={() => setViewId(m.id)} />
          <IconButton icon={Trash2} label={`Delete message from ${m.name}`} onClick={() => setDeleting(m)} danger />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading
        title="Contact messages"
        subtitle={
          list.meta
            ? `In this view: ${list.meta.total} ${list.meta.total === 1 ? 'message' : 'messages'}, ${list.meta.unread} unread.`
            : 'Messages sent from the Contact page.'
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by name, email or subject"
          label="Search messages"
        />
        <Select
          aria-label="Filter by read status"
          value={isRead}
          onChange={(event) => {
            setIsRead(event.target.value)
            setPage(1)
          }}
          className="w-44"
        >
          <option value="">All messages</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </Select>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Contact messages"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No messages found"
            emptyText="Messages from the website Contact form appear here."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <ContactMessageModal messageId={viewId} onClose={closeView} />

      <ConfirmDialog
        open={!!deleting}
        danger
        title="Delete message?"
        message={deleting ? `The message “${deleting.subject}” from ${deleting.name} will be removed permanently.` : ''}
        confirmLabel="Delete message"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}