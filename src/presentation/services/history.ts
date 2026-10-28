import type { HistoryItemType } from "../types/history"

const OWN_EXTENSION_ORIGIN = chrome.runtime.getURL("")
const URL_BATCH_SIZE = 20
const SEARCH_PAGE_SIZE = 1000
const MAX_SEARCH_PAGES = 200

export interface HistoryPage {
  items: HistoryItemType[]
  rawCount: number
  oldest: number
}

export interface HistoryPageOptions {
  query: string
  startTime: number
  endTime: number
  maxResults: number
}

export interface FetchAllHistoryOptions {
  query: string
  startTime: number
  endTime: number
}

export interface DeleteHistoryResult {
  removedUrls: string[]
  failedUrls: string[]
}

interface BatchResult {
  succeededUrls: string[]
  failedUrls: string[]
}

function toHistoryItem(entry: chrome.history.HistoryItem): HistoryItemType | null {
  if (!entry.url || entry.url.startsWith(OWN_EXTENSION_ORIGIN)) return null

  return {
    id: entry.id,
    url: entry.url,
    title: entry.title,
    lastVisitTime: entry.lastVisitTime ?? 0,
    visitCount: entry.visitCount,
  }
}

function hasRuntimeError(): boolean {
  return Boolean(chrome.runtime.lastError)
}

function runtimeErrorMessage(): string {
  return chrome.runtime.lastError?.message ?? "History API error"
}

function chunkUrls(urls: string[], chunkSize: number): string[][] {
  const chunks: string[][] = []

  for (let index = 0; index < urls.length; index += chunkSize) {
    chunks.push(urls.slice(index, index + chunkSize))
  }

  return chunks
}

function runHistoryCommand(
  command: (done: () => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    command(() => {
      if (hasRuntimeError()) {
        reject(new Error(runtimeErrorMessage()))
        return
      }

      resolve()
    })
  })
}

async function runBatchedUrlCommand(
  urls: string[],
  command: (url: string) => Promise<void>
): Promise<BatchResult> {
  const succeededUrls: string[] = []
  const failedUrls: string[] = []

  for (const urlBatch of chunkUrls(urls, URL_BATCH_SIZE)) {
    const results = await Promise.allSettled(urlBatch.map(command))

    results.forEach((result, index) => {
      const url = urlBatch[index]

      if (result.status === "fulfilled") {
        succeededUrls.push(url)
        return
      }

      console.error(result.reason)
      failedUrls.push(url)
    })
  }

  return { succeededUrls, failedUrls }
}

export function fetchHistoryPage(options: HistoryPageOptions): Promise<HistoryPage> {
  return new Promise((resolve, reject) => {
    chrome.history.search(
      {
        text: options.query,
        startTime: options.startTime,
        endTime: options.endTime,
        maxResults: options.maxResults,
      },
      entries => {
        if (hasRuntimeError()) {
          reject(new Error(runtimeErrorMessage()))
          return
        }

        const sortedEntries = [...entries].sort(
          (firstEntry, secondEntry) =>
            (secondEntry.lastVisitTime ?? 0) - (firstEntry.lastVisitTime ?? 0)
        )

        const items = sortedEntries
          .map(toHistoryItem)
          .filter((entry): entry is HistoryItemType => entry !== null)

        resolve({
          items,
          rawCount: entries.length,
          oldest:
            sortedEntries.length > 0
              ? sortedEntries[sortedEntries.length - 1].lastVisitTime ?? 0
              : 0,
        })
      }
    )
  })
}

export async function fetchAllHistoryItems(
  options: FetchAllHistoryOptions
): Promise<HistoryItemType[]> {
  const collectedItems = new Map<string, HistoryItemType>()
  let cursor = options.endTime
  let pageCount = 0

  while (pageCount < MAX_SEARCH_PAGES) {
    const page = await fetchHistoryPage({
      query: options.query,
      startTime: options.startTime,
      endTime: cursor,
      maxResults: SEARCH_PAGE_SIZE,
    })

    const previousCount = collectedItems.size

    for (const item of page.items) {
      if (!collectedItems.has(item.url)) {
        collectedItems.set(item.url, item)
      }
    }

    const foundNewItems = collectedItems.size > previousCount
    const reachedEnd = page.rawCount < SEARCH_PAGE_SIZE

    if (reachedEnd || page.oldest <= 0) break

    if (!foundNewItems) {
      cursor = page.oldest - 1
    } else {
      cursor = page.oldest
    }

    pageCount += 1
  }

  return Array.from(collectedItems.values())
}

function deleteHistoryUrl(url: string): Promise<void> {
  return runHistoryCommand(done => chrome.history.deleteUrl({ url }, done))
}

export async function deleteHistoryUrls(
  urls: string[]
): Promise<DeleteHistoryResult> {
  const { succeededUrls, failedUrls } = await runBatchedUrlCommand(
    urls,
    deleteHistoryUrl
  )

  return { removedUrls: succeededUrls, failedUrls }
}

function restoreHistoryUrl(url: string): Promise<void> {
  return runHistoryCommand(done => chrome.history.addUrl({ url }, done))
}

export async function restoreHistoryUrls(urls: string[]): Promise<void> {
  const { failedUrls } = await runBatchedUrlCommand(urls, restoreHistoryUrl)

  if (failedUrls.length > 0) {
    throw new Error("Failed to restore history URLs")
  }
}

export function deleteAllHistory(): Promise<void> {
  return runHistoryCommand(done => chrome.history.deleteAll(done))
}
