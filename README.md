# Browser History Extension

Browser extension using **React**, **TypeScript**, and **Vite**.

## Prerequisites

- Node.js ≥ 22
- npm or pnpm

## Installation

install dependencies:

```bash
git clone <your-repository>
cd browser-history
pnpm install
pnpm build
```

## Features

- Search the full browser history, with pagination as you scroll.
- Filter by period (all time, today, last 7 days, last 30 days) and by domain.
- Sort by most recent, most visited, or title.
- See favicon, visit time, and visit count for each page.
- Select individual results or every result of the current filter, then delete
  or open the selection in new tabs.
- Confirmation before deleting (configurable) and an undo action after deleting.
- Export the current results as CSV or JSON.
- Options page for theme (system, light, dark), items per page, and delete
  confirmations.

## Loading the extension

### Chrome / Edge

1. Run `pnpm build`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `dist` folder.
4. Click the extension icon to open the history page.

### Firefox

1. Run `pnpm build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...** and select `dist/manifest.json`.

The extension uses Manifest V3 and declares both `background.service_worker`
(Chromium) and `background.scripts` (Firefox), so the same build works in both
browsers. Run `pnpm lint` to check the code and `pnpm build` again after any
change before reloading the extension.

## Options

Open the extension options from the gear button on the history page, or from
the browser's extension settings. The options are shared between the history
page and the options page through `chrome.storage.sync`.

The undo action restores deleted URLs with `chrome.history.addUrl`, so the page
returns to the history, but the original visit timestamp and title are not
preserved by the browser API.

