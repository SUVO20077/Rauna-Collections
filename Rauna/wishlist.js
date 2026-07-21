/**
 * wishlist.js
 * ------------------------------------------------------------------
 * Manages wishlist state (persisted via storage.js), renders the
 * slide-out wishlist drawer, and keeps every heart icon on the page
 * (homepage grid, search results, drawer itself) in sync.
 * ------------------------------------------------------------------
 */
window.RAUNA = window.RAUNA || {};

RAUNA.Wishlist = (function () {
  const { Storage, Utils, A11y, Toast, PRODUCTS, getProduct, productArtHTML } = {
    Storage: RAUNA.Storage,
    Utils: RAUNA.Utils,
    A11y: RAUNA.A11y,
    Toast: RAUNA.Toast,
    PRODUCTS: RAUNA.PRODUCTS,
    getProduct: RAUNA.getProduct,
    productArtHTML: RAUNA.productArtHTML,
  };

  let ids = Storage.get(Storage.KEYS.WISHLIST, []);
  let releaseFocusTrap = null;
  let lastFocusedEl = null;

  const drawer = document.getElementById('wishlistDrawer');
  const body = document.getElementById('wishlistBody');
  const countPill = document.getElementById('wishlistCountPill');
  const navBadge = document.getElementById('wishlistCount');

  function persist() {
    Storage.set(Storage.KEYS.WISHLIST, ids);
  }

  function has(id) {
    return ids.includes(id);
  }

  function getCount() {
    return ids.length;
  }

  /** Adds or removes a product from the wishlist and syncs the whole UI. */
  function toggle(id, sourceEl) {
    const product = getProduct(id);
    if (!product) return;

    if (has(id)) {
      ids = ids.filter((x) => x !== id);
      Toast.show('Removed from Wishlist', 'info');
    } else {
      ids = [...ids, id];
      Toast.show('Added to Wishlist ❤️', 'success');
    }
    persist();
    syncHeartButtons(id);
    if (sourceEl) A11y.bump(sourceEl);
    updateBadge();
    if (drawer.classList.contains('open')) render();
  }

  /** Updates every heart button for a given product id to match wishlist state. */
  function syncHeartButtons(id) {
    const active = has(id);
    document.querySelectorAll(`.js-wishlist-btn[data-id="${id}"]`).forEach((btn) => {
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
    });
  }

  function syncAllHeartButtons() {
    document.querySelectorAll('.js-wishlist-btn').forEach((btn) => {
      const id = btn.getAttribute('data-id');
      const active = has(id);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
    });
  }

  function updateBadge() {
    const count = getCount();
    if (!navBadge) return;
    navBadge.textContent = count;
    navBadge.hidden = count === 0;
    if (count > 0) A11y.bump(navBadge);
    if (countPill) countPill.textContent = `${count} item${count === 1 ? '' : 's'}`;
  }

  function stockLabel(stock) {
    return stock === 'low'
      ? '<span class="stock-pill low">Only a few left</span>'
      : '<span class="stock-pill in">In stock</span>';
  }

  function itemRowHTML(product) {
    return `
      <div class="dline-item" data-id="${product.id}">
        <div class="dline-thumb">${productArtHTML(product)}</div>
        <div class="dline-info">
          <h5>${Utils.escapeHtml(product.name)}</h5>
          <span class="dline-meta">${Utils.escapeHtml(product.colors[0])} · ${Utils.escapeHtml(product.sizes[0])}</span>
          <span class="dline-price">${Utils.formatINR(product.price)}${product.mrp > product.price ? ` <small style="text-decoration:line-through;color:var(--text-soft);font-size:12px;">${Utils.formatINR(product.mrp)}</small>` : ''}</span>
          ${stockLabel(product.stock)}
          <div class="dline-row">
            <div class="dline-actions">
              <button class="js-move-to-cart" data-id="${product.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"/></svg>
                Move to Cart
              </button>
              <button class="js-quick-view" data-id="${product.id}">Quick View</button>
              <button class="js-remove-wishlist" data-id="${product.id}">Remove</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function emptyStateHTML() {
    return `
      <div class="drawer-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.8-9C.6 8 2 4.5 5.4 3.8c2-.4 3.9.5 5.1 2.1a1 1 0 0 0 1 .4c.4-.1.7-.2 1-.4 1.2-1.6 3.1-2.5 5.1-2.1 3.4.7 4.8 4.2 3.2 7.7-2.3 4.4-9.8 9-9.8 9z"/></svg>
        <p>Your wishlist is empty.</p>
        <button class="cta-btn js-start-shopping">Start Shopping</button>
      </div>`;
  }

  function render() {
    if (ids.length === 0) {
      body.innerHTML = emptyStateHTML();
      return;
    }
    const items = ids.map((id) => getProduct(id)).filter(Boolean);
    body.innerHTML = items.map(itemRowHTML).join('');
  }

  function open(trigger) {
    lastFocusedEl = trigger || document.activeElement;
    render();
    drawer.classList.add('open');
    document.getElementById('scrim').classList.add('open');
    A11y.lockScroll();
    releaseFocusTrap = A11y.trapFocus(drawer);
    const closeBtn = document.getElementById('wishlistClose');
    if (closeBtn) closeBtn.focus();
    document.getElementById('wishlistIcon')?.setAttribute('aria-expanded', 'true');
  }

  function close() {
    drawer.classList.remove('open');
    document.getElementById('scrim').classList.remove('open');
    A11y.unlockScroll();
    if (releaseFocusTrap) releaseFocusTrap();
    document.getElementById('wishlistIcon')?.setAttribute('aria-expanded', 'false');
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function isOpen() {
    return drawer.classList.contains('open');
  }

  /** Wires up all static + delegated event listeners. Called once on init. */
  function init() {
    updateBadge();
    syncAllHeartButtons();

    document.getElementById('wishlistClose').addEventListener('click', close);

    // Event delegation: works for hearts that exist now (homepage grid)
    // AND hearts rendered later by search.js results.
    document.addEventListener('click', (e) => {
      const heartBtn = e.target.closest('.js-wishlist-btn');
      if (heartBtn) {
        toggle(heartBtn.getAttribute('data-id'), heartBtn);
        return;
      }
      const removeBtn = e.target.closest('.js-remove-wishlist');
      if (removeBtn) {
        toggle(removeBtn.getAttribute('data-id'));
        return;
      }
      const moveBtn = e.target.closest('.js-move-to-cart');
      if (moveBtn) {
        const id = moveBtn.getAttribute('data-id');
        RAUNA.Cart.addItem(id, 1);
        toggle(id); // remove from wishlist after moving
        return;
      }
      const quickViewBtn = e.target.closest('.js-quick-view');
      if (quickViewBtn) {
        RAUNA.Navbar.quickView(quickViewBtn.getAttribute('data-id'));
        return;
      }
      if (e.target.closest('.js-start-shopping')) {
        close();
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  return { init, open, close, isOpen, toggle, has, getCount, render };
})();
