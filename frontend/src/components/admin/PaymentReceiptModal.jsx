import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import StatusBadge from './StatusBadge.jsx'
import { formatDateTime } from '../../utils/adminFormat.js'
import { methodLabel } from '../../utils/adminOptions.js'
import { formatCurrency } from '../../utils/format.js'
import { APP_NAME } from '../../utils/constants.js'

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{children || '–'}</dd>
    </div>
  )
}

export default function PaymentReceiptModal({ payment, onClose }) {
  return (
    <Modal open={!!payment} onClose={onClose} title="Receipt" size="sm">
      {payment && (
        <div>
          <p className="text-center text-sm text-muted">{APP_NAME}</p>
          <p className="mt-1 text-center font-display text-4xl font-extrabold text-brand">{formatCurrency(payment.amount)}</p>
          <div className="mt-2 flex justify-center">
            <StatusBadge status={payment.status} />
          </div>

          <dl className="mt-4 divide-y divide-line border-y border-line">
            <Row label="Receipt no.">{payment.receiptNo}</Row>
            <Row label="Date">{formatDateTime(payment.paidAt)}</Row>
            <Row label="Member">
              {payment.memberName} ({payment.memberCode})
            </Row>
            <Row label="Membership">
              {payment.planName} · {payment.membershipCode}
            </Row>
            <Row label="Method">{methodLabel(payment.method)}</Row>
            <Row label="Reference">{payment.transactionRef}</Row>
            <Row label="Notes">{payment.notes}</Row>
          </dl>

          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={onClose} data-autofocus>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}