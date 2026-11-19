import { useState } from 'react'
import { Eye } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import TrainerMemberModal from '../../components/portal/TrainerMemberModal.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchTrainerMembers } from '../../services/portalService.js'
import { formatDate, fullName } from '../../utils/adminFormat.js'
import { initials } from '../../utils/format.js'

export default function TrainerMembers() {
  usePageTitle('My Members')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const list = useList(fetchTrainerMembers, { search: debouncedSearch.trim(), page, limit: 10 })
  const [viewId, setViewId] = useState(null)

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
            <button type="button" onClick={() => setViewId(m.id)} className="cursor-pointer text-left font-semibold hover:text-brand">
              {fullName(m)}
            </button>
            <p className="text-xs text-muted">{m.memberCode}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', cell: (m) => m.phone || '–' },
    { key: 'assigned', header: 'Assigned on', cell: (m) => formatDate(m.assignedOn) },
    {
      key: 'membership',
      header: 'Membership',
      cell: (m) =>
        m.membershipStatus ? (
          <div className="space-y-1">
            <StatusBadge status={m.membershipStatus} />
            <p className="text-xs text-muted">to {formatDate(m.expiryDate)}</p>
          </div>
        ) : (
          <span className="text-muted">No membership</span>
        ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (m) => (
        <div className="flex justify-end">
          <IconButton icon={Eye} label={`View ${fullName(m)}`} onClick={() => setViewId(m.id)} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="My members" subtitle="Members assigned to you. You see only the details needed for coaching." />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by name or member code"
          label="Search members"
        />
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Members assigned to you"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No members assigned"
            emptyText="When the front desk assigns members to you, they will appear here."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <TrainerMemberModal memberId={viewId} onClose={() => setViewId(null)} />
    </>
  )
}