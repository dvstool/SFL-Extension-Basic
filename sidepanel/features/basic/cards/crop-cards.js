/* Crop card markup. This module owns crop-specific visual states and actions. */

function cropCard(item, type) {
  const isGrowing = type === 'growing';
  const isEmpty = type === 'empty';
  const isTornado = type === 'tornado';
  const tier = isGrowing ? cropTiers.get(String(item.label || '').toLowerCase()) : '';
  const stateLabel = isTornado ? 'Bị khóa' : isEmpty ? 'EMPTY' : isGrowing ? 'GROWING' : 'READY';
  const hasCountdown = Number.isFinite(item.seconds) && item.seconds > 0;
  const detail = isTornado ? '' : isGrowing ? hasCountdown ? `<span class="crop-card-meta">${countdownMarkup(item)}</span>` : '<span class="crop-card-meta">Đang cập nhật thời gian…</span>' : '';
  const plantCount = Math.min(Number(item.count || 0), Math.max(0, Number(item.seedCount || 0)));
  const plantLabel = `Trồng x${plantCount}`;
  const action = isTornado || isEmpty ? '' : type === 'ready' ? `<button class="ready-collect-overlay" type="button" data-ui-action="harvest" aria-label="Collect x${item.count}">Collect x${item.count}</button>` : '';
  if (isEmpty) {
    const seedIcon = cropSeedDisplayIcon(selectedPlantSeed);
    const seedCount = getSeedCount(selectedPlantSeed);
    const canPlant = Boolean(selectedPlantSeed && seedCount > 0);
    const plantCount = Math.min(Number(item.count || 0), seedCount);
    const seedCorner = seedIcon
      ? `<button class="soil-seed-corner is-selected" type="button" data-ui-action="choose-crop-seed" title="Đổi hạt"><img src="${escapeHtml(seedIcon)}" alt="" /><b>×${formatExactCount(seedCount)}</b><span class="soil-seed-exchange" aria-label="Đổi hạt">⇄</span></button>`
      : `<button class="soil-seed-corner" type="button" data-ui-action="choose-crop-seed" title="Chọn hạt"><span>?</span></button>`;
    const plant = canPlant ? `<div class="empty-crop-overlay"><button type="button" class="empty-crop-plant" data-ui-action="plant" data-selected-seed="${escapeHtml(selectedPlantSeed.name || '')}" data-target-fertiliser-type="${item.fertiliserType || 0}" data-action-label="Trồng x${plantCount}">Trồng x${plantCount}</button></div>` : '';
    return `<article class="crop-card is-empty empty-crop-card${seedIcon ? ' has-selected-seed' : ''}" data-resource="crop" data-fertilised="${Boolean(item.fertilised)}" data-crop-name="${escapeHtml(item.label)}" data-fertiliser-type="${item.fertiliserType || 0}" data-map-keys="${escapeHtml((item.mapKeys || []).join('||'))}" data-count="${item.count}"><div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(item.icon)}" alt="" /><b class="crop-quantity">×${item.count}</b></div><div class="crop-card-content"><span class="crop-card-state">Đất trống</span><strong class="crop-card-title">${escapeHtml(item.label)}</strong></div>${seedCorner}${plant}<button class="seed-select-overlay" type="button" data-ui-action="choose-crop-seed">Select seeds</button></article>`;
  }  return `<article class="crop-card is-${type} ${type === 'ready' ? 'is-ready' : ''} ${isTornado ? 'is-tornado' : ''}" data-resource="crop" data-fertilised="${Boolean(item.fertilised)}" data-crop-name="${escapeHtml(item.label)}" data-fertiliser-type="${item.fertiliserType || 0}" data-time-group="${item.timeGroup ?? ''}" data-map-keys="${escapeHtml((item.mapKeys || []).join('||'))}" data-has-precise-seconds="${Boolean(item.hasPreciseSeconds)}" data-count="${item.count}">${tier ? `<b class="crop-tier">${tier}</b>` : ''}${item.fertilised ? `<img class="fertiliser-mark" src="${fertiliserIcon}" alt="Đã bón phân" />` : ''}${item.bee ? `<img class="bee-mark ${item.fertiliserType === 1 ? 'with-fertiliser' : ''}" src="${beeIcon}" alt="Bee" />` : ''}${item.fertiliserType === 2 ? '<img class="stopwatch-mark" src="https://sunflower-land.com/game-assets/icons/stopwatch.png" alt="Phân bón tăng tốc" />' : ''}${item.tornadoIcon ? `<img class="tornado-mark" src="${escapeHtml(item.tornadoIcon)}" alt="Tornado" />` : ''}<div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(item.icon)}" alt="" /><b class="crop-quantity">×${item.count}</b></div><div class="crop-card-content"><span class="crop-card-state">${stateLabel}</span><strong class="crop-card-title">${escapeHtml(item.label)}</strong>${detail}</div>${action}</article>`;
}

function cropSeedDisplayName(seed) {
  return String(seed?.name || 'Chưa chọn hạt').replace(/brocolli/gi, 'Broccoli');
}

function cropSeedDisplayIcon(seed) {
  const name = String(seed?.name || '').toLowerCase();
  // The game displays “Broccoli”, while its asset/DOM slug is intentionally “brocolli”.
  if (name.includes('broccoli') || name.includes('brocolli')) {
    return 'https://sunflower-land.com/game-assets/crops/brocolli/seed.png';
  }
  return seed?.icon || '';
}

