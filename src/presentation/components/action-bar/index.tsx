import classNames from "classnames"
import { RotateCcw, Trash, CheckSquare, Square } from "lucide-react"
import styles from "./styles.module.css"

interface Props {
  isSelecting: boolean
  selectedCount: number
  totalCount: number
  onReload: () => void
  onClearAll: () => void
  onToggleSelectMode: () => void
  onDeleteSelected: () => void
  onToggleSelectAll: () => void
}

export function ActionBar({
  isSelecting,
  selectedCount,
  totalCount,
  onReload,
  onClearAll,
  onToggleSelectMode,
  onDeleteSelected,
  onToggleSelectAll,
}: Props) {
  const allSelected = totalCount > 0 && selectedCount === totalCount

  return (
    <div className={styles.bar}>
      <RotateCcw size={16} className={styles.icon} onClick={onReload} />
      <Trash size={16} className={classNames(styles.icon, styles.danger)} onClick={onClearAll} />

      <button
        id="toggle-select-mode"
        className={classNames(styles.btn, isSelecting && styles.btnActive)}
        onClick={onToggleSelectMode}
      >
        <CheckSquare size={16} />
        {isSelecting ? "Cancelar" : "Selecionar"}
      </button>

      {isSelecting && selectedCount > 0 && (
        <button id="delete-selected" className={classNames(styles.btn, styles.btnDanger)} onClick={onDeleteSelected}>
          <Trash size={16} />
          Deletar ({selectedCount})
        </button>
      )}

      {isSelecting && totalCount > 0 && (
        <button id="select-all" className={styles.btn} onClick={onToggleSelectAll}>
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          {allSelected ? "Desmarcar todos" : "Selecionar todos"}
        </button>
      )}
    </div>
  )
}
