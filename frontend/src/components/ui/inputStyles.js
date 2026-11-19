export const inputClasses = (hasError = false) =>
  `h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-fg placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-danger focus:border-danger focus:ring-danger/30'
      : 'border-line focus:border-brand focus:ring-brand/30'
  }`