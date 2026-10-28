const HISTORY_PAGE = "index.html"

function queryTabs(): Promise<chrome.tabs.Tab[]> {
  return new Promise(resolve => {
    chrome.tabs.query({}, tabs => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message)
        resolve([])
        return
      }

      resolve(tabs)
    })
  })
}

function activateTab(tabId: number): Promise<void> {
  return new Promise(resolve => {
    chrome.tabs.update(tabId, { active: true }, () => resolve())
  })
}

function focusWindow(windowId: number): Promise<void> {
  return new Promise(resolve => {
    chrome.windows.update(windowId, { focused: true }, () => resolve())
  })
}

function createHistoryTab(url: string): Promise<void> {
  return new Promise(resolve => {
    chrome.tabs.create({ url }, () => resolve())
  })
}

async function openHistoryPage(): Promise<void> {
  const historyUrl = chrome.runtime.getURL(HISTORY_PAGE)
  const tabs = await queryTabs()
  const existingTab = tabs.find(tab => tab.url === historyUrl)

  if (existingTab?.id !== undefined) {
    await activateTab(existingTab.id)

    if (existingTab.windowId !== undefined) {
      await focusWindow(existingTab.windowId)
    }

    return
  }

  await createHistoryTab(historyUrl)
}

chrome.action.onClicked.addListener(() => {
  void openHistoryPage()
})
