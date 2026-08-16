import { useEffect, useRef, useMemo, useState } from "react"

import { useHistory } from "../hooks/use-history"
import { useSelection } from "../hooks/use-selection"
import { SearchBar } from "../components/search-bar"
import { ActionBar } from "../components/action-bar"
import { HistoryGroup } from "../components/history-group"
import { groupByDate, filterByQuery } from "../utils/history"

import styles from "./styles.module.css"

export function Page() {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { items, reload, loadMore, remove, removeBulk, clear } = useHistory()

  const [query, setQuery] = useState("")
  const selection = useSelection(filterByQuery(items, query))

  const title = chrome.i18n.getMessage("title")

  useEffect(() => { document.title = title }, [title])

  useEffect(() => {
    window.addEventListener("focus", reload)
    return () => window.removeEventListener("focus", reload)
  }, [reload])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.unobserve(sentinel)
  }, [loadMore])

  const filtered = useMemo(() => filterByQuery(items, query), [items, query])
  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  function handleDeleteSelected() {
    removeBulk(Array.from(selection.selected))
    selection.disable()
  }

  function handleToggleSelectMode() {
    selection.active ? selection.disable() : selection.enable()
  }

  return (
    <div className={styles.page}>
      <h1>{title}</h1>

      <SearchBar value={query} onChange={setQuery} />

      <ActionBar
        isSelecting={selection.active}
        selectedCount={selection.selected.size}
        totalCount={filtered.length}
        onReload={reload}
        onClearAll={clear}
        onToggleSelectMode={handleToggleSelectMode}
        onDeleteSelected={handleDeleteSelected}
        onToggleSelectAll={selection.toggleAll}
      />

      <ul className={styles.list}>
        {Object.entries(grouped).map(([date, dateItems]) => (
          <HistoryGroup
            key={date}
            date={date}
            items={dateItems}
            isSelecting={selection.active}
            selectedUrls={selection.selected}
            onToggleSelect={selection.toggle}
            onRemove={remove}
          />
        ))}

        {filtered.length === 0 && query && (
          <li className={styles.empty}>
            Nenhum resultado para "<strong>{query}</strong>"
          </li>
        )}
      </ul>

      <div ref={sentinelRef} style={{ height: "30px" }} />
    </div>
  )
}
