import classNames from "classnames"
import { Trash, CheckSquare, Square } from "lucide-react"
import type { HistoryItemType } from "../../types/history"
import styles from "./styles.module.css"

interface Props {
  date: string
  items: HistoryItemType[]
  isSelecting: boolean
  selectedUrls: Set<string>
  onToggleSelect: (url: string) => void
  onRemove: (url: string) => void
}

export function HistoryGroup({ date, items, isSelecting, selectedUrls, onToggleSelect, onRemove }: Props) {
  return (
    <li className={styles.group}>
      <h2 className={styles.date}>{date}</h2>
      <ul className={styles.list}>
        {items.map(({ id, url, title }) => {
          const isSelected = selectedUrls.has(url)
          return (
            <li
              key={id}
              className={classNames(styles.item, isSelected && styles.selected)}
              onClick={isSelecting ? () => onToggleSelect(url) : undefined}
            >
              {isSelecting && (
                <span className={styles.checkbox}>
                  {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </span>
              )}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={styles.link}
                onClick={e => isSelecting && e.preventDefault()}
              >
                <h3 className={styles.title}>{title || url}</h3>
              </a>
              {!isSelecting && (
                <Trash
                  size={16}
                  className={styles.remove}
                  onClick={e => { e.stopPropagation(); onRemove(url) }}
                />
              )}
            </li>
          )
        })}
      </ul>
    </li>
  )
}
