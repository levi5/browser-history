import { useState, useCallback, useRef } from 'react'
import type { HistoryItemType } from '../types/history'

const PAGE_SIZE = 20

const sortByRecent = (results: HistoryItemType[]) =>
  results.sort((a, b) => b.lastVisitTime - a.lastVisitTime)

export function useHistory() {
  const [items, setItems] = useState<HistoryItemType[]>([])
  const [endTime, setEndTime] = useState(Date.now())
  const [hasMore, setHasMore] = useState(true)
  const loading = useRef(false)

  const loadMore = useCallback((before?: number) => {
    if (!hasMore || loading.current) return
    loading.current = true

    chrome.history.search(
      { text: '', startTime: 0, endTime: before ?? endTime, maxResults: PAGE_SIZE },
      (results) => {
        const sorted = sortByRecent(results as HistoryItemType[])

        if (sorted.length > 0) {
          setItems(prev => {
            const existing = new Set(prev.map(item => item.url))
            return [...prev, ...sorted.filter(item => !existing.has(item.url))]
          })
          setEndTime(Math.min(...sorted.map(item => item.lastVisitTime)))
          if (sorted.length < PAGE_SIZE) setHasMore(false)
        } else {
          setHasMore(false)
        }

        loading.current = false
      }
    )
  }, [endTime, hasMore])

  const remove = useCallback((url: string) => {
    chrome.history.deleteUrl({ url }, () => {
      setItems(prev => prev.filter(item => item.url !== url))
    })
  }, [])

  const removeBulk = useCallback((urls: string[]) => {
    Promise.all(
      urls.map(url => new Promise<void>(resolve => chrome.history.deleteUrl({ url }, resolve)))
    ).then(() => {
      setItems(prev => prev.filter(item => !urls.includes(item.url)))
    })
  }, [])

  const clear = useCallback(() => {
    chrome.history.deleteAll(() => {
      setItems([])
      setHasMore(false)
      setEndTime(Date.now())
    })
  }, [])

  const reload = useCallback(() => {
    loading.current = false
    const now = Date.now()
    setItems([])
    setEndTime(now)
    setHasMore(true)
    setTimeout(() => {
      chrome.history.search(
        { text: '', startTime: 0, endTime: now, maxResults: PAGE_SIZE },
        (results) => {
          const sorted = sortByRecent(results as HistoryItemType[])
          if (sorted.length > 0) {
            setItems(sorted)
            setEndTime(Math.min(...sorted.map(item => item.lastVisitTime)))
            if (sorted.length < PAGE_SIZE) setHasMore(false)
          } else {
            setHasMore(false)
          }
          loading.current = false
        }
      )
    }, 0)
  }, [])

  return { items, reload, loadMore, remove, removeBulk, clear, hasMore }
}
