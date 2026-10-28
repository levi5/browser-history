import type { HistoryItemType } from "../types/history"

export type ExportFormat = "csv" | "json"

function escapeCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function exportItem(item: HistoryItemType) {
  return {
    title: item.title ?? "",
    url: item.url,
    lastVisit: new Date(item.lastVisitTime).toISOString(),
    lastVisitTime: item.lastVisitTime,
    visitCount: item.visitCount ?? 0,
  }
}

export function toCsv(items: HistoryItemType[]): string {
  const header = ["title", "url", "lastVisit", "lastVisitTime", "visitCount"]
  const rows = items.map(item => {
    const exportableItem = exportItem(item)

    return [
      exportableItem.title,
      exportableItem.url,
      exportableItem.lastVisit,
      String(exportableItem.lastVisitTime),
      String(exportableItem.visitCount),
    ]
  })

  return [header, ...rows]
    .map(row => row.map(escapeCsvValue).join(","))
    .join("\r\n")
}

export function toJson(items: HistoryItemType[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      itemCount: items.length,
      items: items.map(exportItem),
    },
    null,
    2
  )
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export function exportFileTimestamp(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace(/[:T]/g, "-")
}

export function downloadHistory(
  items: HistoryItemType[],
  format: ExportFormat,
  timestamp: string
): void {
  if (format === "csv") {
    downloadFile(
      `\ufeff${toCsv(items)}`,
      `history-${timestamp}.csv`,
      "text/csv;charset=utf-8"
    )
    return
  }

  downloadFile(
    toJson(items),
    `history-${timestamp}.json`,
    "application/json;charset=utf-8"
  )
}
