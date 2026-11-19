import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Pencil, Plus, Trash2, UserMinus, UserPlus } from 'lucide-react'
import DataTable from '../../components/admin/DataTable.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import MemberFormModal from '../../components/admin/MemberFormModal.jsx'
import AssignTrainerModal from '../../components/admin/AssignTrainerModal.jsx'
import MembershipFormModal from '../../components/admin/MembershipFormModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Button from '../../components/ui/Button.jsx'
import { Skeleton } from '../../components/Skeleton.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useResource from '../../hooks/useResource.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { deleteMember, fetchMember, unassignTrainer } from '../../services/adminService.js'
import { formatDate, fullName } from '../../utils/adminFormat.js'
import { getErrorMessage } from '../../utils/errors.js'
import { formatCurrency, initials } from '../../utils/format.js'

function Card({ title, action, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{children || '–'}</dd>
    </div>
  )
}

const MEMBERSHIP_COLUMNS = [
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
  { key: 'payment', header: 'Payment', cell: (m) => <StatusBadge status={m.paymentStatus} /> },
]

export default function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: member, error, loading, reload } = useResource(fetchMember, id)
  usePageTitle(member ? fullName(member) : 'Member')

  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [membershipOpen, setMembershipOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'delete' | 'unassign' | null
  const [busy, setBusy] = useState(false)

  const back = (
    <Link to="/admin/members" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand">
      <ArrowLeft size={16} aria-hidden="true" /> All members
    </Link>
  )

  if (error) {
    return (
      <>
        {back}
        <ErrorState error={error} onRetry={reload} />
      </>
    )
  }
  if (loading && !member) {
    return (
      <>
        {back}
        <div role="status" aria-label="Loading member" className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </>
    )
  }
  if (!member) return null

  const runConfirmed = async () => {
    setBusy(true)
    try {
      if (confirm === 'delete') {
        await deleteMember(member.id)
        toast.success('Member deleted')
        navigate('/admin/members', { replace: true })
        return
      }
      await unassignTrainer(member.id)
      toast.success('Trainer removed')
      setConfirm(null)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  const trainer = member.trainer

  return (
    <>
      {back}

      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft font-display text-3xl font-extrabold text-brand">
            {initials(member.firstName, member.lastName)}
          </span>
          <div>
            <h1 className="font-display text-4xl font-extrabold uppercase">{fullName(member)}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              {member.memberCode} <StatusBadge status={member.status} />
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={16} aria-hidden="true" /> Edit
          </Button>
          <Button variant="danger" onClick={() => setConfirm('delete')}>
            <Trash2 size={16} aria-hidden="true" /> Delete
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Profile">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">{member.email}</Field>
              <Field label="Phone">{member.phone}</Field>
              <Field label="Gender"><span className="capitalize">{member.gender}</span></Field>
              <Field label="Date of birth">{member.dateOfBirth && formatDate(member.dateOfBirth)}</Field>
              <Field label="Address">
                {[member.address, member.city, member.state, member.postalCode].filter(Boolean).join(', ')}
              </Field>
              <Field label="Joined">{formatDate(member.joinedOn)}</Field>
            </dl>
          </Card>

          <Card title="Health and emergency">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Height">{member.heightCm ? `${member.heightCm} cm` : ''}</Field>
              <Field label="Weight">{member.weightKg ? `${member.weightKg} kg` : ''}</Field>
              <Field label="Emergency contact">{member.emergencyContactName}</Field>
              <Field label="Emergency phone">{member.emergencyContactPhone}</Field>
              <div className="sm:col-span-2">
                <Field label="Health notes">{member.healthNotes}</Field>
              </div>
            </dl>
          </Card>

         <Card
            title="Memberships"
            action={
              <Button size="sm" variant="secondary" onClick={() => setMembershipOpen(true)}>
                <Plus size={15} aria-hidden="true" /> New membership
              </Button>
            }
          >
            <DataTable
              caption="Memberships of this member"
              columns={MEMBERSHIP_COLUMNS}
              rows={member.memberships}
              emptyTitle="No memberships yet"
              emptyText="Use New membership to sell this member a plan."
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Trainer"
            action={
              <Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)}>
                <UserPlus size={15} aria-hidden="true" /> {trainer ? 'Change' : 'Assign'}
              </Button>
            }
          >
            {trainer ? (
              <div>
                <p className="font-semibold">{fullName(trainer)}</p>
                {trainer.specialization && <p className="text-sm text-brand">{trainer.specialization}</p>}
                <p className="mt-1 text-xs text-muted">Assigned on {formatDate(trainer.assignedOn)}</p>
                <Button size="sm" variant="ghost" className="mt-3 -ml-2" onClick={() => setConfirm('unassign')}>
                  <UserMinus size={15} aria-hidden="true" /> Remove trainer
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">No trainer is assigned to this member yet.</p>
            )}
          </Card>
        </div>
      </div>

      <MemberFormModal
        open={editOpen}
        member={member}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false)
          reload()
        }}
      />

      <AssignTrainerModal
        open={assignOpen}
        memberId={member.id}
        currentTrainerId={trainer?.id}
        onClose={() => setAssignOpen(false)}
        onDone={() => {
          setAssignOpen(false)
          reload()
        }}
      />
            <MembershipFormModal
        open={membershipOpen}
        member={member}
        onClose={() => setMembershipOpen(false)}
        onSaved={() => {
          setMembershipOpen(false)
          reload()
        }}
      />

      <ConfirmDialog
        open={!!confirm}
        danger
        title={confirm === 'delete' ? 'Delete member?' : 'Remove trainer?'}
        message={
          confirm === 'delete'
            ? `${fullName(member)} will no longer be able to log in. Payment and membership history is kept. Memberships that are active, pending or frozen must be cancelled first.`
            : `${trainer ? fullName(trainer) : 'The trainer'} will no longer be assigned to ${fullName(member)}.`
        }
        confirmLabel={confirm === 'delete' ? 'Delete member' : 'Remove trainer'}
        loading={busy}
        onConfirm={runConfirmed}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}