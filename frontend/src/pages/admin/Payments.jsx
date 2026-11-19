import { useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, Plus, RotateCcw } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import RecordPaymentModal from '../../components/admin/RecordPaymentModal.jsx'
import PaymentReceiptModal from '../../components/admin/PaymentReceiptModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Button from '../../components/ui/Button.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchPayments, refundPayment } from '../../services/adminService.js'
import { formatDateTime } from '../../utils/adminFormat.js'
import { PAYMENT_METHODS, methodLabel } from '../../utils/adminOptions.js'
import { getErrorMessage } from '../../utils/errors.js'
import { formatCurrency } from '../../utils/format.js'

export default function Payments() {
  usePageTitle('Payments')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const list = useList(fetchPayments, { search: debouncedSearch.trim(), status, method, from, to, page, limit: 10 })

  const [recordOpen, setRecordOpen] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [refunding, setRefunding] = useState(null)
  const [refundBusy, setRefundBusy] = useState(false)

  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const confirmRefund = async () => {
    setRefundBusy(true)
    try {
      await refundPayment(refunding.id)
      toast.success('Payment marked as refunded')
      list.reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setRefundBusy(false)
      setRefunding(null)
    }
  }

  const columns = [
    {
      key: 'receipt',
      header: 'Receipt',
      cell: (p) => (
        <div>
          <button type="button" onClick={() => setReceipt(p)} className="cursor-pointer text-left font-semibold hover:text-brand">
            {p.receiptNo}
          </button>
          <p className="text-xs text-muted">{formatDateTime(p.paidAt)}</p>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Member',
      cell: (p) => (
        <div>
          <p>{p.memberName}</p>
          <p className="text-xs text-muted">{p.memberCode}</p>
        </div>
      ),
    },
    {
      key: 'membership',
      header: 'Membership',
      cell: (p) => (
        <div>
          <p>{p.planName}</p>
          <p className="text-xs text-muted">{p.membershipCode}</p>
        </div>
      ),
    },
    { key: 'method', header: 'Method', cell: (p) => methodLabel(p.method) },
    { key: 'amount', header: 'Amount', cell: (p) => <span className="font-semibold">{formatCurrency(p.amount)}</span> },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (p) => (
        <div className="flex justify-end">
          <IconButton icon={FileText} label={`View receipt ${p.receiptNo}`} onClick={() => setReceipt(p)} />
          {p.status === 'completed' && (
            <IconButton icon={RotateCcw} label={`Refund ${p.receiptNo}`} onClick={() => setRefunding(p)} danger />
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Payments" subtitle="Every payment recorded against a membership.">
        <Button onClick={() => setRecordOpen(true)}>
          <Plus size={16} aria-hidden="true" /> Record payment
        </Button>
      </PageHeading>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search by receipt, member name or member code"
          label="Search payments"
        />
        <Select aria-label="Filter by status" value={status} onChange={changeFilter(setStatus)} className="w-40">
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </Select>
        <Select aria-label="Filter by method" value={method} onChange={changeFilter(setMethod)} className="w-40">
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
        <Input label="From" type="date" value={from} max={to || undefined} onChange={changeFilter(setFrom)} className="w-40" />
        <Input label="To" type="date" value={to} min={from || undefined} onChange={changeFilter(setTo)} className="w-40" />
      </div>

      {list.meta && (
        <p className="mb-3 text-sm text-muted">
          Completed payments in this view:{' '}
          <span className="font-semibold text-success">{formatCurrency(list.meta.completedTotal)}</span>
        </p>
      )}

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Payments"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No payments found"
            emptyText="Try different filters, or record a payment."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <RecordPaymentModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onSaved={() => {
          setRecordOpen(false)
          list.reload()
        }}
      />

      <PaymentReceiptModal payment={receipt} onClose={() => setReceipt(null)} />

      <ConfirmDialog
        open={!!refunding}
        danger
        title="Refund payment?"
        message={
          refunding
            ? `${refunding.receiptNo} (${formatCurrency(refunding.amount)}) will be marked as refunded and the membership's payment status is recalculated. This does not move any money, so return it to ${refunding.memberName} yourself. It cannot be undone.`
            : ''
        }
        confirmLabel="Refund payment"
        loading={refundBusy}
        onConfirm={confirmRefund}
        onCancel={() => setRefunding(null)}
      />
    </>
  )
}