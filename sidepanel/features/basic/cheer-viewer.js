/* Read-only Following list for the Basic edition. */
(() => {
  const tab = document.querySelector('[data-map-activity-tab="cheer"]');
  if (!tab || !cheerResults) return;

  const escape = (value) => escapeHtml(String(value || ''));
  const render = (scan) => {
    const players = Array.isArray(scan?.players) ? scan.players : [];
    if (!players.length) {
      cheerResults.innerHTML = `<div class="empty-state">${escape(scan?.message || 'No players found in Following.')}</div>`;
      return;
    }
    const summary = Number.isFinite(scan.followingCount)
      ? `Following (${scan.followingCount}) · Read ${players.length} players`
      : `Read ${players.length} players`;
    cheerResults.innerHTML = `<p class="cheer-summary">${escape(summary)}</p>${players.map((player) => {
      const avatar = player.avatar
        ? `<img class="cheer-avatar" src="${escape(player.avatar)}" alt="" />`
        : '<span class="cheer-avatar-placeholder">♥</span>';
      const icons = (player.icons || []).map((source) => `<img class="cheer-player-icon" src="${escape(source)}" alt="" />`).join('');
      const streak = player.streak ? `<b class="cheer-streak">🔥 ${escape(player.streak)}</b>` : '';
      const actions = `<span class="cheer-card-actions"><button class="cheer-action-button cheer-action-button--cheer" type="button" data-cheer-action="cheer" aria-label="Cheer ${escape(player.name)}"><img src="https://sunflower-land.com/game-assets/icons/rocket.png" alt="" />Cheer</button><button class="cheer-action-button" type="button" data-cheer-action="help" aria-label="Help ${escape(player.name)}"><img src="https://sunflower-land.com/game-assets/icons/search.png" alt="" />Help</button></span>`;
      return `<article class="cheer-card${player.streak ? '' : ' no-streak'}" aria-label="${escape(player.name)}">${avatar}<div class="cheer-player-info"><strong class="cheer-name">${escape(player.name)}</strong>${icons ? `<span class="cheer-player-icons">${icons}</span>` : ''}</div>${streak}${actions}</article>`;
    }).join('')}`;
  };

  async function scanFollowing() {
    cheerResults.innerHTML = '<div class="empty-state">Reading Following…</div>';
    try {
      const [{ result }] = await executeOnSunflowerTabs({
        func: async () => {
          const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          const visible = (element) => {
            if (!element || !element.getClientRects().length) return false;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          };
          const normalise = (value) => String(value || '').replace(/\s+/g, ' ').trim();
          const followingTab = () => Array.from(document.querySelectorAll('span')).find((item) => visible(item) && /^Following\s*\(\d+\)$/i.test(item.textContent.trim()));
          const searchInput = () => Array.from(document.querySelectorAll('input[placeholder="Search following..."]')).find(visible);
          let input = searchInput();
          if (!input) {
            const following = followingTab();
            if (!following) return { error: 'Open the game Social panel first.' };
            following.click();
            const deadline = Date.now() + 5000;
            while (!(input = searchInput()) && Date.now() < deadline) await sleep(50);
          }
          if (!input) return { error: 'Following is not ready yet.' };
          const panel = input.closest('div.flex.flex-col.gap-2.h-full.w-full') || input.parentElement?.parentElement?.parentElement || document.body;
          const read = () => Array.from(panel.querySelectorAll('div.cursor-pointer')).filter((card) => visible(card) && card.querySelector('img#idle')).map((card) => {
            const texts = Array.from(card.querySelectorAll('.text-xs')).map((item) => normalise(item.textContent));
            const name = texts.find((text) => text && !/^\d[\d,.]*k?$/i.test(text) && !/^Streak\s*:/i.test(text)) || '';
            return {
              name,
              streak: card.innerText.match(/\bStreak\s*:\s*(\d+)\b/i)?.[1] || '',
              avatar: card.querySelector('img#idle')?.currentSrc || card.querySelector('img#idle')?.src || '',
              icons: Array.from(card.querySelectorAll('div.flex.items-center.gap-1.flex-wrap img')).map((image) => image.currentSrc || image.src || '').filter(Boolean)
            };
          }).filter((player) => player.name);
          let players = read();
          const deadline = Date.now() + 5000;
          while (!players.length && Date.now() < deadline) { await sleep(250); players = read(); }
          return { players, followingCount: Number(followingTab()?.textContent.match(/\d+/)?.[0]) || null, message: 'No players found in Following.' };
        }
      });
      if (result?.error) throw new Error(result.error);
      render(result);
    } catch (error) {
      render({ message: error?.message || 'Unable to read Following.' });
    }
  }

  tab.addEventListener('click', () => { void scanFollowing(); });
})();
