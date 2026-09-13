(() => {
  document.body.dataset.licenseTier = 'default';
  const tier = document.querySelector('#license-user-tier');
  if (tier) {
    tier.hidden = false;
    tier.dataset.tier = 'default';
    const title = tier.querySelector('.license-user-tier-name');
    const details = tier.querySelector('#license-user-details');
    if (title) title.textContent = 'Basic User';
    if (details) details.textContent = 'Free plan';
  }
  const footer = document.querySelector('#site-label');
  if (footer) footer.textContent = 'Free Basic plan';
})();
