import { useCallback, useEffect, useState } from 'react'

/**
 * Loads data once and exposes { data, error, loading, retry }.
 * `fetcher` must be a stable function (define it outside components, like publicService does).
 */
export default function useFetch(fetcher) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    fetcher()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        if (active) setState({ data: null, error, loading: false })
      })
    return () => {
      active = false
    }
  }, [fetcher, attempt])

  const retry = useCallback(() => {
    setState({ data: null, error: null, loading: true })
    setAttempt((n) => n + 1)
  }, [])

  return { ...state, retry }
}