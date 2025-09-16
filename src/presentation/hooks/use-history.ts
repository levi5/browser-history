import { useState, useCallback } from "react"
import type { HistoryItemType } from "../types/history"

const PAGE_SIZE = 20;

export function useHistory() {
  const [allItems, setAllItems] = useState<HistoryItemType[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItemType[]>([]);
  const [page, setPage] = useState(0); // começa da página 0
  const [hasMore, setHasMore] = useState(true);

  const loadHistoryAll = useCallback(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // últimos 7 dias
    chrome.history.search(
      { text: "", startTime: oneWeekAgo, maxResults: 1000 },
      (results) => {
        const items = results as HistoryItemType[];
        setAllItems(items);
        setHistoryItems(items.slice(0, PAGE_SIZE));
        setPage(0);
        setHasMore(items.length > PAGE_SIZE);
      }
    );
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    const start = nextPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const moreItems = allItems.slice(start, end);

    if (moreItems.length > 0) {
      setHistoryItems(prev => [...prev, ...moreItems]);
      setPage(nextPage);
      if (end >= allItems.length) setHasMore(false);
    } else {
      setHasMore(false);
    }
  }, [allItems, page]);

  const removeItem = useCallback((url: string) => {
    chrome.history.deleteUrl({ url }, () => {
      setAllItems(prev => prev.filter(item => item.url !== url));
      setHistoryItems(prev => prev.filter(item => item.url !== url));
    });
  }, []);

  const clearAll = useCallback(() => {
    chrome.history.deleteAll(() => {
      setAllItems([]);
      setHistoryItems([]);
      setPage(0);
      setHasMore(false);
    });
  }, []);

  return { historyItems, loadHistoryAll, loadMore, removeItem, clearAll, hasMore };
}
