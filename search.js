/**
 * search.js
 * ------------------------------------------------------------------
 * Premium animated search overlay with live (as-you-type) results,
 * typo-tolerant fuzzy matching across multiple product fields,
 * recent/trending/popular suggestions, and an empty state with
 * fallback recommendations.
 * ------------------------------------------------------------------
 */
window.RAUNA = window.RAUNA || {};

RAUNA.Search = (function () {
  const Storage = RAUNA.Storage;
  const Utils = RAUNA.Utils;
  const A11y = RAUNA.A11y;
  const PRODUCTS = RAUNA.PRODUCTS;
  const productArtHTML = RAUNA.productArtHTML;

  const TRENDING = ['Custom Hoodie', 'Oversized Tee', 'Tote Bag', 'Photo Mug', 'Monsoon Edit'];
  const RECENT_LIMIT = 6;

  let recent = Storage.get(Storage.KEYS.RECENT_SEARCHES, []);
  let releaseFocusTrap = null;
  let lastFocusedEl = null;

  const overlay = document.getElementById('searchOverlay');
  const input = document.getElementById('searchInput');
  const bodyEl = document.getElementById('searchBody');
  const closeBtn = document.getElementById('searchClose');

  function persistRecent() {
    Storage.set(Storage.KEYS.RECENT_SEARCHES, recent);
  }

  function addRecent(term) {
    const clean = term.trim();
    if (!clean) return;
    recent = [clean, ...recent.filter((r) => r.toLowerCase() !== clean.toLowerCase())].slice(0, RECENT_LIMIT);
    persistRecent();
  }

  function clearRecent() {
    recent = [];
    persistRecent();
    renderSuggestions();
  }

  /** Scores a product against a query across every searchable field. */
  function scoreProduct(product, query) {
    const fields = [
      [product.name, 3],
      [product.category, 2],
      [product.collection, 1.5],
      [product.brand, 1],
      [product.description, 1],
      [product.sku, 2],
      [product.tags.join(' '), 1.5],
      [product.colors.join(' '), 1],
      [product.sizes.join(' '), 0.8],
    ];
    let total = 0;
    for (const [text, weight] of fields) {
      total += Utils.fuzzyScore(text, query) * weight;
    }
    return total;
  }

  function search(query) {
    const q = query.trim();
    if (!q) return [];
    return PRODUCTS.map((p) => ({ product: p, score: scoreProduct(p, q) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.product);
  }

  function starsHTML() {
    return `<svg viewBox="0 0 20 20" width="11" height="11" fill="var(--gold)"><path d="M10 1l2.6 6 6.4.5-4.9 4.3 1.5 6.2L10 14.9 4.4 18l1.5-6.2L1 7.5 7.4 7z"/></svg>`;
  }

  function resultCardHTML(product) {
    const wishlisted = RAUNA.Wishlist.has(product.id);
    return `
      <div class="sr-card" data-id="${product.id}" role="button" tabindex="0" aria-label="View ${Utils.escapeHtml(product.name)}">
        <div class="sr-thumb">${productArtHTML(product)}</div>
        <div class="sr-info">
          <h5>${Utils.escapeHtml(product.name)}</h5>
          <span class="sr-cat">${Utils.escapeHtml(product.category)} · ${starsHTML()} ${product.rating}</span>
          <div class="sr-price">${Utils.formatINR(product.price)}${product.mrp > product.price ? ` <small style="font-size:11px;color:var(--text-soft);text-decoration:line-through;">${Utils.formatINR(product.mrp)}</small>` : ''}</div>
        </div>
        <div class="sr-actions">
          <button class="js-wishlist-btn ${wishlisted ? 'active' : ''}" data-id="${product.id}" aria-label="Toggle wishlist">
            <svg viewBox="0 0 24 24" stroke-width="1.8"><path d="M12 20.5s-7.5-4.6-9.8-9C.6 8 2 4.5 5.4 3.8c2-.4 3.9.5 5.1 2.1a1 1 0 0 0 1 .4c.4-.1.7-.2 1-.4 1.2-1.6 3.1-2.5 5.1-2.1 3.4.7 4.8 4.2 3.2 7.7-2.3 4.4-9.8 9-9.8 9z"/></svg>
          </button>
          <button class="js-quickadd-btn" data-id="${product.id}" aria-label="Add to cart">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round"><path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"/></svg>
          </button>
        </div>
      </div>`;
  }

  function chipHTML(label, iconPath = 'M5 12h14M13 5l7 7-7 7') {
    return `<button class="chip js-suggestion-chip" data-term="${Utils.escapeHtml(label)}">${Utils.escapeHtml(label)} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="${iconPath}"/></svg></button>`;
  }

  /** Suggestions shown before the person has typed anything. */
  function renderSuggestions() {
    const categories = [...new Set(PRODUCTS.map((p) => p.category))].slice(0, 6);
    const bestsellers = PRODUCTS.filter((p) => p.isBestseller).slice(0, 4);

    bodyEl.innerHTML = `
      ${recent.length ? `
      <div class="search-section">
        <h6>Recent Searches <button class="js-clear-recent">Clear</button></h6>
        <div class="chip-row">${recent.map((r) => chipHTML(r)).join('')}</div>
      </div>` : ''}
      <div class="search-section">
        <h6>Trending Searches</h6>
        <div class="chip-row">${TRENDING.map((t) => chipHTML(t)).join('')}</div>
      </div>
      <div class="search-section">
        <h6>Popular Categories</h6>
        <div class="chip-row">${categories.map((c) => chipHTML(c)).join('')}</div>
      </div>
      <div class="search-section">
        <h6>Popular Products</h6>
        <div class="search-results">${bestsellers.map(resultCardHTML).join('')}</div>
      </div>
    `;
  }

  function renderEmptyState(query) {
    const recommended = PRODUCTS.filter((p) => p.isBestseller).slice(0, 2);
    const newArrivals = PRODUCTS.filter((p) => p.isNew).slice(0, 2);
    bodyEl.innerHTML = `
      <div class="search-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <p><strong>No products found</strong> for "${Utils.escapeHtml(query)}"</p>
        <p style="font-size:12.5px;">Try a different word, or check the spelling.</p>
      </div>
      <div class="search-section">
        <h6>Recommended Products</h6>
        <div class="search-results">${recommended.map(resultCardHTML).join('')}</div>
      </div>
      <div class="search-section">
        <h6>New Arrivals</h6>
        <div class="search-results">${newArrivals.map(resultCardHTML).join('')}</div>
      </div>
    `;
  }

  function renderResults(products) {
    bodyEl.innerHTML = `
      <div class="search-section">
        <h6>${products.length} Result${products.length === 1 ? '' : 's'}</h6>
        <div class="search-results">${products.map(resultCardHTML).join('')}</div>
      </div>
    `;
  }

  const runSearch = Utils.debounce((query) => {
    if (!query.trim()) {
      renderSuggestions();
      return;
    }
    const results = search(query);
    if (results.length === 0) {
      renderEmptyState(query);
    } else {
      renderResults(results);
    }
  }, 150);

  function goToProduct(id) {
    // No standalone product-page exists in this build, so we scroll to and
    // briefly highlight the matching card on the homepage grid instead.
    close();
    const card = document.querySelector(`#prodGrid .prod-card[data-id="${id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.transition = 'box-shadow .3s ease';
      card.style.boxShadow = '0 0 0 3px var(--gold)';
      setTimeout(() => (card.style.boxShadow = ''), 1600);
    } else {
      RAUNA.Toast.show('Full product page coming soon.', 'info');
    }
  }

  function open(trigger) {
    lastFocusedEl = trigger || document.activeElement;
    renderSuggestions();
    overlay.classList.add('open');
    document.getElementById('scrim').classList.add('open');
    A11y.lockScroll();
    releaseFocusTrap = A11y.trapFocus(overlay);
    input.value = '';
    input.focus();
    document.getElementById('searchIcon')?.setAttribute('aria-expanded', 'true');
  }

  function close() {
    overlay.classList.remove('open');
    document.getElementById('scrim').classList.remove('open');
    A11y.unlockScroll();
    if (releaseFocusTrap) releaseFocusTrap();
    document.getElementById('searchIcon')?.setAttribute('aria-expanded', 'false');
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function isOpen() {
    return overlay.classList.contains('open');
  }

  function toggle() {
    isOpen() ? close() : open();
  }

  function init() {
    input.addEventListener('input', (e) => runSearch(e.target.value));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        addRecent(input.value);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        bodyEl.querySelector('.sr-card')?.focus();
      }
    });

    // Roving arrow-key navigation between result cards.
    bodyEl.addEventListener('keydown', (e) => {
      const card = e.target.closest('.sr-card');
      if (!card) return;
      const cards = Array.from(bodyEl.querySelectorAll('.sr-card'));
      const idx = cards.indexOf(card);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        cards[idx + 1]?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        cards[idx - 1]?.focus();
      } else if (e.key === 'Enter') {
        goToProduct(card.getAttribute('data-id'));
      }
    });

    closeBtn.addEventListener('click', close);

    // Click delegation inside the search panel: chips, cards, clear-recent.
    bodyEl.addEventListener('click', (e) => {
      if (e.target.closest('.js-wishlist-btn') || e.target.closest('.js-quickadd-btn')) return; // handled by their own modules
      const chip = e.target.closest('.js-suggestion-chip');
      if (chip) {
        const term = chip.getAttribute('data-term');
        input.value = term;
        addRecent(term);
        runSearch(term);
        return;
      }
      if (e.target.closest('.js-clear-recent')) {
        clearRecent();
        return;
      }
      const card = e.target.closest('.sr-card');
      if (card) goToProduct(card.getAttribute('data-id'));
    });

    return { open, close, isOpen, toggle };
  }

  return { init, open, close, isOpen, toggle };
})();
