function pickaxeSource(resource) {
  const tool = pickaxeTools[resource];
  if (!tool) return '';
  return Array.from(toolCounts.keys()).find((source) => tool.pattern.test(source)) || '';
}

function resourceToolBadge(source, fallback, name, count, state = '') {
  const icon = source || fallback || '';
  const needsLoad = state.includes('is-unscanned');
  const title = needsLoad ? 'Scan tool counts' : `${name} ×${count}`;
  const action = needsLoad
    ? '<button class="resource-tool-buy" type="button" data-ui-action="scan-resource-tools" title="Scan tool counts" aria-label="Scan tool counts">Scan</button>'
    : `<button class="resource-tool-buy" type="button" data-ui-action="open-tool-shop" data-tool-icon="${escapeHtml(icon)}" title="Buy ${escapeHtml(name)}" aria-label="Buy ${escapeHtml(name)}">Buy</button>`;
  return `<span class="resource-tool-count${state}" title="${escapeHtml(title)}"><img src="${escapeHtml(icon)}" alt="" /><b>×${escapeHtml(count)}</b>${action}</span>`;
}
/* Markup for map resources other than Crop and Fruit. */

function miningCard(item, type) {
  const growing = type === 'growing';
  const scannedToolIcon = pickaxeSource(item.resource);
  const tool = pickaxeTools[item.resource] || {};
  const toolCount = scannedToolIcon ? (toolCounts.get(scannedToolIcon) ?? 0) : toolBagScanned ? 0 : '—';
  const toolBadgeState = toolBagScanned && !Number(toolCount) ? ' is-empty' : toolBagScanned ? '' : ' is-unscanned';
  const toolBadge = resourceToolBadge(scannedToolIcon, tool.fallback, tool.name || 'Pickaxe', toolCount, toolBadgeState);
  const needsToolScan = !growing && !toolBagScanned;
  const toolUnavailable = !growing && toolBagScanned && !Number(toolCount);
  const detail = growing ? (Number.isFinite(item.seconds) ? countdownMarkup(item) : 'Đang cập nhật thời gian…') : '';
  const rockCount = Number(item.count || 0);
  const maxMines = toolBagScanned && Number.isFinite(Number(toolCount)) ? Math.min(rockCount, Math.max(0, Number(toolCount))) : 0;
  const mineLabel = `Mine x${maxMines}`;
  const action = growing ? '' : needsToolScan
    ? '<button class="resource-card-hover-overlay is-tool-scan" type="button" data-ui-action="scan-resource-tools">Scan tool counts</button>'
    : maxMines
      ? `<button class="resource-card-hover-overlay" type="button" data-ui-action="mine" data-action-label="${mineLabel}">${mineLabel}</button>`
      : '<span class="resource-card-hover-overlay is-unavailable">No Pickaxe</span>';
  return `<article class="crop-card tree-card mining-card is-${growing ? 'growing' : 'ready'} ${growing ? '' : 'is-ready'}${needsToolScan ? ' needs-tool-scan' : toolUnavailable ? ' is-tool-insufficient' : ''}" data-resource="mining" data-mining-resource="${item.resource}" data-map-keys="${escapeHtml((item.mapKeys || []).join('||'))}" data-count="${item.count}"><div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.label)}" /><b class="crop-quantity">×${item.count}</b></div><div class="crop-card-content"><span class="crop-card-state">${growing ? 'RECOVERING' : 'READY'}</span><strong class="crop-card-title">${escapeHtml(item.label)}</strong>${detail ? `<span class="crop-card-meta">${detail}</span>` : ''}</div>${toolBadge}${action}</article>`;
}

function saltRakeSource() {
  return Array.from(toolCounts.keys()).find((source) => /salt[_-]?rake/i.test(source));
}

function saltCard(item, growing = false) {
  const rakeSource = saltRakeSource();
  const rakeIcon = rakeSource || saltRakeFallback;
  const rakeCount = rakeSource ? (toolCounts.get(rakeSource) ?? 0) : toolBagScanned ? 0 : '—';
  const rakeBadgeState = toolBagScanned && !Number(rakeCount) ? ' is-empty' : toolBagScanned ? '' : ' is-unscanned';
  const rakeBadge = resourceToolBadge(rakeSource, saltRakeFallback, 'Salt Rake', rakeCount, rakeBadgeState);
  if (growing) {
    const hasCountdown = Number.isFinite(item.seconds) && item.seconds > 0;
    const detail = hasCountdown ? countdownMarkup(item) : 'Đang cập nhật thời gian…';
    return `<article class="crop-card tree-card salt-card is-growing" data-resource="salt" data-map-keys="${escapeHtml((item.mapKeys || []).join('||'))}" data-count="${item.count}"><div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(item.icon)}" alt="Salt" /><b class="crop-quantity">×${item.count}</b></div><div class="crop-card-content"><span class="crop-card-state">Đang hồi</span><strong class="crop-card-title">Salt</strong><span class="crop-card-meta">${detail}</span></div>${rakeBadge}</article>`;
  }
  const needsToolScan = !toolBagScanned;
  const lacksRake = toolBagScanned && (!rakeSource || !Number(toolCounts.get(rakeSource)));
  const toolUnavailable = lacksRake;
  const hits = Math.max(1, Number(item.hits) || 1);
  const unavailable = lacksRake || needsToolScan;
  const action = needsToolScan
    ? '<button class="resource-card-hover-overlay is-tool-scan" type="button" data-ui-action="scan-resource-tools">Scan tool counts</button>'
    : `<button class="salt-rake-button${unavailable ? ' is-insufficient' : ''}" type="button" data-ui-action="harvest-salt" data-requested-salt-hits="${hits}"${unavailable ? ' disabled' : ''}><img src="${escapeHtml(rakeIcon)}" alt="Salt Rake" /><span>×${hits}</span></button>`;
  return `<article class="crop-card tree-card salt-card is-ready${needsToolScan ? ' needs-tool-scan' : toolUnavailable ? ' is-tool-insufficient' : ''}" data-resource="salt" data-salt-hits="${hits}" data-map-keys="${escapeHtml((item.mapKeys || []).join('||'))}" data-count="${item.count}"><div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(item.icon)}" alt="Salt" /><b class="crop-quantity">×${item.count}</b></div><div class="crop-card-content"><span class="crop-card-state">READY</span><strong class="crop-card-title">Salt</strong></div>${rakeBadge}<div class="crop-card-actions">${action}</div></article>`;
}

