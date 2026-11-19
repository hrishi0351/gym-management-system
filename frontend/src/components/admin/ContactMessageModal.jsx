import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Spinner from '../ui/Spinner.jsx'
import { ErrorState } from '../StateViews.jsx'
import { buttonClasses } from '../ui/buttonStyles.js'
import useResource from '../../hooks/useResource.js'
import { fetchContactMessage, setContactRead } from '../../services/adminService.js'
import { formatDateTime } from '../../utils/adminFormat.js'
import { getErrorMessage } from '../../utils/errors.js'

function Detail({ id, onClose }) {
  const { data: m, error, loading, reload } = useResource(fetchContactMessage, id)
  const [busy, setBusy] = useState(false)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!m || loading) {
    return (
      <div className="flex justify-center py-12 text-brand">
        <Spinner size={28} label="Loading message" />
      </div>
    )
  }

  const markUnread = async () => {
    setBusy(true)
    try {
      await setContactRead(m.id, false)
      toast.success('Marked as unread')
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setBusy(false)
    }
  }

  // encodeURIComponent keeps a crafted address from adding extra mail headers
  const replyHref = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`

  return (
    <div className="space-y-5">
      <div>
        <p className="font-display text-3xl font-bold uppercase">{m.subject}</p>
        <p className="mt-1 text-sm text-muted">
          From <span className="font-semibold text-fg">{m.name}</span> ({m.email}) · {formatDateTime(m.createdAt)}
        </p>
      </div>

      <p className="whitespace-pre-wrap break-words rounded-xl bg-surface-2 p-4 text-sm">{m.message}</p>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={markUnread} loading={busy}>
          Mark as unread
        </Button>
        <a href={replyHref} className={buttonClasses()}>
          Reply by email
        </a>
      </div>
    </div>
  )
}

export default function ContactMessageModal({ messageId, onClose }) {
  return (
    <Modal open={!!messageId} onClose={onClose} title="Message" size="lg">
      <Detail id={messageId} onClose={onClose} />
    </Modal>
  )
}