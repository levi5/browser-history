import { useState, useCallback, useRef } from 'react'
import type { HistoryItemType } from '../types/history'

const PAGE_SIZE = 20

export function useHistory() {
  const [historyItems, setHistoryItems] = useState<HistoryItemType[]>([])
  const [lastTimestamp, setLastTimestamp] = useState(Date.now())
  const [hasMore, setHasMore] = useState(true)
  const loadingRef = useRef(false)

  const loadMore = useCallback((endTime?: number) => {
    if (!hasMore || loadingRef.current) return
    loadingRef.current = true

    const searchEndTime = endTime ?? lastTimestamp

    chrome.history.search(
      {
        text: '',
        startTime: 0,
        endTime: searchEndTime,
        maxResults: PAGE_SIZE,
      },
      (results) => {
        const items = (results as HistoryItemType[])
          .sort((a, b) => b.lastVisitTime - a.lastVisitTime) // mais recentes primeiro

        if (items.length > 0) {
          setHistoryItems(prev => {
            const existingUrls = new Set(prev.map(i => i.url))
            const newItems = items.filter(i => !existingUrls.has(i.url))
            return [...prev, ...newItems]
          })

          const oldest = Math.min(...items.map(i => i.lastVisitTime))
          setLastTimestamp(oldest)

          if (items.length < PAGE_SIZE) setHasMore(false)
        } else {
          setHasMore(false)
        }

        loadingRef.current = false
      }
    )
  }, [lastTimestamp, hasMore])

  const removeItem = useCallback((url: string) => {
    chrome.history.deleteUrl({ url }, () => {
      setHistoryItems(prev => prev.filter(item => item.url !== url))
    })
  }, [])

  const clearAll = useCallback(() => {
    chrome.history.deleteAll(() => {
      setHistoryItems([])
      setHasMore(false)
      setLastTimestamp(Date.now())
    })
  }, [])

  const loadHistoryAll = useCallback(() => {
    const endTime = Date.now()
    setHistoryItems([])
    setLastTimestamp(endTime)
    setHasMore(true)
    loadMore(endTime)
  }, [loadMore])

  return { historyItems, loadHistoryAll, loadMore, removeItem, clearAll, hasMore }
}
