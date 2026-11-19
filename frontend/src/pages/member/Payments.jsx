import { useState } from 'react'
import { FileText } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import PaymentReceiptModal from '../../components/admin/PaymentReceiptModal.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchMyPayments } from '../../services/portalService.js'
import { formatDateTime } from '../../utils/adminFormat.js'
import { methodLabel } from '../../utils/adminOptions.js'
import { formatCurrency } from '../../utils/format.js'

export default function MemberPayments() {
  usePageTitle('My Payments')
  const [page, setPage] = useState(1)
  const list = useList(fetchMyPayments, { page, limit: 10 })
  const [receipt, setReceipt] = useState(null)

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
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Payments" subtitle="Every payment recorded against your memberships." />

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Your payments"
            columns={columns}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No payments yet"
            emptyText="Payments are recorded by the front desk and will appear here."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}

      <PaymentReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
    </>
  )
}