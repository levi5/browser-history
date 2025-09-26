import { useEffect, useRef, useMemo } from "react"
import classNames from "classnames"
import { RotateCcw, Trash } from "lucide-react"

import type { HistoryItemType } from "../types/history"
import { useHistory } from "../hooks/use-history"

import styles from './styles.module.css'

export function Page() {
  const loaderRef = useRef<HTMLDivElement | null>(null)
  const { historyItems, loadHistoryAll, loadMore, removeItem, clearAll } = useHistory()

  const titleStr = chrome.i18n.getMessage("title")

   useEffect(() => {
    document.title = titleStr
  }, [historyItems, titleStr])


useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMore()
      }
    },
    { threshold: 0 }
  )

  if (loaderRef.current) observer.observe(loaderRef.current)

  return () => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (loaderRef.current) observer.unobserve(loaderRef.current)
  }
}, [loadMore])


  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryItemType[]> = {}
    historyItems.forEach(item => {
      const date = new Date(item.lastVisitTime)
      const key = date.toLocaleDateString(navigator.language, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    return groups
  }, [historyItems])

  return (
    <div className={classNames(styles.page, styles.history)}>
      <h1>{titleStr}</h1>
      <div className={styles.wrapperIcons}>
        <RotateCcw onClick={loadHistoryAll} size={16} className={styles.icon} />
        <Trash size={16} onClick={clearAll} className={classNames(styles.icon, styles.trash)} />
      </div>
      <ul className={styles.historyList}>
        {Object.entries(groupedHistory).map(([date, items]) => (
          <li key={date} className={styles.group}>
            <h2>{date}</h2>
            <ul className={styles.subgroup}>
              {items.map(({ id, url, title }) => (
                <li key={id} className={styles.item}>
                  <a href={url} target="_blank" rel="noreferrer">
                    <h3>{title || url}</h3>
                  </a>
                  <Trash size={16} onClick={() => removeItem(url)} className={classNames(styles.icon, styles.trash)} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div ref={loaderRef} style={{ height: '30px' }} />
    </div>
  )
}
