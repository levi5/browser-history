import { useEffect, useState } from "react"
import classNames from "classnames"
import { CheckSquare, Globe, Square, Trash } from "lucide-react"

import { t } from "../../i18n"
import type { HistoryItemType } from "../../types/history"
import {
  faviconUrl,
  formatVisitTime,
  getHostname,
} from "../../utils/history"
import styles from "./styles.module.css"

interface Props {
  date: string
  items: HistoryItemType[]
  isSelecting: boolean
  selectedUrls: Set<string>
  onToggleSelect: (url: string) => void
  onRemove: (item: HistoryItemType) => void
}

interface FaviconProps {
  url: string
}

function Favicon({ url }: FaviconProps) {
  const source = faviconUrl(url)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [source])

  if (!source || failed) {
    return (
      <span className={styles.faviconFallback}>
        <Globe size={16} />
      </span>
    )
  }

  return (
    <img
      className={styles.favicon}
      src={source}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

function formatVisitCount(count: number): string {
  return count === 1
    ? t("visit_count_one")
    : t("visit_count_many", String(count))
}

export function HistoryGroup({
  date,
  items,
  isSelecting,
  selectedUrls,
  onToggleSelect,
  onRemove,
}: Props) {
  return (
    <li className={styles.group}>
      <h2 className={styles.date}>{date}</h2>
      <ul className={styles.list}>
        {items.map(item => {
          const isSelected = selectedUrls.has(item.url)
          const hostname = getHostname(item.url)
          const visitCount = item.visitCount ?? 0

          return (
            <li
              key={item.id}
              className={classNames(
                styles.item,
                isSelecting && styles.selecting,
                isSelected && styles.selected
              )}
              onClick={
                isSelecting ? () => onToggleSelect(item.url) : undefined
              }
            >
              {isSelecting && (
                <button
                  type="button"
                  className={styles.checkbox}
                  onClick={event => {
                    event.stopPropagation()
                    onToggleSelect(item.url)
                  }}
                  aria-label={t("toggle_selection")}
                  aria-pressed={isSelected}
                >
                  {isSelected ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              )}

              <span className={styles.faviconWrapper}>
                <Favicon url={item.url} />
              </span>

              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className={styles.link}
                onClick={event => {
                  if (isSelecting) event.preventDefault()
                }}
              >
                <h3 className={styles.title}>{item.title || item.url}</h3>
                <span className={styles.meta}>
                  {hostname && (
                    <span className={styles.metaItem}>{hostname}</span>
                  )}
                  <span className={styles.metaItem}>
                    {formatVisitTime(item.lastVisitTime)}
                  </span>
                  {visitCount > 0 && (
                    <span className={styles.metaItem}>
                      {formatVisitCount(visitCount)}
                    </span>
                  )}
                </span>
              </a>

              {!isSelecting && (
                <button
                  type="button"
                  className={styles.remove}
                  onClick={event => {
                    event.stopPropagation()
                    onRemove(item)
                  }}
                  aria-label={t("remove_entry")}
                  title={t("remove_entry")}
                >
                  <Trash size={16} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </li>
  )
}
