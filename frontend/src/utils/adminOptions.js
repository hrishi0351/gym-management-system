export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'online', label: 'Online' },
  { value: 'other', label: 'Other' },
]

export const methodLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value

export const DIFFICULTY_OPTIONS = [
  { value: 'all_levels', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]