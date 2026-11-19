import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

export default function SmartImage({ src, alt, className = '', fallback }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-brand-soft to-surface-2 text-brand ${className}`}
      >
        {fallback || <ImageIcon size={36} aria-hidden="true" />}
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} className={className} />
}