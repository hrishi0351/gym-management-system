import { useCallback, useEffect, useState } from 'react'

/** loader(arg) must be a stable function returning a promise. Returns { data, error, loading, reload }. */
export default function useResource(loader, arg) {
  const [reloadCount, setReloadCount] = useState(0)
  const requestId = `${arg}#${reloadCount}`
  const [result, setResult] = useState({ id: null, arg: null, data: null, error: null })

  useEffect(() => {
    let active = true
    loader(arg)
      .then((data) => {
        if (active) setResult({ id: requestId, arg, data, error: null })
      })
      .catch((error) => {
        if (active) setResult({ id: requestId, arg, data: null, error })
      })
    return () => {
      active = false
    }
  }, [loader, arg, requestId])

  const reload = useCallback(() => setReloadCount((n) => n + 1), [])
  const settled = result.id === requestId

  return {
    data: result.arg === arg ? result.data : null, // keep showing the same record while reloading
    error: settled ? result.error : null,
    loading: !settled,
    reload,
  }
}