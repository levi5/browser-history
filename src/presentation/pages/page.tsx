import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"

import { ActionBar } from "../components/action-bar"
import { FiltersBar } from "../components/filters-bar"
import { HistoryGroup } from "../components/history-group"
import { SearchBar } from "../components/search-bar"
import { useHistory } from "../hooks/use-history"
import { useSelection } from "../hooks/use-selection"
import { t } from "../i18n"
import { openUrlsInNewTabs } from "../services/tabs"
import { useSettings } from "../settings/SettingsContext"
import type { PeriodFilter, SortOrder } from "../types/filters"
import type { HistoryItemType } from "../types/history"
import {
  downloadHistory,
  exportFileTimestamp,
  type ExportFormat,
} from "../utils/export"
import { groupByDate } from "../utils/history"

import styles from "./styles.module.css"

const UNDO_TIMEOUT_MS = 8000
const OPEN_SELECTED_CONFIRM_THRESHOLD = 10

interface UndoState {
  items: HistoryItemType[]
}

export function Page() {
  const { settings } = useSettings()
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState("")
  const [period, setPeriod] = useState<PeriodFilter>("all")
  const [domain, setDomain] = useState("")
  const [sort, setSort] = useState<SortOrder>("recent")
  const [undoState, setUndoState] = useState<UndoState | null>(null)

  const {
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
  } = useHistory({
    query,
    period,
    domain,
    sort,
    pageSize: settings.pageSize,
  })

  const selection = useSelection()
  const { disable: disableSelection, clear: clearSelection } = selection
  const grouped = useMemo(() => groupByDate(items), [items])
  const title = t("title")

  useEffect(() => {
    document.title = title
  }, [title])

  const handleReload = useCallback(() => {
    setUndoState(null)
    disableSelection()
    reload()
  }, [disableSelection, reload])

  useEffect(() => {
    window.addEventListener("focus", handleReload)
    return () => window.removeEventListener("focus", handleReload)
  }, [handleReload])

  useEffect(() => {
    clearSelection()
  }, [query, period, domain, sort, clearSelection])

  useEffect(() => {
    if (!undoState) return

    const timer = window.setTimeout(() => {
      setUndoState(null)
    }, UNDO_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [undoState])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          void loadMore()
        }
      },
      { threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const isSentinelVisible =
      sentinel.getBoundingClientRect().top <= window.innerHeight

    if (isSentinelVisible) {
      void loadMore()
    }
  }, [items.length, loading, loadingMore, hasMore, loadMore])

  async function handleDeleteSelected() {
    const selectedItems = items.filter(item =>
      selection.selectedUrls.has(item.url)
    )

    if (selectedItems.length === 0) return

    if (
      settings.confirmDelete &&
      !window.confirm(
        t("delete_selected_confirm", String(selectedItems.length))
      )
    ) {
      return
    }

    const removedUrls = await removeBulk(
      selectedItems.map(item => item.url)
    )
    const removedUrlSet = new Set(removedUrls)
    const removedItems = selectedItems.filter(item =>
      removedUrlSet.has(item.url)
    )

    if (removedItems.length > 0) {
      setUndoState({ items: removedItems })
    }

    disableSelection()
  }

  async function handleRemove(item: HistoryItemType) {
    if (
      settings.confirmDelete &&
      !window.confirm(t("delete_entry_confirm"))
    ) {
      return
    }

    const removed = await remove(item.url)

    if (removed) {
      setUndoState({ items: [item] })
    }
  }

  function handleToggleSelectMode() {
    if (selection.active) {
      selection.disable()
    } else {
      selection.enable()
    }
  }

  async function handleToggleSelectAll() {
    const allSelected =
      !hasMore &&
      items.length > 0 &&
      items.every(item => selection.selectedUrls.has(item.url))

    if (allSelected) {
      selection.clear()
      return
    }

    const allItems = await loadAll()
    selection.selectAll(allItems.map(item => item.url))
  }

  async function handleOpenSelected() {
    const urls = Array.from(selection.selectedUrls)

    if (urls.length === 0) return

    if (
      urls.length > OPEN_SELECTED_CONFIRM_THRESHOLD &&
      !window.confirm(t("open_selected_confirm", String(urls.length)))
    ) {
      return
    }

    await openUrlsInNewTabs(urls)
  }

  async function handleClearAll() {
    if (
      settings.confirmDelete &&
      !window.confirm(t("clear_all_confirm"))
    ) {
      return
    }

    disableSelection()
    setUndoState(null)
    await clear()
  }

  async function handleExport(format: ExportFormat) {
    const allItems = await loadAll()

    if (allItems.length === 0) return

    downloadHistory(allItems, format, exportFileTimestamp())
  }

  async function handleUndo() {
    if (!undoState) return

    const restored = await restore(
      undoState.items.map(item => item.url)
    )

    if (restored) {
      setUndoState(null)
    }
  }

  function handleOpenSettings() {
    void chrome.runtime.openOptionsPage()
  }

  const hasActiveFilters = period !== "all" || domain.trim().length > 0
  const emptyMessage = query.trim()
    ? t("empty_search", query.trim())
    : hasActiveFilters
      ? t("empty_filter")
      : t("empty_history")

  return (
    <div className={styles.page}>
      <h1>{title}</h1>

      <SearchBar value={query} onChange={setQuery} />

      <FiltersBar
        period={period}
        sort={sort}
        domain={domain}
        onPeriodChange={setPeriod}
        onSortChange={setSort}
        onDomainChange={setDomain}
      />

      <ActionBar
        isSelecting={selection.active}
        selectedCount={selection.selectedUrls.size}
        totalCount={items.length}
        hasMore={hasMore}
        onReload={handleReload}
        onClearAll={() => void handleClearAll()}
        onOpenSettings={handleOpenSettings}
        onToggleSelectMode={handleToggleSelectMode}
        onDeleteSelected={() => void handleDeleteSelected()}
        onToggleSelectAll={() => void handleToggleSelectAll()}
        onOpenSelected={() => void handleOpenSelected()}
        onExportCsv={() => void handleExport("csv")}
        onExportJson={() => void handleExport("json")}
      />

      <ul className={styles.list}>
        {Object.entries(grouped).map(([date, dateItems]) => (
          <HistoryGroup
            key={date}
            date={date}
            items={dateItems}
            isSelecting={selection.active}
            selectedUrls={selection.selectedUrls}
            onToggleSelect={selection.toggle}
            onRemove={item => void handleRemove(item)}
          />
        ))}
      </ul>

      {loading && <p className={styles.status}>{t("loading_history")}</p>}

      {!loading && error && (
        <div className={styles.status}>
          <p>{error}</p>
          <button
            type="button"
            className={styles.retry}
            onClick={handleReload}
          >
            {t("retry")}
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className={styles.empty}>{emptyMessage}</p>
      )}

      {loadingMore && (
        <p className={styles.status}>{t("loading_more")}</p>
      )}

      {undoState && (
        <div className={styles.undo} role="status">
          <span className={styles.undoMessage}>
            {t("deleted_items", String(undoState.items.length))}
          </span>
          <button
            type="button"
            className={styles.undoButton}
            onClick={() => void handleUndo()}
          >
            {t("undo")}
          </button>
          <button
            type="button"
            className={styles.undoClose}
            onClick={() => setUndoState(null)}
            aria-label={t("dismiss")}
            title={t("dismiss")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div ref={sentinelRef} style={{ height: "30px" }} />
    </div>
  )
}
