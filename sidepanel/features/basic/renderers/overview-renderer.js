/* Overview rendering and card transition effects. */

function renderOverview(options = {}) {
  if (!overviewResults) return;
  const data = lastScanData;
  if (!data) return;
  const preservedProfession = String(options.preserveProfession || '').trim();
  const preservedSections = new Map();
  if (preservedProfession) {
    overviewResults.querySelectorAll('.overview-section[data-profession]').forEach((section) => {
      if (section.dataset.profession !== preservedProfession) preservedSections.set(section.dataset.profession, section);
    });
  }
  const cardKey = (card) => [card.dataset.resource || '', card.dataset.cropName || '', card.dataset.miningResource || '', card.dataset.mapKeys || ''].join('|');
  const cardSignature = (card) => [
    Array.from(card.classList).filter((name) => name !== 'card-appear' && name !== 'card-state-change').sort().join(' '),
    card.dataset.count || '',
    card.dataset.saltHits || '',
    card.querySelector('.crop-card-state')?.textContent?.trim() || '',
    card.querySelector('.crop-card-title')?.textContent?.trim() || '',
    card.querySelector('.crop-image')?.currentSrc || card.querySelector('.crop-image')?.src || ''
  ].join('|');
  const previousCards = new Map(Array.from(overviewResults.querySelectorAll('.crop-card')).map((card) => {
    const key = cardKey(card);
    const box = card.getBoundingClientRect();
    const parentBox = overviewResults.getBoundingClientRect();
    return [key, { html: card.outerHTML, signature: cardSignature(card), left: box.left - parentBox.left, top: box.top - parentBox.top, width: box.width, height: box.height }];
  }));
  const previousCardOrderByMapKey = new Map();
  Array.from(overviewResults.querySelectorAll('.crop-card')).forEach((card, position) => {
    String(card.dataset.mapKeys || '').split('||').filter(Boolean).forEach((mapKey) => {
      if (!previousCardOrderByMapKey.has(mapKey)) previousCardOrderByMapKey.set(mapKey, position);
    });
  });  const cropSeed = selectedPlantSeed || null;
  const fruitSeed = selectedFruitSeed || (isFruitSeed(data.heldFruitSeed) ? data.heldFruitSeed : null);
  const cropEmpty = Array.from((data.empty || []).reduce((groups, item) => {
    const key = `${item.fertiliserType || 0}|${Boolean(item.fertilised)}`;
    const current = groups.get(key) || { ...item, count: 0, mapKeys: [] };
    current.count += Number(item.count || (item.mapKeys || []).length || 0);
    current.mapKeys.push(...(item.mapKeys || []));
    groups.set(key, current);
    return groups;
  }, new Map()).values());
  const hasCropSoil = cropEmpty.length > 0;
  const hasFruitSoil = (data.fruit?.empty || []).length > 0;
  const hasFruit = Boolean((data.fruit?.empty?.length || 0) + (data.fruit?.ready?.length || 0) + (data.fruit?.growing?.length || 0) + (data.fruit?.dead?.length || 0));
  const cropCards = [
    ...cropEmpty.map((item) => cropCard({ ...item, label: 'Đất Crop trống', canPlant: Boolean(cropSeed), seedName: cropSeed?.name || '', seedIcon: cropSeed?.icon || '', seedCount: getSeedCount(cropSeed) }, 'empty')),
    ...(data.ready || []).map((item) => cropCard(item, 'ready'))
  ];
  const cropGrowingCards = (data.growing || []).map((item) => cropCard(item, 'growing'));
  const hasUnfertilisedCrop = (data.growing || []).some((item) => !item.fertilised);
  const fruitCards = [
    ...(data.fruit?.empty || []).map((item) => fruitCard(item, 'empty', fruitSeed)),
    ...(data.fruit?.ready || []).map((item) => fruitCard(item, 'ready', fruitSeed)),
    ...(data.fruit?.dead || []).map((item) => fruitCard(item, 'dead', fruitSeed))
  ];
  const fruitGrowingCards = (data.fruit?.growing || []).map((item) => fruitCard(item, 'growing', fruitSeed));
  const hasUnfertilisedFruit = (data.fruit?.growing || []).some((item) => !item.fertilised);
  const enrichComposters = (items = []) => {
    return items.flatMap((item) => (item.mapKeys || []).map((mapKey) => {
      const detail = composterDetails.get(mapKey) || {};
      return { ...item, count: 1, seconds: detail.seconds ?? item.seconds ?? null, recipe: detail.recipe || item.recipe || [], requirements: detail.requirements || item.requirements || [], canCompost: detail.canCompost, mapKeys: [mapKey] };
    }));
  };
  const composters = {
    ready: enrichComposters(data.composters?.ready),
    empty: enrichComposters(data.composters?.empty),
    growing: enrichComposters(data.composters?.growing)
  };
  const composterPosition = (item) => {
    const identity = `${item.label || ''} ${item.icon || ''}`.toLowerCase();
    if (identity.includes('premium')) return 2;
    if (identity.includes('turbo')) return 1;
    if (identity.includes('compost bin') || identity.includes('compost_bin')) return 0;
    return 99;
  };
  const composterCards = [
    ...composters.ready.map((item) => ({ item, type: 'ready' })),
    ...composters.empty.map((item) => ({ item, type: 'empty' })),
    ...composters.growing.map((item) => ({ item, type: 'growing' }))
  ].sort((left, right) => composterPosition(left.item) - composterPosition(right.item))
    .map(({ item, type }) => composterCard(item, type));
  const hasComposters = Boolean(composterCards.length);
  const readyTrees = data.trees?.ready || [];
  const growingTrees = data.trees?.growing || [];
  const treeCards = readyTrees.map((item) => treeCard(item, 'ready'));
  const treeGrowingCards = growingTrees.map((item) => treeCard(item, 'growing'));
  const miningOrder = { stone: 0, iron: 1, gold: 2 };
  const sortMining = (items) => [...items].sort((left, right) => (miningOrder[left.resource] ?? 99) - (miningOrder[right.resource] ?? 99));
  const readyMining = sortMining(data.mining?.ready || []);
  const growingMining = sortMining(data.mining?.growing || []);
  const miningCards = readyMining.map((item) => miningCard(item, 'ready'));
  const miningGrowingCards = growingMining.map((item) => miningCard(item, 'growing'));
  const saltReady = data.salt?.ready || [];
  const saltGrowing = data.salt?.growing || [];
  const saltCards = [...saltReady.map((item) => saltCard(item)), ...saltGrowing.map((item) => saltCard(item, true))];
  const dailyShipment = data.dailyShipment;
  const mushroomCards = (data.mushrooms?.wild?.count || data.mushrooms?.magic?.count) ? [mushroomCard(data.mushrooms)] : [];
  const sleepingPetCards = (data.pets?.sleeping || []).map((item) => petCard(item, 'sleeping'));
  const awakePetCards = (data.pets?.awake || []).map((item) => petCard(item, 'awake'));
  const mapCards = (() => {
    const detail = landInfo?.querySelector('.land-details');
    const balances = Array.from(landInfo?.querySelectorAll('.land-balance') || []);
    const landName = Array.from(detail?.querySelector('strong')?.childNodes || [])
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(' ') || '';
    const landIcon = detail?.querySelector('.land-thumbnail')?.currentSrc || detail?.querySelector('.land-thumbnail')?.src || '';
    const season = detail?.querySelector('span')?.textContent.trim() || '';
    const cards = [];
    if (landName) {
      cards.push(`<article class="crop-card map-overview-card map-land-card" data-resource="map-land"><div class="crop-icon-box">${landIcon ? `<img class="crop-image" src="${escapeHtml(landIcon)}" alt="" />` : '<span class="map-card-fallback">⌂</span>'}</div><div class="crop-card-content"><span class="crop-card-state">Land</span><strong class="crop-card-title">${escapeHtml(landName)}</strong>${season ? `<span class="crop-card-meta">${escapeHtml(season)}</span>` : ''}</div></article>`);
    }
    balances.forEach((balance, index) => {
      const rawLabel = balance.querySelector('img')?.alt || 'Số dư';
      const label = ({ coins: 'COINS', gems: 'GEMS', flw: 'FLOWER', flower: 'FLOWER' })[rawLabel.trim().toLowerCase()] || rawLabel.toUpperCase();
      const icon = balance.querySelector('img')?.currentSrc || balance.querySelector('img')?.src || '';
      const value = balance.querySelector('b')?.textContent.trim() || balance.textContent.trim();
      if (!value) return;
      cards.push(`<article class="crop-card map-overview-card map-${escapeHtml(label.toLowerCase())}-card" data-resource="map-balance-${index}"><div class="crop-icon-box">${icon ? `<img class="crop-image" src="${escapeHtml(icon)}" alt="" />` : '<span class="map-card-fallback">●</span>'}</div><div class="crop-card-content"><span class="crop-card-state">${escapeHtml(label)}</span><strong class="crop-card-title">${escapeHtml(value)}</strong></div></article>`);
    });
    if (dailyShipment?.icon) {
      cards.push(`<article class="crop-card map-overview-card daily-shipment-card is-ready" data-resource="daily-shipment" data-map-keys="${escapeHtml((dailyShipment.mapKeys || []).join('||'))}" data-count="${dailyShipment.count || 1}"><div class="crop-icon-box"><img class="crop-image" src="${escapeHtml(dailyShipment.icon)}" alt="Daily Shipment" />${dailyShipment.count > 1 ? `<b class="crop-quantity">×${dailyShipment.count}</b>` : ''}</div><div class="crop-card-content"><span class="crop-card-state">Restock</span><strong class="crop-card-title">Daily Shipment</strong></div><button class="daily-shipment-overlay" type="button" data-ui-action="open-daily-shipment">Free Restock</button></article>`);
    }
    return cards;
  })();
  const reloadButton = (name, scanScope) => {
    const buttonLabel = `Reload ${name}`;
    const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>';
    return scanScope === 'fertilisers'
      ? `<button class="profession-scan profession-fertiliser-scan${fertilisersScanned ? '' : ' is-unscanned'}" type="button" data-ui-action="scan-fertilisers" title="Quét túi đồ để đọc Fertilisers" aria-label="Quét Fertilisers"><img src="${fertiliserIcon}" alt="" /></button>`
      : scanScope === 'map'
      ? `<button class="profession-scan" type="button" data-ui-action="scan-map-header" title="Reload Map" aria-label="Reload Map">${icon}</button>`
      : scanScope === 'tools'
      ? `<button class="profession-scan" type="button" data-ui-action="scan-tools-header" title="Quét Tools đầy đủ" aria-label="Quét Tools đầy đủ">${icon}</button>`
      : scanScope === 'resource-tools'
      ? `<button class="profession-scan" type="button" data-ui-action="scan-resource-tools" title="Đọc số lượng Tools" aria-label="Đọc số lượng Tools">${icon}</button>`
      : scanScope === 'composter'
      ? `<button class="profession-scan" type="button" data-ui-action="scan-composter" title="${buttonLabel}" aria-label="${buttonLabel}">${icon}</button>`
      : `<button class="profession-scan" type="button" data-ui-action="scan-profession" data-scan-scope="${scanScope}" title="${buttonLabel}" aria-label="${buttonLabel}">${icon}</button>`;
  };
  const fertiliserButtons = (resource, hasUnfertilised) => {
    const icons = resource === 'fruit' ? fruitFertiliserIcons : cropFertiliserIcons;
    return `<div class="profession-fertiliser-actions">${icons.map((icon, index) => {
      const count = fertilisersScanned ? Math.max(0, Number(fertiliserCounts.get(icon)) || 0) : null;
      const state = !fertilisersScanned ? ' is-unscanned' : !count ? ' is-empty' : '';
      const canSelect = fertilisersScanned && Boolean(count) && hasUnfertilised;
      const title = fertilisersScanned
        ? (hasUnfertilised ? `Chọn để bón phân ${index + 1} cho ${resource === 'fruit' ? 'Fruit' : 'Crop'}` : `Phân bón ${index + 1}: chưa có cây cần bón`)
        : 'Quét túi đồ để đọc Fertilisers';
      const action = !fertilisersScanned ? 'scan-fertilisers' : (canSelect ? 'select-fertiliser' : '');
      return `<button class="profession-fertiliser-button${state}" type="button"${action ? ` data-ui-action="${action}"` : ''} data-resource="${resource}" data-fertiliser-index="${index}" title="${title}" aria-label="${title}"${fertilisersScanned && !canSelect ? ' disabled' : ''}><img src="${icon}" alt="" /><b>×${count === null ? '--' : formatExactCount(count)}</b></button>`;
    }).join('')}</div>`;
  };
  const professionAutoControls = (name, scanScope) => {
    if (!scanScope || scanScope === 'map') return '';
    const enabled = professionAutoEnabled.has(scanScope);
    const toggleLabel = `${enabled ? 'T\u1eaft' : 'B\u1eadt'} Auto ${name}`;
    const settingsIcon = '<svg class="map-tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    const cropAutoRunning = scanScope === 'crop' && enabled;
    const settingsAction = scanScope === 'crop' || scanScope === 'fruit' ? ` data-ui-action="configure-planting-order" data-profession="${scanScope}"` : '';
    const settingsTitle = cropAutoRunning ? 'Danh s&#225;ch h&#7841;t tr&#7891;ng Crop' : `C\u00e0i \u0111\u1eb7t Auto ${name}`;
    return `<div class="profession-auto-card" aria-label="\u0110i\u1ec1u khi\u1ec3n t\u1ef1 \u0111\u1ed9ng ${name}"><button class="profession-auto-toggle${enabled ? ' is-on' : ''}" type="button" data-ui-action="toggle-profession-auto" data-profession="${scanScope}" aria-pressed="${enabled}" title="${toggleLabel}"><span class="profession-auto-switch" aria-hidden="true"></span><span>AUTO</span></button><button class="profession-auto-settings" type="button"${settingsAction} title="${settingsTitle}" aria-label="${settingsTitle}">${settingsIcon}</button></div>`;
  };
  const section = (name, cards, growingCards = [], scanScope = '', headerScopes = [scanScope], headerExtra = '') => {
    const header = headerScopes.map((scope) => reloadButton(scope === 'fertilisers' ? 'Fertilisers' : (scope === 'tools' || scope === 'resource-tools') ? 'Tools' : name, scope)).join('');
    const autoControls = professionAutoControls(name, scanScope);
    const autoClass = scanScope === 'crop' && professionAutoEnabled.has('crop') ? ' is-auto-running' : '';
    return `<section class="overview-section overview-profession-card${autoClass}" data-profession="${scanScope || name.toLowerCase()}"><header class="overview-profession-header"><h2>${name}</h2><div class="overview-section-controls">${autoControls}${headerExtra}${header}</div></header><div class="crop-grid">${cards.join('')}</div>${growingCards.length ? `<div class="crop-grid overview-growing-grid">${growingCards.join('')}</div>` : ''}</section>`;
  };
  overviewResults.innerHTML = `<div class="activity-group" data-activity="overview">${section('Map', mapCards, [], 'map', ['map'])}${mushroomCards.length ? section('Foraging', mushroomCards, [], 'mushroom') : ''}${sleepingPetCards.length || awakePetCards.length ? section('Pet', sleepingPetCards, awakePetCards, 'pet') : ''}${section('Crop', cropCards, cropGrowingCards, 'crop', ['crop'], fertiliserButtons('crop', hasUnfertilisedCrop))}${hasFruit ? section('Fruit', fruitCards, fruitGrowingCards, 'fruit', ['fruit'], fertiliserButtons('fruit', hasUnfertilisedFruit)) : ''}${hasComposters ? section('Composter', composterCards, [], 'composter') : ''}${section('Tree', treeCards, treeGrowingCards, 'tree', ['tree'])}${section('Mining', miningCards, miningGrowingCards, 'mining', ['mining'])}${saltCards.length ? section('Salt', saltCards, [], 'salt', ['salt']) : ''}</div>`;
  preservedSections.forEach((section, profession) => {
    const replacement = overviewResults.querySelector(`.overview-section[data-profession="${CSS.escape(profession)}"]`);
    replacement?.replaceWith(section);
  });
  // All states share one grid. Ready/empty cards are promoted, while cards
  // that transition into a cooldown retain their previous map position.
  overviewResults.querySelectorAll('.overview-section').forEach((section) => {
    if (section.dataset.profession === 'composter') return;
    const grids = Array.from(section.querySelectorAll(':scope > .crop-grid'));
    if (!grids.length) return;
    const cards = grids.flatMap((grid) => Array.from(grid.querySelectorAll(':scope > .crop-card'))).map((card, index) => ({ card, index }));
    const previousPosition = (card) => {
      const positions = String(card.dataset.mapKeys || '').split('||').filter(Boolean).map((mapKey) => previousCardOrderByMapKey.get(mapKey)).filter(Number.isFinite);
      return positions.length ? Math.min(...positions) : Number.MAX_SAFE_INTEGER;
    };
    const keepsFixedPositions = section.dataset.profession === 'salt';
    const isDailyShipment = (card) => card.dataset.resource === 'daily-shipment';
    const isPriority = (card) => card.classList.contains('is-empty') || card.classList.contains('is-ready');
    cards.sort((left, right) => {
      const dailyShipmentDifference = Number(isDailyShipment(left.card)) - Number(isDailyShipment(right.card));
      if (dailyShipmentDifference) return dailyShipmentDifference;
      const priorityDifference = keepsFixedPositions ? 0 : Number(isPriority(right.card)) - Number(isPriority(left.card));
      if (priorityDifference) return priorityDifference;
      const positionDifference = previousPosition(left.card) - previousPosition(right.card);
      return positionDifference || left.index - right.index;
    });
    grids[0].append(...cards.map(({ card }) => card));
    grids.slice(1).forEach((grid) => grid.remove());
  });  const currentCards = new Set();
  overviewResults.querySelectorAll('.crop-card').forEach((card) => {
    const key = cardKey(card);
    currentCards.add(key);
    const previous = previousCards.get(key);
    if (!previous) card.classList.add('card-appear');
    else if (previous.signature !== cardSignature(card)) card.classList.add('card-state-change');
  });
  previousCards.forEach((previous, key) => {
    if (currentCards.has(key) || !previous.width || !previous.height) return;
    const leavingCard = document.createElement('div');
    leavingCard.className = 'card-leave-overlay';
    leavingCard.style.cssText = `left:${previous.left}px;top:${previous.top}px;width:${previous.width}px;height:${previous.height}px;`;
    leavingCard.innerHTML = previous.html;
    overviewResults.append(leavingCard);
    leavingCard.addEventListener('animationend', () => leavingCard.remove(), { once: true });
  });
  // Re-rendering replaces the Overview DOM node. Preserve the currently open
  // activity instead of letting the new Overview node appear by default.
  const activeActivity = mapActivityTabs.find((tab) => tab.classList.contains('is-active'))?.dataset.mapActivityTab || 'overview';
  const overviewGroup = overviewResults.querySelector('.activity-group[data-activity="overview"]');
  if (overviewGroup) overviewGroup.hidden = activeActivity !== 'overview';
  updateMapActivityTabIndicators();
  schedulePetSleepCheck();
}
