import { useCallback, useEffect, useState } from 'react'

/**
 * fetcher(params) must be a stable function returning { data, meta }.
 * Returns { data, meta, error, loading, reload }.
 */
export default function useList(fetcher, params) {
  const paramsKey = JSON.stringify(params)
  const [reloadCount, setReloadCount] = useState(0)
  const requestId = `${paramsKey}#${reloadCount}`
  const [result, setResult] = useState({ id: null, data: null, meta: null, error: null })

  useEffect(() => {
    let active = true
    fetcher(JSON.parse(paramsKey))
      .then(({ data, meta }) => {
        if (active) setResult({ id: requestId, data, meta, error: null })
      })
      .catch((error) => {
        if (active) setResult({ id: requestId, data: null, meta: null, error })
      })
    return () => {
      active = false
    }
  }, [fetcher, paramsKey, requestId])

  const loading = result.id !== requestId
  const reload = useCallback(() => setReloadCount((n) => n + 1), [])

  return { data: result.data, meta: result.meta, error: loading ? null : result.error, loading, reload }
}