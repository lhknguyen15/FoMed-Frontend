import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Start each navigation at the top, except for explicit section links. */
export default function RouteScrollManager() {
  const { pathname, search, hash, key } = useLocation()

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = previous }
  }, [])

  useLayoutEffect(() => {
    // Ignore CSS smooth scrolling: a new page must not animate from the old offset.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (!hash || hash === '#') return

    let id = hash.slice(1)
    try { id = decodeURIComponent(id) } catch { /* Keep a malformed fragment harmless. */ }
    const scrollToSection = () => {
      const target = document.getElementById(id)
      if (!target) return false
      target.scrollIntoView({ block: 'start', behavior: 'instant' })
      return true
    }
    if (scrollToSection()) return

    // The destination may render after authentication/data finishes loading.
    const observer = new MutationObserver(() => {
      if (scrollToSection()) { observer.disconnect(); window.clearTimeout(timeout) }
    })
    observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
    const timeout = window.setTimeout(() => observer.disconnect(), 8_000)
    return () => { observer.disconnect(); window.clearTimeout(timeout) }
  }, [pathname, search, hash, key])

  return null
}
