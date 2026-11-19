import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Textarea from '../ui/Textarea.jsx'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import { updateTrainerClass } from '../../services/portalService.js'
import { applyServerErrors, getErrorMessage } from '../../utils/errors.js'

function EditForm({ cls, onSaved, onCancel }) {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { description: cls.description ?? '', location: cls.location ?? '' } })

  const onSubmit = async (v) => {
    setFormError('')
    try {
      await updateTrainerClass(cls.id, { description: v.description.trim(), location: v.location.trim() })
      toast.success('Class updated')
      onSaved()
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert>{formError}</FormAlert>
      <p className="text-sm text-muted">
        <span className="font-semibold text-fg">{cls.name}</span>. To change the name, capacity, level or trainer, please
        ask the admin.
      </p>
      <Textarea
        label="Description"
        rows={5}
        hint="Shown to members on the website and when they book."
        error={errors.description?.message}
        {...register('description', { maxLength: { value: 2000, message: 'Keep it under 2000 characters' } })}
      />
      <Input
        label="Location"
        error={errors.location?.message}
        {...register('location', { maxLength: { value: 100, message: 'Keep it under 100 characters' } })}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save changes
        </Button>
      </div>
    </form>
  )
}

export default function TrainerClassEditModal({ cls, onClose, onSaved }) {
  return (
    <Modal open={!!cls} onClose={onClose} title="Edit class details">
      {cls && <EditForm key={cls.id} cls={cls} onSaved={onSaved} onCancel={onClose} />}
    </Modal>
  )
}