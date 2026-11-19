import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import PageHeading from '../../components/admin/PageHeading.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import { ErrorState } from '../../components/StateViews.jsx'
import useList from '../../hooks/useList.js'
import usePageTitle from '../../hooks/usePageTitle.js'
import { fetchActivityLogs } from '../../services/adminService.js'
import { formatDateTime } from '../../utils/adminFormat.js'

const ACTIONS = [
  'ADMIN_PROFILE_UPDATED', 'CLASS_CREATED', 'CLASS_DELETED', 'CLASS_SCHEDULE_ADDED', 'CLASS_SCHEDULE_REMOVED',
  'CLASS_UPDATED', 'CONTACT_MESSAGE_DELETED', 'ENQUIRY_DELETED', 'ENQUIRY_UPDATED', 'LOGIN_FAILED', 'LOGIN_SUCCESS',
  'MEMBER_CREATED', 'MEMBER_DELETED', 'MEMBER_UPDATED', 'MEMBERSHIP_CREATED', 'MEMBERSHIP_STATUS_CHANGED',
  'PASSWORD_CHANGED', 'PASSWORD_RESET_COMPLETED', 'PASSWORD_RESET_REQUESTED', 'PAYMENT_RECORDED',
  'PAYMENT_STATUS_CHANGED', 'PLAN_CREATED', 'PLAN_DELETED', 'PLAN_UPDATED', 'REFRESH_TOKEN_REUSE_DETECTED',
  'TRAINER_ASSIGNED', 'TRAINER_CREATED', 'TRAINER_DELETED', 'TRAINER_UNASSIGNED', 'TRAINER_UPDATED', 'USER_REGISTERED',
]

const humanize = (action) => action.toLowerCase().replace(/_/g, ' ')

function actionClass(action) {
  if (/FAILED|REUSE|DELETED/.test(action)) return 'bg-danger-soft text-danger'
  if (/CREATED|REGISTERED|RECORDED|ASSIGNED|ADDED|SUCCESS/.test(action)) return 'bg-success-soft text-success'
  return 'bg-brand-soft text-brand'
}

const COLUMNS = [
  { key: 'time', header: 'When', cell: (l) => <span className="whitespace-nowrap">{formatDateTime(l.createdAt)}</span> },
  {
    key: 'user',
    header: 'Who',
    cell: (l) =>
      l.user ? (
        <div>
          <p className="font-semibold">{l.user.name}</p>
          <p className="text-xs text-muted">{l.user.email}</p>
        </div>
      ) : (
        <span className="text-muted">System</span>
      ),
  },
  {
    key: 'action',
    header: 'Action',
    cell: (l) => (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${actionClass(l.action)}`}>
        {humanize(l.action)}
      </span>
    ),
  },
  {
    key: 'entity',
    header: 'Record',
    cell: (l) =>
      l.entityType ? (
        <span className="capitalize">
          {l.entityType.replace(/_/g, ' ')}
          {l.entityId != null && <span className="text-muted"> #{l.entityId}</span>}
        </span>
      ) : (
        '–'
      ),
  },
  {
    key: 'details',
    header: 'Details',
    cell: (l) =>
      l.details ? (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-brand">View</summary>
          <pre className="mt-2 max-w-xs overflow-x-auto rounded-lg bg-surface-2 p-2 text-xs">{JSON.stringify(l.details, null, 2)}</pre>
        </details>
      ) : (
        '–'
      ),
  },
  { key: 'ip', header: 'IP address', cell: (l) => l.ipAddress || '–' },
]

export default function ActivityLogs() {
  usePageTitle('Activity Log')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const list = useList(fetchActivityLogs, { action, from, to, page, limit: 20 })

  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  return (
    <>
      <PageHeading title="Activity log" subtitle="An audit trail of important actions taken in the admin panel." />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select label="Action" value={action} onChange={changeFilter(setAction)} className="w-64">
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a} className="capitalize">
              {humanize(a)}
            </option>
          ))}
        </Select>
        <Input label="From" type="date" value={from} max={to || undefined} onChange={changeFilter(setFrom)} className="w-44" />
        <Input label="To" type="date" value={to} min={from || undefined} onChange={changeFilter(setTo)} className="w-44" />
      </div>

      <p className="mb-4 flex items-start gap-2 rounded-xl border border-line bg-surface p-3 text-sm text-muted">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
        <span>
          Watch for <strong className="text-fg">refresh token reuse detected</strong> (a login token may have been stolen) and many{' '}
          <strong className="text-fg">login failed</strong> entries in a row. Passwords and tokens are never stored in this log.
        </span>
      </p>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable
            caption="Activity log"
            columns={COLUMNS}
            rows={list.data}
            loading={list.loading}
            emptyTitle="No activity found"
            emptyText="Try a different action or date range."
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </>
      )}
    </>
  )
}