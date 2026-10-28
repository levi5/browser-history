import { useCallback, useEffect, useRef, useState } from "react"

import type { HistoryItemType } from "../types/history"
import type { PeriodFilter, SortOrder } from "../types/filters"
import {
  deleteAllHistory,
  deleteHistoryUrls,
  fetchAllHistoryItems,
  fetchHistoryPage,
  restoreHistoryUrls,
} from "../services/history"
import { applyHistoryFilters, periodStartTime } from "../utils/history"
import { t } from "../i18n"

const SEARCH_DEBOUNCE_MS = 250
const MAX_EMPTY_PAGE_RETRIES = 5

export interface UseHistoryOptions {
  query: string
  period: PeriodFilter
  domain: string
  sort: SortOrder
  pageSize: number
}

interface FullHistoryCache {
  key: string
  items: HistoryItemType[]
}

function requiresFullLoad(domain: string, sortOrder: SortOrder): boolean {
  return domain.trim().length > 0 || sortOrder !== "recent"
}

function fullCacheKey(query: string, period: PeriodFilter): string {
  return `${query}|${period}`
}

function takeUnseenItems(
  items: HistoryItemType[],
  seenUrls: Set<string>
): HistoryItemType[] {
  const unseenItems: HistoryItemType[] = []

  for (const item of items) {
    if (!seenUrls.has(item.url)) {
      seenUrls.add(item.url)
      unseenItems.push(item)
    }
  }

  return unseenItems
}

