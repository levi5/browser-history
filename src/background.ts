const action = chrome.action ?? chrome.browserAction

action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
})