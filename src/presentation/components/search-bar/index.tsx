import { Search, X } from "lucide-react"
import { t } from "../../i18n"
import styles from "./styles.module.css"

interface Props {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className={styles.wrapper}>
      <Search size={16} className={styles.icon} />
      <input
        id="history-search"
        type="search"
        className={styles.input}
        placeholder={t("search_placeholder")}
        aria-label={t("search_placeholder")}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange("")}
          aria-label={t("clear_search")}
          title={t("clear_search")}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
