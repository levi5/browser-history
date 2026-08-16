import { Search, X } from "lucide-react"
import styles from "./styles.module.css"

interface Props {
  value: string
  onChange: (v: string) => void
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className={styles.wrapper}>
      <Search size={16} className={styles.icon} />
      <input
        id="history-search"
        type="text"
        className={styles.input}
        placeholder="Pesquisar no histórico..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button className={styles.clear} onClick={() => onChange("")} aria-label="Limpar pesquisa">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
