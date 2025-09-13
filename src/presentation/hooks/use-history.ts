import { useState, useCallback } from "react"
import type { HistoryItemType } from "../types/history"

const PAGE_SIZE = 20
export function useHistory() {
  const [allItems, setAllItems] = useState<HistoryItemType[]>([])
  const [historyItems, setHistoryItems] = useState<HistoryItemType[]>([])
  const [page, setPage] = useState(1)

  const loadHistoryAll = useCallback(() => {
    chrome.history.search({ text: "", maxResults: 1000 }, (results) => {
      const items = results as HistoryItemType[]
      setAllItems(items)
      setHistoryItems(items.slice(0, PAGE_SIZE))
      setPage(1)
    })
  }, [])

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    const start = page * PAGE_SIZE
    const end = nextPage * PAGE_SIZE
    const moreItems = allItems.slice(start, end)
    if (moreItems.length > 0) {
      setHistoryItems(prev => [...prev, ...moreItems])
      setPage(nextPage)
    }
  }, [allItems, page])

  const removeItem = useCallback((url: string) => {
    chrome.history.deleteUrl({ url }, () => {
      setAllItems(prev => prev.filter(item => item.url !== url))
      setHistoryItems(prev => prev.filter(item => item.url !== url))
    })
  }, [])

  const clearAll = useCallback(() => {
    chrome.history.deleteAll(() => {
      setAllItems([])
      setHistoryItems([])
    })
  }, [])

  return { historyItems, loadHistoryAll, loadMore, removeItem, clearAll }
}