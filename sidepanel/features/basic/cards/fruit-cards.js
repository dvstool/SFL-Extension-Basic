/* Fruit-specific card markup and seed selection card. */

function fruitCard(item, type, heldSeed) {
  const growing = type === 'growing';
  const empty = type === 'empty';
  const dead = type === 'dead';
  const ready = type === 'ready';
  const hasCountdown = growing && Number.isFinite(item.seconds) && item.seconds > 0;
  const state = empty ? 'EMPTY' : dead ? 'READY' : growing ? 'GROWING' : 'READY';
  const detail = empty ? (heldSeed ? `${heldSeed.name} ×${heldSeed.count}` : 'Chưa cầm hạt Fruit') : growing ? (hasCountdown ? countdownMarkup(item) : 'Đang cập nhật thời gian…') : dead ? `Axe ×${toolCounts.get(axeIcon) ?? '—'}` : 'Sẵn sàng thu hoạch';
  const fruitName = String(item.label || '').replace(/\s+tree$/i, '').trim();
  if (empty) {
    const seed = heldSeed;
    const seedIcon = seed?.icon || '';
    const seedCount = getSeedCount(seed);
    const canPlant = Boolean(seed && seedCount > 0);
    const plantCount = Math.min(Number(item.count || 0), seedCount);
    const seedCorner = seedIcon
      ? `<button class="soil-seed-corner is-selected" type="button" data-ui-action="choose-fruit-seed" title="Đổi hạt"><img src="${escapeHtml(seedIcon)}" alt="" /><b>×${formatExactCount(seedCount)}</b><span class="soil-seed-exchange" aria-label="Đổi hạt">⇄</span></button>`
      : `<button class="soil-seed-corner" type="button" data-ui-action="choose-fruit-seed" title="Chọn hạt"><span>?</span></button>`;
    const plant = canPlant ? `<div class="empty-crop-overlay"><button type="button" data-ui-action="plant-fruit" data-action-label="Trồng x${plantCount}">Trồng x${plantCount}</button></div>` : '';
    return `<article class="crop-card fruit-card fruit-soil-card empty-crop-card is-empty is-ready${seedIcon ? ' has-selected-seed' : ''}" data-resource="fruit" data-crop-name="Đất Fruit trống" data-fertiliser-type="${item.fertiliserType || 0}" data-map-keys="${escapeHtml((item.mapKeys || []).join('||'))}" data-count="${item.count}">${item.fertilised ? `<img class="fertiliser-mark" src="${fertiliserIcon}" alt="Đã bón phân" />` : ''}<div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(item.icon)}" alt="" /><b class="crop-quantity">×${item.count}</b></div><div class="crop-card-content"><span class="crop-card-state">Đất trống</span><strong class="crop-card-title">Đất Fruit trống</strong></div>${seedCorner}${plant}<button class="seed-select-overlay" type="button" data-ui-action="choose-fruit-seed">Select seeds</button></article>`;
  }
  const actions = ready ? `<button class="ready-collect-overlay" type="button" data-ui-action="harvest-fruit" aria-label="Collect x${item.count}">Collect x${item.count}</button>` : dead ? '<div class="crop-card-actions"><button type="button" data-ui-action="chop-fruit">Ch?t</button></div>' : '';
  return `<article class="crop-card fruit-card is-${type} ${ready || empty || dead ? 'is-ready' : ''}" data-resource="fruit" data-fertilised="${Boolean(item.fertilised)}" data-crop-name="${escapeHtml(fruitName)}" data-fertiliser-type="${item.fertiliserType || 0}" data-time-group="${item.timeGroup ?? ''}" data-map-keys="${escapeHtml((item.mapKeys || []).join('||'))}" data-count="${item.count}">${item.fertilised ? `<img class="fertiliser-mark" src="${fertiliserIcon}" alt="Đã bón phân" />` : ''}${item.fertiliserType === 2 ? '<img class="stopwatch-mark" src="https://sunflower-land.com/game-assets/icons/stopwatch.png" alt="Phân bón tăng tốc" />' : ''}<div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(item.icon)}" alt="" /><b class="crop-quantity">×${item.count}</b></div><div class="crop-card-content"><span class="crop-card-state">${state}</span><strong class="crop-card-title">${escapeHtml(fruitName || 'Fruit')}</strong><span class="crop-card-meta">${detail}</span></div>${actions}</article>`;
}

