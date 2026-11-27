import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// How often to reload, so changes made elsewhere show up: an approval in the admin panel,
// a landlord's answer in another browser, a new request for the landlord.
export const RECHECK_MS = 60 * 1000

// Something loaded from the API while `key` is set (e.g. the signed-in boarder's id): at
// first, when the tab regains focus or becomes visible, and every minute.
// - Answers for an older key (someone who has since signed out) are dropped.
// - A failed reload keeps what was there; identical answers don't re-render.
// fetcher() resolves to { ok, data } or { ok: false, error }. Returns
// { ready, error, data, reload, mutate }; mutate(recipe) changes the data right after a
// write, until the next load.
export default function usePolled(key, fetcher) {
  const [state, setState] = useState({ key: null, ready: false, error: null, data: null })
  const keyRef = useRef(key)
  useEffect(() => {
    keyRef.current = key
  }, [key])

  const reload = useCallback(async () => {
    const current = keyRef.current
    if (!current) return
    const result = await fetcher()
    if (keyRef.current !== current) return
    setState((previous) => {
      const base = previous.key === current ? previous : { key: current, ready: false, error: null, data: null }
      if (!result.ok) return { ...base, ready: true, error: base.data ? null : result.error }
      if (base.ready && JSON.stringify(base.data) === JSON.stringify(result.data)) return base.error ? { ...base, error: null } : base
      return { key: current, ready: true, error: null, data: result.data }
    })
  }, [fetcher])

  useEffect(() => {
    if (!key) return undefined
    const onVisible = () => document.visibilityState === 'visible' && reload()
    const firstLoad = setTimeout(reload, 0)
    const timer = setInterval(reload, RECHECK_MS)
    window.addEventListener('focus', reload)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(firstLoad)
      clearInterval(timer)
      window.removeEventListener('focus', reload)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [key, reload])

  const mutate = useCallback(
    (recipe) => setState((previous) => (previous.key === keyRef.current && previous.data ? { ...previous, data: recipe(previous.data) } : previous)),
    [],
  )

  const current = Boolean(key) && state.key === key
  const ready = !key || (current && state.ready)
  const error = current ? state.error : null
  const data = current ? state.data : null
  return useMemo(() => ({ ready, error, data, reload, mutate }), [ready, error, data, reload, mutate])
}
