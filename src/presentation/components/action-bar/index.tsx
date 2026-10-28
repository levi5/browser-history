import classNames from "classnames"
import {
  CheckSquare,
  ExternalLink,
  FileJson,
  FileText,
  RotateCcw,
  Settings,
  Square,
  Trash,
} from "lucide-react"

import { t } from "../../i18n"
import styles from "./styles.module.css"

interface Props {
  isSelecting: boolean
  selectedCount: number
  totalCount: number
  hasMore: boolean
  onReload: () => void
  onClearAll: () => void
  onOpenSettings: () => void
  onToggleSelectMode: () => void
  onDeleteSelected: () => void
  onToggleSelectAll: () => void
  onOpenSelected: () => void
  onExportCsv: () => void
  onExportJson: () => void
}

export function ActionBar({
  isSelecting,
  selectedCount,
  totalCount,
  hasMore,
  onReload,
  onClearAll,
  onOpenSettings,
  onToggleSelectMode,
  onDeleteSelected,
  onToggleSelectAll,
  onOpenSelected,
  onExportCsv,
  onExportJson,
}: Props) {
  const allSelected =
    !hasMore && totalCount > 0 && selectedCount === totalCount
  const hasItems = totalCount > 0

  return (
    <div className={styles.bar}>
      <div className={styles.group}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onReload}
          aria-label={t("reload")}
          title={t("reload")}
        >
          <RotateCcw size={16} />
        </button>

        <button
          type="button"
          className={styles.iconButton}
          onClick={onOpenSettings}
          aria-label={t("settings")}
          title={t("settings")}
        >
          <Settings size={16} />
        </button>

        <button
          type="button"
          className={classNames(styles.iconButton, styles.danger)}
          onClick={onClearAll}
          aria-label={t("clear_all")}
          title={t("clear_all")}
        >
          <Trash size={16} />
        </button>
      </div>

      <div className={styles.group}>
        <button
          type="button"
          className={styles.btn}
          onClick={onExportCsv}
          disabled={!hasItems}
        >
          <FileText size={16} />
          {t("export_csv")}
        </button>

        <button
          type="button"
          className={styles.btn}
          onClick={onExportJson}
          disabled={!hasItems}
        >
          <FileJson size={16} />
          {t("export_json")}
        </button>
      </div>

      <div className={classNames(styles.group, styles.groupEnd)}>
        <button
          id="toggle-select-mode"
          type="button"
          className={classNames(
            styles.btn,
            isSelecting && styles.btnActive
          )}
          onClick={onToggleSelectMode}
        >
          <CheckSquare size={16} />
          {isSelecting ? t("cancel") : t("select")}
        </button>

        {isSelecting && (
          <>
            <button
              id="select-all"
              type="button"
              className={styles.btn}
              onClick={onToggleSelectAll}
              disabled={!hasItems}
            >
              {allSelected ? (
                <CheckSquare size={16} />
              ) : (
                <Square size={16} />
              )}
              {allSelected ? t("deselect_all") : t("select_all")}
            </button>

            <button
              id="open-selected"
              type="button"
              className={styles.btn}
              onClick={onOpenSelected}
              disabled={selectedCount === 0}
            >
              <ExternalLink size={16} />
              {t("open_selected")}
            </button>

            <button
              id="delete-selected"
              type="button"
              className={classNames(styles.btn, styles.btnDanger)}
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
            >
              <Trash size={16} />
              {t("delete_selected", String(selectedCount))}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
