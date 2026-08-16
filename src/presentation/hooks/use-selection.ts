import { useState, useCallback } from 'react'
import type { HistoryItemType } from '../types/history'

export function useSelection(visibleItems: HistoryItemType[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [active, setActive] = useState(false)

  const toggle = useCallback((url: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(url) ? next.delete(url) : next.add(url)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected(prev =>
      prev.size === visibleItems.length
        ? new Set()
        : new Set(visibleItems.map(item => item.url))
    )
  }, [visibleItems])

  const clear = useCallback(() => setSelected(new Set()), [])

  const enable = useCallback(() => setActive(true), [])

  const disable = useCallback(() => {
    setActive(false)
    setSelected(new Set())
  }, [])

  return { selected, active, toggle, toggleAll, clear, enable, disable }
}
