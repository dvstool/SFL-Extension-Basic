const $ = (selector) => document.querySelector(selector);
const connectionCard = $('#connection-card');
const overviewCard = $('#overview-card');
const connectButton = $('#connect-button');
const scanButton = $('#scan-button');
const connectionStatus = $('#connection-status');
const scanStatus = $('#scan-status');
const mapSummary = $('#map-summary');
const logPanel = $('#panel-log');
const notificationsToggle = $('#ready-notifications');
let sunflowerTabId = null;
function log(message) { const row = document.createElement('div'); row.className = 'log-entry'; row.textContent = `[${new Date().toLocaleTimeString()}] ${message}`; logPanel.prepend(row); }
async function findGameTab() { const tabs = await chrome.tabs.query({ url: ['https://sunflower-land.com/*'] }); if (!tabs.length) throw new Error('Open Sunflower Land first.'); return tabs.find((tab) => tab.active) || tabs[0]; }
async function connect() { connectButton.disabled = true; connectionStatus.textContent = 'Connecting…'; try { const tab = await findGameTab(); sunflowerTabId = tab.id; connectionCard.classList.add('hidden'); overviewCard.classList.remove('hidden'); connectionStatus.textContent = ''; log('Connected to Sunflower Land.'); await scanMap(); } catch (error) { connectionStatus.textContent = error.message || 'Unable to connect.'; } finally { connectButton.disabled = false; } }
async function scanMap() {
  if (!sunflowerTabId) return connect(); scanButton.disabled = true; scanStatus.textContent = 'Scanning map…';
  try { const [result] = await chrome.scripting.executeScript({ target: { tabId: sunflowerTabId }, func: () => { const text = document.body?.innerText || ''; const images = [...document.images]; const assetCount = (fragment) => images.filter((image) => image.src.includes(fragment)).length; const timers = [...document.querySelectorAll('span, div')].map((node) => node.textContent?.trim()).filter((value) => /^(\d+\s*[hms]\s*){1,3}$/i.test(value || '')).slice(0, 40); return { mapObjects: document.querySelectorAll('[data-map-placement], [data-map-id]').length, cropAssets: assetCount('/crops/'), fruitAssets: assetCount('/fruit/'), resourceAssets: assetCount('/resources/'), timers, hasGame: /sunflower/i.test(text) }; } }); const data = result?.result; if (!data?.hasGame) throw new Error('The game page is not ready yet.'); renderSummary(data); scheduleTimers(data.timers); scanStatus.textContent = `Updated at ${new Date().toLocaleTimeString()}.`; log('Map scan complete.'); }
  catch (error) { scanStatus.textContent = error.message || 'Map scan failed.'; log('Map scan failed. Reconnect after reloading the game.'); sunflowerTabId = null; }
  finally { scanButton.disabled = false; }
}
function renderSummary(data) { const entries = [['Map objects', data.mapObjects], ['Crop assets', data.cropAssets], ['Fruit assets', data.fruitAssets], ['Resource assets', data.resourceAssets], ['Visible timers', data.timers.length]]; mapSummary.replaceChildren(...entries.map(([label, value]) => { const item = document.createElement('div'); item.className = 'summary-item'; item.innerHTML = `<strong>${value}</strong><span>${label}</span>`; return item; })); }
async function scheduleTimers(timers) { if (!notificationsToggle.checked || !timers.length) return; const now = Date.now(); const entries = timers.map((timer, index) => { const seconds = [...timer.matchAll(/(\d+)\s*([hms])/gi)].reduce((total, match) => total + Number(match[1]) * ({ h: 3600, m: 60, s: 1 }[match[2].toLowerCase()] || 0), 0); return { id: `timer-${index}-${timer}`, when: now + seconds * 1000, language: 'en' }; }).filter((entry) => entry.when > now + 1000); if (entries.length) await chrome.runtime.sendMessage({ type: 'SCHEDULE_READY_NOTIFICATIONS', entries }); }
connectButton.addEventListener('click', connect); scanButton.addEventListener('click', scanMap); $('#clear-log').addEventListener('click', () => logPanel.replaceChildren()); $('#reload-extension').addEventListener('click', () => window.location.reload()); notificationsToggle.addEventListener('change', async () => { await chrome.runtime.sendMessage({ type: 'SET_READY_NOTIFICATIONS', enabled: notificationsToggle.checked }); log(notificationsToggle.checked ? 'Ready notifications enabled.' : 'Ready notifications disabled.'); });
(async () => { const { readyNotificationsEnabled = true } = await chrome.storage.local.get('readyNotificationsEnabled'); notificationsToggle.checked = readyNotificationsEnabled; log('Basic Viewer ready.'); })();
