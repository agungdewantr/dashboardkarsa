/**
 * Animate a number counting up from 0 to target
 */
export function animateValue(element, target, duration = 800) {
  const start = 0;
  const startTime = performance.now();
  const formatted = formatNumber(target);

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * eased);

    element.textContent = formatNumber(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatted;
    }
  }

  element.classList.add('value-animate');
  requestAnimationFrame(update);
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Render trend badge
 */
export function renderTrend(container, percentage) {
  const isUp = percentage > 0;
  const isNeutral = percentage === 0;
  const arrow = isUp ? '↗' : percentage < 0 ? '↘' : '→';
  const cls = isUp ? 'up' : isNeutral ? 'neutral' : 'down';
  const prefix = isUp ? '+' : '';

  const badge = container.querySelector('.trend-badge');
  const label = container.querySelector('.trend-label');

  badge.className = `trend-badge ${cls}`;
  badge.textContent = `${arrow} ${prefix}${percentage}%`;
  label.textContent = 'vs kemarin';
}

/**
 * Update a stat card with data
 */
export function updateCard(cardId, data) {
  const valueEl = document.getElementById(`${cardId}Value`);
  const trendEl = document.getElementById(`${cardId}Trend`);

  if (valueEl) {
    animateValue(valueEl, data.total);
  }

  if (trendEl) {
    renderTrend(trendEl, data.percentage);
  }
}
