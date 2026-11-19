import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import Boundary from '../../components/portal/Boundary.jsx'
import MembershipCard from '../../components/portal/MembershipCard.jsx'
import TrainerInfoCard from '../../components/portal/TrainerInfoCard.jsx'
import useFetch from '../../hooks/useFetch.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchMyMemberships, fetchMyTrainer } from '../../services/portalService.js'
import { formatDate } from '../../utils/adminFormat.js'
import { formatCurrency } from '../../utils/format.js'

async function loadMembershipPage() {
  const [memberships, trainer] = await Promise.all([fetchMyMemberships(), fetchMyTrainer()])
  return { memberships, trainer }
}

const COLUMNS = [
  {
    key: 'plan',
    header: 'Membership',
    cell: (m) => (
      <div>
        <p className="font-semibold">{m.planName}</p>
        <p className="text-xs text-muted">{m.code}</p>
      </div>
    ),
  },
  { key: 'period', header: 'Period', cell: (m) => `${formatDate(m.startDate)} → ${formatDate(m.expiryDate)}` },
  { key: 'total', header: 'Total', cell: (m) => formatCurrency(m.amountTotal) },
  { key: 'paid', header: 'Paid', cell: (m) => formatCurrency(m.amountPaid) },
  {
    key: 'balance',
    header: 'Balance',
    cell: (m) => <span className={m.balance > 0 ? 'font-semibold text-danger' : ''}>{formatCurrency(m.balance)}</span>,
  },
  { key: 'status', header: 'Status', cell: (m) => <StatusBadge status={m.status} /> },
]

export default function MemberMembership() {
  usePageTitle('My Membership')
  const state = useFetch(loadMembershipPage)

  return (
    <>
      <PageHeading title="My membership" subtitle="Your current plan, its history and your trainer." />

      <Boundary state={state}>
        {({ memberships, trainer }) => (
          <div className="space-y-6">
            {memberships.current ? (
              <MembershipCard membership={memberships.current} />
            ) : (
              <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
                You do not have an active membership right now. Visit the front desk to join or renew.
              </p>
            )}

            <TrainerInfoCard trainer={trainer} />

            <section>
              <h2 className="mb-3 font-display text-2xl font-bold uppercase">Membership history</h2>
              <DataTable
                caption="Your memberships"
                columns={COLUMNS}
                rows={memberships.history}
                emptyTitle="No memberships yet"
                emptyText="Your memberships will appear here once the front desk creates one."
              />
            </section>
          </div>
        )}
      </Boundary>
    </>
  )
}