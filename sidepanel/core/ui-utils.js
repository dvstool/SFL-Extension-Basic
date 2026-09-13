/*
 * Shared UI primitives.
 *
 * This is deliberately a classic extension script (rather than an ES module)
 * while the legacy coordinator is being split. Its declarations are shared by
 * the scripts loaded after it, so feature migration does not change runtime
 * behaviour.
 */

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function formatCountdown(seconds) {
  const value = Math.max(0, Math.ceil(seconds));
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remainingSeconds = value % 60;
  if (days) return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(remainingSeconds).padStart(2, '0')}s`;
  if (minutes) return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`;
  return `${remainingSeconds}s`;
}

function formatCompactCount(value) {
  if (!Number.isFinite(Number(value))) return value ?? '—';
  const count = Number(value);
  return Math.abs(count) >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(count);
}

function formatExactCount(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-US') : '—';
}

function log(message) {
  const entry = document.createElement('div');
  const displayMessage = window.panelI18n?.translate?.(String(message), window.panelI18n.language) || message;
  entry.textContent = `[${new Date().toLocaleTimeString('en-GB')}] ${displayMessage}`;
  panelLog.prepend(entry);
  while (panelLog.children.length > 40) panelLog.lastElementChild.remove();
  return entry;
}

function actionLogText(message) {
  const exact = new Map([
    ['Mining...', 'Mining successful.'],
    ['Chopping tree...', 'Tree chopped successfully.'],
    ['Planting...', 'Planting successful.'],
    ['Harvesting...', 'Harvest successful.'],
    ['Harvesting fruit...', 'Fruit harvested successfully.'],
    ['Fertilizing...', 'Fertilization successful.'],
    ['Scanning map...', 'Map scan successful.'],
    ['Scanning Betty...', 'Betty scan successful.'],
    ['Scanning tools...', 'Tools scan successful.'],
    ['Scanning inventory...', 'Inventory scan successful.'],
    ['Buying seeds...', 'Seeds purchased successfully.'],
    ['Buying tools...', 'Tools purchased successfully.'],
    ['Opening Workbench...', 'Workbench opened.'],
    ['Opening Betty and reading seasonal seeds...', 'Seasonal seeds scanned.'],
    ['Restocking for free...', 'Free restock successful.'],
    ['Harvesting mushrooms...', 'Mushrooms harvested successfully.'],
    ['Mining salt...', 'Salt mined successfully.'],
    ['Scanning composters...', 'Composters scanned.']
  ]);
  const known = exact.get(message);
  if (known) return { start: message, success: known };
  const mining = String(message).match(/^Mining (.+)\.\.\.$/);
  if (mining) return { start: message, success: `${mining[1]} mined successfully.` };
  const wake = String(message).match(/^Waking (.+)\.\.\.$/);
  if (wake) return { start: message, success: `${wake[1]} awakened.` };
  return { start: String(message), success: 'Completed.' };
}

function startActionLog(message, successMessage = '') {
  const completeLicenseAction = window.licenseManager?.beginAction?.();
  if (globalThis.__sunflowerToolsSilentLog) return () => completeLicenseAction?.();
  const actionText = actionLogText(message);
  const entry = log(actionText.start);
  entry.classList.add('is-progress');
  const completedMessage = successMessage || actionText.success;
  return (...messages) => {
    completeLicenseAction?.();
    const failed = entry.dataset.failed === 'true';
    entry.remove();
    if (failed) return;
    const messageToLog = messages.length ? messages[0] : completedMessage;
    if (!messageToLog) return;
    const completed = log(messageToLog);
    completed.classList.add('is-success');
  };
}

function logActionError(message) {
  Array.from(panelLog.querySelectorAll('.is-progress')).at(-1)?.setAttribute('data-failed', 'true');
  const entry = log(message);
  entry.classList.add('is-error');
}

function getSeedCount(seed) { return Math.max(0, Number(seed?.count) || 0); }