function mushroomCard(mushrooms) {
  const wild = mushrooms.wild || { count: 0, mapKeys: [] };
  const magic = mushrooms.magic || { count: 0, mapKeys: [] };
  const mapKeys = [...(wild.mapKeys || []), ...(magic.mapKeys || [])];
  const count = Number(wild.count || 0) + Number(magic.count || 0);
  const item = (type, label, amount) => `<span class="mushroom-count${amount ? '' : ' is-empty'}" title="${label}"><i class="mushroom-icon mushroom-icon-${type}" aria-hidden="true"></i><b>×${amount}</b></span>`;
  return `<article class="crop-card mushroom-card is-ready" data-resource="mushroom" data-map-keys="${escapeHtml(mapKeys.join('||'))}" data-count="${count}"><div class="mushroom-summary"><div><span class="crop-card-state">READY</span><strong class="crop-card-title">Nấm hoang</strong></div><div class="mushroom-counts">${item('wild', 'Wild Mushroom', wild.count || 0)}${item('magic', 'Magic Mushroom', magic.count || 0)}</div></div><button type="button" data-ui-action="harvest-mushrooms">Thu hoạch</button></article>`;
}

function petCard(item, state = 'sleeping') {
  const sleeping = state === 'sleeping';
  const action = sleeping ? '<div class="crop-card-actions"><button type="button" data-ui-action="wake-pet">Đánh thức</button></div>' : '';
  return `<article class="crop-card tree-card pet-card is-growing" data-resource="pet" data-pet-state="${sleeping ? 'sleeping' : 'awake'}" data-map-keys="${escapeHtml((item.mapKeys || []).join('||'))}" data-count="${item.count}"><div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.label)}" /><b class="crop-quantity">×${item.count}</b></div><div class="crop-card-content"><span class="crop-card-state">${sleeping ? 'Đang ngủ' : 'Activity'}</span><strong class="crop-card-title">${escapeHtml(item.label)}</strong></div>${action}</article>`;
}

function composterCard(item, type) {
  const growing = type === 'growing';
  const empty = type === 'empty';
  const ready = type === 'ready';
  const hasCountdown = growing && Number.isFinite(item.seconds) && item.seconds > 0;
  const needsComposterLoad = (growing && !hasCountdown) || (empty && typeof item.canCompost !== 'boolean');
  const insufficient = empty && item.canCompost === false;
  const state = ready ? 'READY' : needsComposterLoad ? 'UNKNOWN' : insufficient ? 'NO INPUT' : empty ? 'EMPTY' : 'COMPOSTING';
  const detail = growing ? (hasCountdown ? countdownMarkup(item) : 'Tap to check') : ready ? 'Tap to collect' : needsComposterLoad ? 'Tap to check' : 'Tap to compost';
  const recipe = (item.requirements || item.recipe || []).map((entry) => {
    const amounts = String(entry.text || '').match(/([\d.,]+)\s*\/\s*([\d.,]+)/);
    const available = Number(amounts?.[1]?.replace(/,/g, ''));
    const needed = Number(amounts?.[2]?.replace(/,/g, ''));
    const missing = Number.isFinite(available) && Number.isFinite(needed) && available < needed;
    return `<span class="compost-tooltip-item${missing ? ' is-missing' : ''}">${entry.icon ? `<img src="${escapeHtml(entry.icon)}" alt="" />` : ''}<b>${escapeHtml(entry.text)}</b></span>`;
  }).join('');
  const canCompost = empty && item.canCompost === true;
  const readyAction = ready ? '<button class="composter-collect-overlay" type="button" data-ui-action="collect-composter">Collect</button>' : '';
  const emptyInteraction = canCompost
    ? `<button class="composter-action-overlay" type="button" data-ui-action="compost"><b>Compost</b>${recipe ? `<span>${recipe}</span>` : ''}</button>`
    : insufficient ? `<div class="composter-recipe-overlay"><b>Not enough items</b><span>${recipe || 'Không đủ nguyên liệu'}</span></div>` : '';
  return `<article class="crop-card composter-card is-${type} ${ready ? 'is-ready' : ''}${needsComposterLoad ? ' needs-composter-load' : ''}${canCompost ? ' can-compost' : ''}${insufficient ? ' is-insufficient' : ''}" data-resource="composter" data-map-keys="${escapeHtml((item.mapKeys || []).join('||'))}" data-count="${item.count}"><div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(item.icon)}" alt="" /><b class="crop-quantity">×${item.count}</b></div><div class="crop-card-content"><span class="crop-card-state">${state}</span><strong class="crop-card-title">${escapeHtml(item.label)}</strong><span class="crop-card-meta">${detail}</span></div>${readyAction}${emptyInteraction}${needsComposterLoad ? '<button class="composter-load-overlay" type="button" data-ui-action="scan-composter"><img src="https://cdn-icons-png.flaticon.com/512/159/159061.png" alt="" />Tap to check</button>' : ''}</article>`;
}
