import { X } from "lucide-react"

import type { PeriodFilter, SortOrder } from "../../types/filters"
import { t } from "../../i18n"
import styles from "./styles.module.css"

interface Props {
  period: PeriodFilter
  sort: SortOrder
  domain: string
  onPeriodChange: (period: PeriodFilter) => void
  onSortChange: (sort: SortOrder) => void
  onDomainChange: (domain: string) => void
}

export function FiltersBar({
  period,
  sort,
  domain,
  onPeriodChange,
  onSortChange,
  onDomainChange,
}: Props) {
  return (
    <div className={styles.bar}>
      <label className={styles.field} htmlFor="filter-period">
        <span className={styles.label}>{t("period_filter")}</span>
        <select
          id="filter-period"
          className={styles.select}
          value={period}
          onChange={event =>
            onPeriodChange(event.target.value as PeriodFilter)
          }
        >
          <option value="all">{t("period_all")}</option>
          <option value="today">{t("period_today")}</option>
          <option value="week">{t("period_week")}</option>
          <option value="month">{t("period_month")}</option>
        </select>
      </label>

      <label className={styles.field} htmlFor="filter-sort">
        <span className={styles.label}>{t("sort_order")}</span>
        <select
          id="filter-sort"
          className={styles.select}
          value={sort}
          onChange={event => onSortChange(event.target.value as SortOrder)}
        >
          <option value="recent">{t("sort_recent")}</option>
          <option value="most_visited">{t("sort_most_visited")}</option>
          <option value="title">{t("sort_title")}</option>
        </select>
      </label>

      <label
        className={`${styles.field} ${styles.fieldGrow}`}
        htmlFor="filter-domain"
      >
        <span className={styles.label}>{t("domain_filter")}</span>
        <span className={styles.domainWrapper}>
          <input
            id="filter-domain"
            type="text"
            className={styles.input}
            placeholder={t("domain_placeholder")}
            value={domain}
            onChange={event => onDomainChange(event.target.value)}
          />
          {domain && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => onDomainChange("")}
              aria-label={t("clear_domain")}
              title={t("clear_domain")}
            >
              <X size={14} />
            </button>
          )}
        </span>
      </label>
    </div>
  )
}
