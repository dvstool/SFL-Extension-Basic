/* Retry reading a newly-rendered Fruit timer. This is Basic scan behavior. */
function scheduleUnknownFruitTimeRefresh() {
  window.clearTimeout(fruitUnknownTimeRefreshTimer);
  const unknownKeys = Array.from(new Set((lastScanData?.fruit?.growing || [])
    .filter((item) => !Number.isFinite(Number(item.seconds)) || Number(item.seconds) <= 0)
    .flatMap((item) => item.mapKeys || [])));
  if (!unknownKeys.length) return;
  fruitUnknownTimeRefreshTimer = window.setTimeout(async () => {
    try {
      // Use the same complete scanner as the Load Fruit button. The compact
      // state reader can run before the game's tooltip has mounted, whereas
      // this scanner reliably reads the timer on the next rendered frame.
      await scanMap('fruit', { forceTimerRefresh: true });
    } catch { /* The next retry will handle a transient game-DOM update. */ }
    scheduleUnknownFruitTimeRefresh();
  }, 1000);
}
