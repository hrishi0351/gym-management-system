import { useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, Plus, Wallet } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import MembershipFormModal from '../../components/admin/MembershipFormModal.jsx'
import MembershipDetailModal from '../../components/admin/MembershipDetailModal.jsx'
import RecordPaymentModal from '../../components/admin/RecordPaymentModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Select from '../../components/ui/Select.jsx'
import Button from '../../components/ui/Button.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchMemberships, setMembershipStatus } from '../../services/adminService.js'
import { formatDate } from '../../utils/adminFormat.js'
import { getErrorMessage } from '../../utils/errors.js'
import { formatCurrency } from '../../utils/format.js'

function statusCopy(status, name) {
  if (status === 'frozen') {
    return {
      title: 'Freeze membership?',
      confirmLabel: 'Freeze',
      danger: false,
      message: `${name} will not be able to check in or book classes while the membership is frozen. The expiry date does not change.`,
    }
  }
  if (status === 'active') {
    return {
      title: 'Resume membership?',
      confirmLabel: 'Resume',
      danger: false,
      message: `${name} will be able to check in and book classes again.`,
    }
  }
  return {
    title: 'Cancel membership?',
    confirmLabel: 'Cancel membership',
    danger: true,
    message: `This cannot be undone. Payments already recorded stay on the record. If money is returned to ${name}, refund those payments from the Payments page.`,
  }
}

export default function Memberships() {
  usePageTitle('Memberships')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const list = useList(fetchMemberships, { search: debouncedSearch.trim(), status, paymentStatus, page, limit: 10 })

  const [createOpen, setCreateOpen] = useState(false)
  const [viewId, setViewId] = useState(null)
  const [payFor, setPayFor] = useState(null) // { membership, fromDetail }
  const [statusAction, setStatusAction] = useState(null) // { membership, status }
  const [statusBusy, setStatusBusy] = useState(false)

  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  // ---- payment flow ----
  const closePay = (saved) => {
    const current = payFor
    setPayFor(null)
    if (saved) list.reload()
    if (current?.fromDetail) setViewId(current.membership.id) // back to the detail view
  }

  // ---- status flow ----
  const copy = statusAction ? statusCopy(statusAction.status, statusAction.membership.memberName) : null

  const dismissStatus = () => {
    const current = statusAction
    setStatusAction(null)
    if (current) setViewId(current.membership.id)
  }

  const confirmStatus = async () => {
    setStatusBusy(true)
    try {
      await setMembershipStatus(statusAction.membership.id, statusAction.status)
      toast.success('Membership updated')
      list.reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setStatusBusy(false)
      dismissStatus()
    }
  }

  const columns = [
    {
      key: 'membership',
      header: 'Membership',
      cell: (m) => (
        <div>
          <button
            type="button"
            onClick={() => setViewId(m.id)}
            className="cursor-pointer text-left font-semibold hover:text-brand"
          >
            {m.planName}
          </button>
          <p className="text-xs text-muted">{m.code}</p>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Member',
      cell: (m) => (
        <div>
          <p>{m.memberName}</p>
          <p className="text-xs text-muted">{m.memberCode}</p>
        </div>
      ),
    },
    { key: 'period', header: 'Period', cell: (m) => `${formatDate(m.startDate)} → ${formatDate(m.expiryDate)}` },
    {
      key: 'money',
      header: 'Paid / Total',
      cell: (m) => (
        <div>
          <p>
            {formatCurrency(m.amountPaid)} <span className="text-muted">/ {formatCurrency(m.amountTotal)}</span>
          </p>
          {m.balance > 0 && <p className="text-xs font-semibold text-danger">Due {formatCurrency(m.balance)}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (m) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={m.status} />
          <StatusBadge status={m.paymentStatus} />
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (m) => (
        <div className="flex justify-end">
          <IconButton icon={Eye} label={`View membership ${m.code}`} onClick={() => setViewId(m.id)} />
          {m.balance > 0 && m.status !== 'cancelled' && (
            <IconButton
              icon={Wallet}
              label={`Record payment for ${m.code}`}
              onClick={() => setPayFor({ membership: m, fromDetail: false })}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Memberships" subtitle="Plans sold to members, with payment status and balance.">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} aria-hidden="true" /> New membership
        </Button>
      </PageHeading>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by member name, member code or membership code"
          label="Search memberships"
        />
        <Select aria-label="Filter by status" value={status} onChange={changeFilter(setStatus)} className="w-44">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="frozen">Frozen</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select aria-label="Filter by payment status" value={paymentStatus} onChange={changeFilter(setPaymentStatus)} className="w-44">
          <option value="">All payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </Select>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Memberships"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No memberships found"
            emptyText="Try different filters, or create the first membership."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <MembershipFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(saved) => {
          setCreateOpen(false)
          list.reload()
          setViewId(saved.id)
        }}
      />

      <MembershipDetailModal
        membershipId={viewId}
        onClose={() => setViewId(null)}
        onRecordPayment={(m) => {
          setViewId(null)
          setPayFor({ membership: m, fromDetail: true })
        }}
        onStatus={(m, next) => {
          setViewId(null)
          setStatusAction({ membership: m, status: next })
        }}
      />

      <RecordPaymentModal
        open={!!payFor}
        membership={payFor?.membership}
        onClose={() => closePay(false)}
        onSaved={() => closePay(true)}
      />

      <ConfirmDialog
        open={!!statusAction}
        danger={copy?.danger}
        title={copy?.title ?? ''}
        message={copy?.message ?? ''}
        confirmLabel={copy?.confirmLabel}
        loading={statusBusy}
        onConfirm={confirmStatus}
        onCancel={dismissStatus}
      />
    </>
  )
}