export function useHistory({
  query,
  period,
  domain,
  sort,
  pageSize,
}: UseHistoryOptions) {
  const [items, setItems] = useState<HistoryItemType[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState(() => query.trim())
  const [debouncedDomain, setDebouncedDomain] = useState(() => domain.trim())

  const cursorRef = useRef(Date.now())
  const hasMoreRef = useRef(true)
  const loadingRef = useRef(true)
  const allLoadedRef = useRef(false)
  const seenUrlsRef = useRef(new Set<string>())
  const requestIdRef = useRef(0)
  const itemsRef = useRef<HistoryItemType[]>([])
  const fullCacheRef = useRef<FullHistoryCache | null>(null)
  const filtersRef = useRef<UseHistoryOptions>({
    query: debouncedQuery,
    period,
    domain: debouncedDomain,
    sort,
    pageSize,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedDomain(domain.trim())
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [domain])

  useEffect(() => {
    filtersRef.current = {
      query: debouncedQuery,
      period,
      domain: debouncedDomain,
      sort,
      pageSize,
    }
  }, [debouncedQuery, debouncedDomain, period, sort, pageSize])

  const commitItems = useCallback((nextItems: HistoryItemType[]) => {
    itemsRef.current = nextItems
    setItems(nextItems)
  }, [])

  const markAllLoaded = useCallback(() => {
    allLoadedRef.current = true
    hasMoreRef.current = false
    setHasMore(false)
  }, [])

  const startFrom = useCallback(
    async (filters: UseHistoryOptions, forceReload = false) => {
      const requestId = requestIdRef.current + 1
      const now = Date.now()
      const startTime = periodStartTime(filters.period, now)
      const cacheKey = fullCacheKey(filters.query, filters.period)
      const fullLoad = requiresFullLoad(filters.domain, filters.sort)
      const cachedItems = fullCacheRef.current

      requestIdRef.current = requestId
      setError(null)

      if (
        fullLoad &&
        !forceReload &&
        cachedItems?.key === cacheKey
      ) {
        commitItems(
          applyHistoryFilters(cachedItems.items, {
            domain: filters.domain,
            sort: filters.sort,
          })
        )
        markAllLoaded()
        loadingRef.current = false
        setLoading(false)
        setLoadingMore(false)
        return
      }

      cursorRef.current = now
      hasMoreRef.current = true
      loadingRef.current = true
      allLoadedRef.current = false
      seenUrlsRef.current = new Set()
      commitItems([])
      setHasMore(true)
      setLoading(true)
      setLoadingMore(false)

      try {
        if (fullLoad) {
          const allItems = await fetchAllHistoryItems({
            query: filters.query,
            startTime,
            endTime: now,
          })

          if (requestId !== requestIdRef.current) return

          fullCacheRef.current = { key: cacheKey, items: allItems }
          commitItems(
            applyHistoryFilters(allItems, {
              domain: filters.domain,
              sort: filters.sort,
            })
          )
          markAllLoaded()
          return
        }

        const page = await fetchHistoryPage({
          query: filters.query,
          startTime,
          endTime: now,
          maxResults: filters.pageSize,
        })

        if (requestId !== requestIdRef.current) return

        commitItems(takeUnseenItems(page.items, seenUrlsRef.current))

        if (page.rawCount < filters.pageSize) {
          markAllLoaded()
          return
        }

        cursorRef.current = page.oldest
      } catch (historyError) {
        if (requestId !== requestIdRef.current) return

        console.error(historyError)
        setError(t("load_error"))
        markAllLoaded()
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false
          setLoading(false)
        }
      }
    },
    [commitItems, markAllLoaded]
  )

  useEffect(() => {
    void startFrom({
      query: debouncedQuery,
      period,
      domain: debouncedDomain,
      sort,
      pageSize,
    })
  }, [debouncedQuery, debouncedDomain, period, sort, pageSize, startFrom])

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current || allLoadedRef.current) {
      return
    }

    const filters = filtersRef.current

    if (requiresFullLoad(filters.domain, filters.sort)) {
      return
    }

    const requestId = requestIdRef.current
    loadingRef.current = true
    setLoadingMore(true)
    setError(null)

    try {
      for (
        let attempt = 0;
        attempt < MAX_EMPTY_PAGE_RETRIES;
        attempt += 1
      ) {
        const page = await fetchHistoryPage({
          query: filters.query,
          startTime: periodStartTime(filters.period),
          endTime: cursorRef.current,
          maxResults: filters.pageSize,
        })

        if (requestId !== requestIdRef.current) return

        if (page.rawCount === 0) {
          markAllLoaded()
          return
        }

        const unseenItems = takeUnseenItems(page.items, seenUrlsRef.current)

        if (unseenItems.length > 0) {
          commitItems([...itemsRef.current, ...unseenItems])
        }

        if (page.rawCount < filters.pageSize) {
          markAllLoaded()
          return
        }

        if (unseenItems.length > 0) {
          cursorRef.current = page.oldest
          return
        }

        if (page.oldest <= 0) {
          markAllLoaded()
          return
        }

        cursorRef.current = page.oldest - 1
      }
    } catch (historyError) {
      if (requestId !== requestIdRef.current) return

      console.error(historyError)
      setError(t("load_error"))
      markAllLoaded()
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false
        setLoadingMore(false)
      }
    }
  }, [commitItems, markAllLoaded])

  const loadAll = useCallback(async (): Promise<HistoryItemType[]> => {
    if (allLoadedRef.current) {
      return itemsRef.current
    }

    const filters = filtersRef.current
    const requestId = requestIdRef.current + 1
    const now = Date.now()
    const startTime = periodStartTime(filters.period, now)
    const cacheKey = fullCacheKey(filters.query, filters.period)

    requestIdRef.current = requestId
    loadingRef.current = true
    setLoadingMore(true)
    setError(null)

    try {
      const cachedItems = fullCacheRef.current
      let allItems =
        cachedItems?.key === cacheKey ? cachedItems.items : null

      if (!allItems) {
        allItems = await fetchAllHistoryItems({
          query: filters.query,
          startTime,
          endTime: now,
        })

        if (requestId !== requestIdRef.current) {
          return itemsRef.current
        }

        fullCacheRef.current = { key: cacheKey, items: allItems }
      }

      const visibleItems = applyHistoryFilters(allItems, {
        domain: filters.domain,
        sort: filters.sort,
      })

      commitItems(visibleItems)
      markAllLoaded()

      return visibleItems
    } catch (historyError) {
      if (requestId !== requestIdRef.current) {
        return itemsRef.current
      }

      console.error(historyError)
      setError(t("load_error"))
      return itemsRef.current
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [commitItems, markAllLoaded])

  const reload = useCallback(() => {
    fullCacheRef.current = null
    void startFrom(
      {
        query: debouncedQuery,
        period,
        domain: debouncedDomain,
        sort,
        pageSize,
      },
      true
    )
  }, [startFrom, debouncedQuery, debouncedDomain, period, sort, pageSize])

  const forgetUrls = useCallback(
    (urls: string[]) => {
      const urlSet = new Set(urls)

      commitItems(
        itemsRef.current.filter(item => !urlSet.has(item.url))
      )
      urls.forEach(url => seenUrlsRef.current.delete(url))

      const cachedItems = fullCacheRef.current

      if (cachedItems) {
        fullCacheRef.current = {
          key: cachedItems.key,
          items: cachedItems.items.filter(item => !urlSet.has(item.url)),
        }
      }
    },
    [commitItems]
  )

  const remove = useCallback(
    async (url: string): Promise<boolean> => {
      const result = await deleteHistoryUrls([url])

      if (result.removedUrls.length === 0) {
        setError(t("delete_error"))
        return false
      }

      forgetUrls(result.removedUrls)
      setError(null)
      return true
    },
    [forgetUrls]
  )

  const removeBulk = useCallback(
    async (urls: string[]): Promise<string[]> => {
      const result = await deleteHistoryUrls(urls)

      if (result.removedUrls.length > 0) {
        forgetUrls(result.removedUrls)
      }

      setError(
        result.failedUrls.length > 0 ? t("delete_error") : null
      )

      return result.removedUrls
    },
    [forgetUrls]
  )

  const clear = useCallback(async (): Promise<boolean> => {
    try {
      await deleteAllHistory()

      requestIdRef.current += 1
      fullCacheRef.current = null
      seenUrlsRef.current = new Set()
      commitItems([])
      markAllLoaded()
      loadingRef.current = false
      cursorRef.current = Date.now()
      setLoading(false)
      setLoadingMore(false)
      setError(null)

      return true
    } catch (historyError) {
      console.error(historyError)
      setError(t("delete_error"))
      return false
    }
  }, [commitItems, markAllLoaded])

  const restore = useCallback(
    async (urls: string[]): Promise<boolean> => {
      try {
        await restoreHistoryUrls(urls)
        fullCacheRef.current = null
        await startFrom(
          {
            query: debouncedQuery,
            period,
            domain: debouncedDomain,
            sort,
            pageSize,
          },
          true
        )

        return true
      } catch (historyError) {
        console.error(historyError)
        setError(t("restore_error"))
        return false
      }
    },
    [startFrom, debouncedQuery, debouncedDomain, period, sort, pageSize]
  )

  return {
    items,
    reload,
    loadMore,
    loadAll,
    remove,
    removeBulk,
    clear,
    restore,
    hasMore,
    loading,
    loadingMore,
    error,
  }
}
