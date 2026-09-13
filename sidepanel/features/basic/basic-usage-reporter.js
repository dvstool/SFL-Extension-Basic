/* Anonymous Basic-edition usage reporting for the owner dashboard. */
(() => {
  const apiBaseUrl = 'https://sunflower-tools-license.sfl-ext-sang.workers.dev';
  const installationKey = 'sunflowerToolsBasicInstallationId';

  async function installationId() {
    const stored = await chrome.storage.local.get(installationKey);
    if (typeof stored[installationKey] === 'string' && stored[installationKey].length >= 16) return stored[installationKey];
    const id = crypto.randomUUID().replace(/-/g, '');
    await chrome.storage.local.set({ [installationKey]: id });
    return id;
  }

  async function reportBasicUsage() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    try {
      await fetch(`${apiBaseUrl}/v1/basic/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installationId: await installationId(), extensionVersion: chrome.runtime.getManifest().version }),
        signal: controller.signal
      });
    } catch {
      // Reporting never blocks the free Basic panel when the Worker is unavailable.
    } finally {
      window.clearTimeout(timeout);
    }
  }

  void reportBasicUsage();
})();
