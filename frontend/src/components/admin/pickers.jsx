import Picker from './Picker.jsx'
import StatusBadge from './StatusBadge.jsx'
import { fetchMembers, fetchMemberships } from '../../services/adminService.js'
import { fullName } from '../../utils/adminFormat.js'
import { formatCurrency } from '../../utils/format.js'

/** activeOnly = only members with an active account AND an active membership (for check-in) */
export function MemberPicker({ onSelect, activeOnly = false }) {
  return (
    <Picker
      fetcher={fetchMembers}
      extraParams={activeOnly ? { status: 'active', membership: 'active' } : {}}
      renderItem={(m) => (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{fullName(m)}</p>
            <p className="truncate text-xs text-muted">
              {m.memberCode} · {m.email}
            </p>
          </div>
          {m.membership ? (
            <StatusBadge status={m.membership.status} />
          ) : (
            <span className="shrink-0 text-xs text-muted">No membership</span>
          )}
        </div>
      )}
      onSelect={onSelect}
      placeholder="Search by name, email, phone or member code"
      label="Search members"
      emptyText={activeOnly ? 'No member with an active membership matches your search.' : 'No members found.'}
    />
  )
}

/** Lists memberships that can still receive a payment (not cancelled, balance due). */
export function MembershipPicker({ onSelect }) {
  return (
    <Picker
      fetcher={fetchMemberships}
      filter={(m) => m.status !== 'cancelled' && m.balance > 0}
      renderItem={(m) => (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{m.memberName}</p>
            <p className="truncate text-xs text-muted">
              {m.planName} · {m.code} · {m.memberCode}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-danger">Due {formatCurrency(m.balance)}</span>
        </div>
      )}
      onSelect={onSelect}
      placeholder="Search by member name, member code or membership code"
      label="Search memberships"
      emptyText="No memberships with a balance due match your search."
    />
  )
}