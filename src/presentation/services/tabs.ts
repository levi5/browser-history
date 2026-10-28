function createTab(url: string): Promise<void> {
  return new Promise(resolve => {
    chrome.tabs.create({ url, active: false }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message)
      }

      resolve()
    })
  })
}

export async function openUrlsInNewTabs(urls: string[]): Promise<void> {
  for (const url of urls) {
    await createTab(url)
  }
}
