import { useEffect, useRef, useState } from 'react'

export function useApiQuery<T>(key: string, query: () => Promise<T>) {
  const queryRef = useRef(query)
  queryRef.current = query
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    queryRef.current()
      .then((value) => { if (active) setData(value) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [key, revision])

  return { data, error, loading, refresh: () => setRevision((value) => value + 1) }
}
