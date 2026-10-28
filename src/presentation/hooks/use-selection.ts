import { useCallback, useState } from "react"

export function useSelection() {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(
    () => new Set()
  )
  const [active, setActive] = useState(false)

  const toggle = useCallback((url: string) => {
    setSelectedUrls(currentUrls => {
      const nextUrls = new Set(currentUrls)

      if (nextUrls.has(url)) {
        nextUrls.delete(url)
      } else {
        nextUrls.add(url)
      }

      return nextUrls
    })
  }, [])

  const selectAll = useCallback((urls: string[]) => {
    setSelectedUrls(new Set(urls))
  }, [])

  const clear = useCallback(() => setSelectedUrls(new Set()), [])

  const enable = useCallback(() => setActive(true), [])

  const disable = useCallback(() => {
    setActive(false)
    setSelectedUrls(new Set())
  }, [])

  return {
    selectedUrls,
    active,
    toggle,
    selectAll,
    clear,
    enable,
    disable,
  }
}
