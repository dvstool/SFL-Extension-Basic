async function scanComposterDetails() {
  const [{ result }] = await executeOnSunflowerTabs({
    func: async () => {
      const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const waitFor = async (predicate, timeout = 2500) => {
        const deadline = Date.now() + timeout;
        while (Date.now() < deadline) {
          const value = predicate();
          if (value) return value;
          await sleep(30);
        }
        return null;
      };
      const parseSeconds = (text) => {
        const match = String(text || '').replace(/\b(\d+)\s*hsr\b/gi, '$1hrs').match(/\b(?=\d+\s*(?:d(?:ays?)?|h(?:r(?:s)?|ours?)?|m(?:in(?:s)?)?|s(?:ec(?:s)?)?))(?:(\d+)\s*d(?:ays?)?)?\s*(?:(\d+)\s*h(?:r(?:s)?|ours?)?)?\s*(?:(\d+)\s*m(?:in(?:s)?)?)?\s*(?:(\d+)\s*s(?:ec(?:s)?)?)?/i);
        return match && (match[1] || match[2] || match[3] || match[4]) ? Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 + Number(match[3] || 0) * 60 + Number(match[4] || 0) : null;
      };
      const dialogs = () => Array.from(document.querySelectorAll('div[data-headlessui-state="open"]')).filter((dialog) => dialog.offsetParent !== null && /Composter/.test(dialog.innerText || ''));
      const closeDialog = async (dialog) => {
        const close = dialog?.querySelector('img.flex-none.cursor-pointer.float-right[src*="/game-assets/icons/close.png"], img[src*="/game-assets/icons/close.png"]');
        if (close?.offsetParent !== null) {
          const rect = close.getBoundingClientRect();
          const options = { bubbles: true, cancelable: true, view: window, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, button: 0, buttons: 1 };
          ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click'].forEach((type) => close.dispatchEvent(typeof PointerEvent === 'function' && type.startsWith('pointer') ? new PointerEvent(type, { ...options, pointerId: 1, pointerType: 'mouse', isPrimary: true }) : new MouseEvent(type, options)));
          close.click();
          await waitFor(() => !dialog.isConnected || dialog.offsetParent === null, 1500);
          return true;
        }
        return false;
      };
      const placements = [...new Set(Array.from(document.querySelectorAll('div[data-map-placement="true"] img[alt="Compost Bin"], div[data-map-placement="true"] img[alt*="Composter"]')).map((image) => image.closest('div[data-map-placement="true"]')).filter(Boolean))];
      const details = [];
      const trace = { clicked: 0, read: 0, closed: 0 };
      for (const placement of placements) {
        const sources = Array.from(placement.querySelectorAll('img')).map((image) => image.currentSrc || image.src || '')
          .filter((value) => /\/game-assets\/composters\//i.test(value));
        // The game can retain the previous closed sprite briefly. A ready
        // sprite is authoritative, matching the map scanner and state reader.
        const ready = sources.some((source) => /_ready\.(?:webp|png)(?:[?#]|$)/i.test(source)) || Boolean(placement.querySelector('img.ready'));
        const growing = !ready && sources.some((source) => /_closed\.(?:webp|png)(?:[?#]|$)/i.test(source));
        const target = placement.querySelector('.cursor-pointer') || placement.firstElementChild || placement;
        const dialogsBefore = new Set(dialogs());
        const rect = target.getBoundingClientRect();
        const options = { bubbles: true, cancelable: true, view: window, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, button: 0, buttons: 1 };
        ['pointerdown', 'pointerup'].forEach((type) => target.dispatchEvent(typeof PointerEvent === 'function' ? new PointerEvent(type, { ...options, pointerId: 1, pointerType: 'mouse', isPrimary: true }) : new MouseEvent(type, options)));
        target.click();
        trace.clicked += 1;
        const dialog = await waitFor(() => dialogs().find((item) => !dialogsBefore.has(item)), 3000);
        if (!dialog) {
          continue;
        }
        try {
          if (growing) {
            const seconds = await waitFor(() => {
              const timer = dialog.querySelector('img[src*="/game-assets/icons/timer.png"]');
              const value = parseSeconds(timer?.parentElement?.innerText || '');
              return Number.isFinite(value) && value > 0 ? value : null;
            }, 2500);
            details.push({ mapKey: `${placement.style.top}|${placement.style.left}`, seconds: seconds || null, requirements: [], canCompost: undefined });
          } else if (!ready) {
            const compostButton = Array.from(dialog.querySelectorAll('button')).find((button) => /^Compost$/i.test(button.innerText.trim()));
            const requirementsLabel = Array.from(dialog.querySelectorAll('div, span')).find((element) => element.innerText?.trim() === 'Requirements');
            let requirementsSection = requirementsLabel || null;
            while (requirementsSection && !Array.from(requirementsSection.children).some((child) => child.classList?.contains('mt-2'))) requirementsSection = requirementsSection.parentElement;
            const requirementsContainer = Array.from(requirementsSection?.children || []).find((child) => child.classList?.contains('mt-2'));
            const requirements = Array.from(requirementsContainer?.querySelectorAll('img[alt="item"]') || []).map((image) => {
              let row = image.parentElement;
              while (row && row !== requirementsContainer && !row.classList.contains('min-h-[26px]')) row = row.parentElement;
              return { icon: image.currentSrc || image.src || '', text: row?.innerText?.trim() || '' };
            }).filter((entry) => entry.icon && entry.text);
            details.push({ mapKey: `${placement.style.top}|${placement.style.left}`, seconds: null, requirements, canCompost: Boolean(compostButton && !compostButton.disabled) });
          } else {
            details.push({ mapKey: `${placement.style.top}|${placement.style.left}`, seconds: null, requirements: [], canCompost: undefined });
          }
          trace.read += 1;
        } finally {
          if (await closeDialog(dialog)) trace.closed += 1;
        }
      }
      return { details, found: placements.length, trace };
    }
  });
  return result || { details: [], found: 0, trace: { clicked: 0, read: 0, closed: 0 } };
}

async function readComposterStates() {
  const [{ result }] = await executeOnSunflowerTabs({
    func: () => [...new Set(Array.from(document.querySelectorAll('div[data-map-placement="true"] img[alt="Compost Bin"], div[data-map-placement="true"] img[alt*="Composter"]')).map((image) => image.closest('div[data-map-placement="true"]')).filter(Boolean))].map((placement) => {
      const images = Array.from(placement.querySelectorAll('img')).filter((item) => /composter/i.test(item.alt || '') || /\/game-assets\/composters\/[^/]+\.(?:webp|png)(?:[?#]|$)/i.test(item.currentSrc || item.src || ''));
      const initialImage = images[0];
      const state = images.some((item) => /_ready\.(?:webp|png)(?:[?#]|$)/i.test(item.currentSrc || item.src || '')) || Boolean(placement.querySelector('img.ready')) ? 'ready' : images.some((item) => /_closed\.(?:webp|png)(?:[?#]|$)/i.test(item.currentSrc || item.src || '')) ? 'growing' : 'empty';
      const image = state === 'ready'
        ? images.find((item) => /_ready\.(?:webp|png)(?:[?#]|$)/i.test(item.currentSrc || item.src || '') || item.classList.contains('ready')) || initialImage
        : state === 'growing'
          ? images.find((item) => /_closed\.(?:webp|png)(?:[?#]|$)/i.test(item.currentSrc || item.src || '')) || initialImage
          : initialImage;
      const icon = image?.currentSrc || image?.src || '';
      const sourceName = icon.match(/\/composters\/([^/.]+)\.(?:webp|png)/i)?.[1] || 'Composter';
      const label = image?.alt?.trim() || sourceName.replace(/_(?:ready|closed)$/i, '').replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
      return { mapKey: `${placement.style.top}|${placement.style.left}`, label, icon, state };
    })
  });
  return Array.isArray(result) ? result : [];
}

/* Basic entitlement: inspect Composter state and timer only. No Collect or Compost action is included. */
async function scanBasicComposters() {
  if (!lastScanData?.composters) {
    await scanMap('all');
    if (!lastScanData?.composters) return false;
  }
  const states = await readComposterStates();
  applyComposterStates(states);
  const result = await scanComposterDetails();
  result.details.forEach((detail) => composterDetails.set(detail.mapKey, {
    seconds: detail.seconds,
    requirements: detail.requirements || [],
    recipe: detail.requirements || [],
    canCompost: detail.canCompost,
    updatedAt: Date.now()
  }));
  renderOverview();
  startCountdowns();
  log(`Composters scanned: ${result.details.length}/${result.found}.`);
  return Boolean(result.details.length || result.found === 0);
}