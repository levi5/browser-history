import type { HistoryItemType } from "../types/history"

export const toDateKey = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString(navigator.language, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

export const groupByDate = (items: HistoryItemType[]): Record<string, HistoryItemType[]> =>
  items.reduce<Record<string, HistoryItemType[]>>((acc, item) => {
    const key = toDateKey(item.lastVisitTime)
    acc[key] = [...(acc[key] ?? []), item]
    return acc
  }, {})

export const filterByQuery = (items: HistoryItemType[], query: string): HistoryItemType[] => {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(({ title, url }) =>
    title?.toLowerCase().includes(q) || url.toLowerCase().includes(q)
  )
}
