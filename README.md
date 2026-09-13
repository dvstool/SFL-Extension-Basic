# Sunflower Tools Basic

A free, read-only Chrome side-panel companion for [Sunflower Land](https://sunflower-land.com/). It helps you see a quick map summary and receive local notifications for timers you scan.

## Features

- Connects to the currently open Sunflower Land tab.
- Scans visible map information and shows object, crop, fruit, resource, and timer totals.
- Schedules local Chrome notifications for the visible timers found during a scan.
- Keeps all game actions manual. It does not harvest, plant, buy, mine, chop, or automate gameplay.

## Install from source

1. Download this repository or clone it locally.
2. Open `chrome://extensions` in Google Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose the folder containing `manifest.json`.
6. Open Sunflower Land, click the extension icon, then select **Connect game** in the side panel.

After opening the panel, use **Scan map** whenever you want to refresh the overview and timer notifications.

## Permissions

| Permission | Purpose |
| --- | --- |
| `sidePanel` | Shows the extension beside the game. |
| `tabs` and `scripting` | Reads visible map information from your open Sunflower Land tab after you connect. |
| `storage` | Saves the notification setting locally in Chrome. |
| `alarms` and `notifications` | Schedules and displays local ready notifications. |

The extension is limited to `https://sunflower-land.com/*` and does not require a license server.

## Privacy

Sunflower Tools Basic does not send game data, account data, or scanned map data to an external server. Scanned data is used locally in the side panel and to schedule Chrome notifications.

## Scope

This repository intentionally contains only the Basic edition. Premium functionality, automation, account management, licensing, and administration code are not included.

## Support

If the game changes its interface and a scan no longer works, please open an issue with the game page state and the extension version you are using.
