import { Link } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Spinner from '../ui/Spinner.jsx'
import { ErrorState } from '../StateViews.jsx'
import DataTable from './DataTable.jsx'
import StatusBadge from './StatusBadge.jsx'
import useResource from '../../hooks/useResource.js'
import { fetchMembership } from '../../services/adminService.js'
import { formatDate, formatDateTime } from '../../utils/adminFormat.js'
import { methodLabel } from '../../utils/adminOptions.js'
import { formatCurrency } from '../../utils/format.js'

const PAYMENT_COLUMNS = [
  { key: 'receipt', header: 'Receipt', cell: (p) => <span className="font-semibold">{p.receiptNo}</span> },
  { key: 'date', header: 'Date', cell: (p) => formatDateTime(p.paidAt) },
  { key: 'method', header: 'Method', cell: (p) => methodLabel(p.method) },
  { key: 'amount', header: 'Amount', cell: (p) => formatCurrency(p.amount) },
  { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
]

function Item({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  )
}

function Detail({ id, onRecordPayment, onStatus }) {
  const { data: m, error, loading, reload } = useResource(fetchMembership, id)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!m || loading) {
    return (
      <div className="flex justify-center py-12 text-brand">
        <Spinner size={28} label="Loading membership" />
      </div>
    )
  }

  const canPay = m.balance > 0 && m.status !== 'cancelled'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-bold uppercase">{m.planName}</p>
          <p className="text-sm text-muted">{m.code}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={m.status} />
          <StatusBadge status={m.paymentStatus} />
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Item label="Member">
          <Link to={`/admin/members/${m.memberId}`} className="font-semibold text-brand hover:underline">
            {m.memberName}
          </Link>{' '}
          <span className="text-muted">({m.memberCode})</span>
        </Item>
        <Item label="Period">
          {formatDate(m.startDate)} → {formatDate(m.expiryDate)}
        </Item>
        <Item label="Total">{formatCurrency(m.amountTotal)}</Item>
        <Item label="Paid">{formatCurrency(m.amountPaid)}</Item>
        <Item label="Balance">
          <span className={m.balance > 0 ? 'font-semibold text-danger' : ''}>{formatCurrency(m.balance)}</span>
        </Item>
      </dl>

      <div className="flex flex-wrap gap-2">
        {canPay && <Button onClick={() => onRecordPayment(m)}>Record payment</Button>}
        {m.status === 'active' && (
          <Button variant="secondary" onClick={() => onStatus(m, 'frozen')}>
            Freeze
          </Button>
        )}
        {m.status === 'frozen' && (
          <Button variant="secondary" onClick={() => onStatus(m, 'active')}>
            Resume
          </Button>
        )}
        {['pending', 'active', 'frozen'].includes(m.status) && (
          <Button variant="danger" onClick={() => onStatus(m, 'cancelled')}>
            Cancel membership
          </Button>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-display text-xl font-bold uppercase">Payments</h3>
        <DataTable
          caption="Payments for this membership"
          columns={PAYMENT_COLUMNS}
          rows={m.payments}
          emptyTitle="No payments yet"
          emptyText="Record the first payment to activate this membership."
        />
      </div>
    </div>
  )
}

export default function MembershipDetailModal({ membershipId, onClose, onRecordPayment, onStatus }) {
  return (
    <Modal open={!!membershipId} onClose={onClose} title="Membership" size="lg">
      <Detail id={membershipId} onRecordPayment={onRecordPayment} onStatus={onStatus} />
    </Modal>
  )
}