import { useState } from 'react'
import toast from 'react-hot-toast'
import { Pencil, Plus, Star, Trash2 } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import IconButton from '../../components/admin/IconButton.jsx'
import PlanFormModal from '../../components/admin/PlanFormModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Button from '../../components/ui/Button.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useFetch from '../../hooks/useFetch.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { deletePlan, listPlans } from '../../services/adminService.js'
import { getErrorMessage } from '../../utils/errors.js'
import { formatCurrency, formatDuration } from '../../utils/format.js'

export default function AdminPlans() {
  usePageTitle('Membership Plans')
  const plans = useFetch(listPlans)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const openForm = (plan) => {
    setEditing(plan)
    setFormOpen(true)
  }

  const onSaved = () => {
    setFormOpen(false)
    plans.retry()
  }

  const confirmDelete = async () => {
    setDeleteBusy(true)
    try {
      await deletePlan(deleting.id)
      toast.success('Plan deleted')
      setDeleting(null)
      plans.retry()
    } catch (error) {
      toast.error(getErrorMessage(error)) // e.g. "This plan has memberships. Deactivate it instead of deleting."
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  const columns = [
    {
      key: 'plan',
      header: 'Plan',
      cell: (p) => (
        <div>
          <p className="flex items-center gap-1.5 font-semibold">
            {p.name}
            {p.isPopular && (
              <>
                <Star size={14} className="fill-current text-warning" aria-hidden="true" />
                <span className="sr-only">Most popular</span>
              </>
            )}
          </p>
          <p className="text-xs capitalize text-muted">{p.planType.replace('_', '-')}</p>
        </div>
      ),
    },
    { key: 'duration', header: 'Duration', cell: (p) => formatDuration(p.durationDays) },
    { key: 'price', header: 'Price', cell: (p) => <span className="font-semibold">{formatCurrency(p.price)}</span> },
    { key: 'features', header: 'Features', cell: (p) => p.features.length },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (p) => (
        <div className="flex justify-end">
          <IconButton icon={Pencil} label={`Edit ${p.name}`} onClick={() => openForm(p)} />
          <IconButton icon={Trash2} label={`Delete ${p.name}`} onClick={() => setDeleting(p)} danger />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Membership plans" subtitle="Plans shown on the website and used when creating memberships.">
        <Button onClick={() => openForm(null)}>
          <Plus size={16} aria-hidden="true" /> Add plan
        </Button>
      </PageHeading>

      {plans.error ? (
        <ErrorState error={plans.error} onRetry={plans.retry} />
      ) : (
        <DataTable
          caption="Membership plans"
          columns={columns}
          rows={plans.data}
          loading={plans.loading}
          emptyTitle="No plans yet"
          emptyText="Add a plan so members can join."
        />
      )}

      <p className="mt-3 text-xs text-muted">
        A plan that already has memberships cannot be deleted. Deactivate it instead (Edit, then untick Active). The price
        of existing memberships never changes when you edit a plan.
      </p>

      <PlanFormModal open={formOpen} plan={editing} onClose={() => setFormOpen(false)} onSaved={onSaved} />

      <ConfirmDialog
        open={!!deleting}
        danger
        title="Delete plan?"
        message={deleting ? `“${deleting.name}” will be removed permanently. This is only possible if no membership uses it.` : ''}
        confirmLabel="Delete plan"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}