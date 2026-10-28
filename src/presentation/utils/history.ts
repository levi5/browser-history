import type { HistoryItemType } from "../types/history"
import type { PeriodFilter, SortOrder } from "../types/filters"

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000
const WEEK_IN_DAYS = 7
const MONTH_IN_DAYS = 30

export interface HistoryFilterOptions {
  domain: string
  sort: SortOrder
}

function userLocale(): string {
  return chrome.i18n.getUILanguage()
}

function startOfToday(now: number): number {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function periodStartTime(period: PeriodFilter, now = Date.now()): number {
  switch (period) {
    case "today":
      return startOfToday(now)
    case "week":
      return startOfToday(now) - (WEEK_IN_DAYS - 1) * DAY_IN_MILLISECONDS
    case "month":
      return startOfToday(now) - (MONTH_IN_DAYS - 1) * DAY_IN_MILLISECONDS
    default:
      return 0
  }
}

export function normalizeDomain(value: string): string {
  const trimmedValue = value.trim().toLowerCase()

  if (!trimmedValue) return ""

  try {
    const parsedUrl = new URL(
      trimmedValue.includes("://") ? trimmedValue : `https://${trimmedValue}`
    )

    return parsedUrl.hostname.replace(/^www\./, "")
  } catch {
    return trimmedValue.replace(/^www\./, "").split("/")[0]
  }
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

export function matchesDomain(url: string, normalizedDomain: string): boolean {
  if (!normalizedDomain) return true

  const hostname = getHostname(url)

  return (
    hostname === normalizedDomain ||
    hostname.endsWith(`.${normalizedDomain}`)
  )
}

export function faviconUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null
    }

    return `${parsedUrl.origin}/favicon.ico`
  } catch {
    return null
  }
}

export function sortHistoryItems(
  items: HistoryItemType[],
  sortOrder: SortOrder
): HistoryItemType[] {
  const sortedItems = [...items]

  switch (sortOrder) {
    case "most_visited":
      sortedItems.sort(
        (firstItem, secondItem) =>
          (secondItem.visitCount ?? 0) - (firstItem.visitCount ?? 0) ||
          (secondItem.lastVisitTime ?? 0) - (firstItem.lastVisitTime ?? 0)
      )
      break
    case "title":
      sortedItems.sort((firstItem, secondItem) =>
        (firstItem.title || firstItem.url).localeCompare(
          secondItem.title || secondItem.url,
          userLocale()
        )
      )
      break
    default:
      sortedItems.sort(
        (firstItem, secondItem) =>
          (secondItem.lastVisitTime ?? 0) - (firstItem.lastVisitTime ?? 0)
      )
  }

  return sortedItems
}

export function applyHistoryFilters(
  items: HistoryItemType[],
  options: HistoryFilterOptions
): HistoryItemType[] {
  const normalizedDomain = normalizeDomain(options.domain)

  const filteredItems = normalizedDomain
    ? items.filter(item => matchesDomain(item.url, normalizedDomain))
    : items

  return sortHistoryItems(filteredItems, options.sort)
}

export function formatVisitTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(userLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(userLocale(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function groupByDate(
  items: HistoryItemType[]
): Record<string, HistoryItemType[]> {
  return items.reduce<Record<string, HistoryItemType[]>>(
    (groups, item) => {
      const dateKey = formatDate(item.lastVisitTime)
      const group = groups[dateKey] ?? (groups[dateKey] = [])

      group.push(item)
      return groups
    },
    {}
  )
}
