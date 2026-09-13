(() => {
  const diamondActions = new Set(['toggle-profession-auto', 'configure-planting-order']);
  const basicScanActions = new Set(['scan-map-header', 'scan-profession', 'scan-composter']);

  function requiredTier(source) {
    if (source.closest('.profession-auto-card') || diamondActions.has(source.dataset.uiAction)) return 'diamond';
    return 'gold';
  }

  function lockOwner(source) {
    if (!(source instanceof HTMLElement) || source.id === 'scan-map' || basicScanActions.has(source.dataset.uiAction)) return;
    const owner = source.closest('.profession-auto-card') || source.closest('.crop-card') || source.closest('.cheer-card') || source;
    const tier = requiredTier(source);
    source.classList.remove('is-feature-locked');
    owner.dataset.featureRequired = tier;
    owner.dataset.featureUpgrade = tier === 'diamond' ? 'Diamond User' : 'Gold User';
    owner.classList.add('is-feature-locked');
    owner.setAttribute('aria-disabled', 'true');
  }

  function applyLocks(root = document) {
    if (root instanceof HTMLElement && root.matches('#map-panel .profession-auto-card, #map-panel [data-ui-action]')) lockOwner(root);
    if (root instanceof HTMLElement && root.matches('#map-panel .cheer-card')) {
      root.dataset.featureRequired = 'gold';
      root.dataset.featureUpgrade = 'Gold User';
      root.classList.add('is-feature-locked');
      root.setAttribute('aria-disabled', 'true');
    }    root.querySelectorAll?.('#map-panel .profession-auto-card').forEach(lockOwner);
    root.querySelectorAll?.('#map-panel [data-ui-action]').forEach(lockOwner);
    root.querySelectorAll?.('#map-panel .cheer-card').forEach((card) => {
      card.dataset.featureRequired = 'gold';
      card.dataset.featureUpgrade = 'Gold User';
      card.classList.add('is-feature-locked');
      card.setAttribute('aria-disabled', 'true');
    });
  }

  document.addEventListener('click', (event) => {
    const action = event.target.closest?.('#map-panel [data-ui-action]');
    if (action && basicScanActions.has(action.dataset.uiAction)) {
      event.preventDefault();
      if (action.dataset.uiAction === 'scan-composter') {
        void scanBasicComposters();
        return;
      }
      const scope = action.dataset.uiAction === 'scan-map-header' ? 'all' : action.dataset.scanScope || 'all';
      void scanMap(scope);
      return;
    }
    const locked = event.target.closest?.('#map-panel .is-feature-locked');
    if (!locked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  applyLocks();
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) applyLocks(node);
    }));
  }).observe(document.querySelector('#map-panel'), { childList: true, subtree: true });
})();
