/**
 * cart.js
 * ------------------------------------------------------------------
 * Manages cart state (persisted via storage.js): add/remove items,
 * quantity stepper logic, live subtotal/GST/shipping/total math,
 * a small demo coupon system, and rendering of the cart drawer.
 *
 * Cart line items are keyed by `${productId}__${color}__${size}` so
 * the same product in two different colors/sizes is tracked as two
 * separate lines, like a real storefront.
 * ------------------------------------------------------------------
 */
window.RAUNA = window.RAUNA || {};

RAUNA.Cart = (function () {
  const Storage = RAUNA.Storage;
  const Utils = RAUNA.Utils;
  const A11y = RAUNA.A11y;
  const Toast = RAUNA.Toast;
  const getProduct = RAUNA.getProduct;
  const productArtHTML = RAUNA.productArtHTML;

  // line = { key, productId, color, size, qty }
  let lines = Storage.get(Storage.KEYS.CART, []);
  let appliedCoupon = null; // { code, rate }
  let releaseFocusTrap = null;
  let lastFocusedEl = null;

  const COUPONS = {
    RAUNA10: 0.10,
    WELCOME50: 0.05,
  };

  const FREE_SHIPPING_THRESHOLD = 999;
  const FLAT_SHIPPING = 99;
  const GST_RATE = 0.05;

  const drawer = document.getElementById('cartDrawer');
  const body = document.getElementById('cartBody');
  const summaryEl = document.getElementById('cartSummary');
  const countPill = document.getElementById('cartCountPill');
  const navBadge = document.getElementById('cartCount');

  function persist() {
    Storage.set(Storage.KEYS.CART, lines);
  }

  function lineKey(productId, color, size) {
    return `${productId}__${color}__${size}`;
  }

  function getCount() {
    return lines.reduce((sum, l) => sum + l.qty, 0);
  }

  /** Adds a product to the cart (defaults to its first color/size). */
  function addItem(productId, qty = 1, color, size) {
    const product = getProduct(productId);
    if (!product) return;
    const c = color || product.colors[0];
    const s = size || product.sizes[0];
    const key = lineKey(productId, c, s);

    const existing = lines.find((l) => l.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      lines.push({ key, productId, color: c, size: s, qty });
    }
    persist();
    Toast.show('Added to Cart 🛍️', 'success');
    updateBadge();
    if (drawer.classList.contains('open')) render();
  }

  function updateQty(key, delta) {
    const line = lines.find((l) => l.key === key);
    if (!line) return;
    line.qty = Utils.clamp(line.qty + delta, 0, 99);
    if (line.qty === 0) {
      lines = lines.filter((l) => l.key !== key);
      Toast.show('Removed from Cart', 'info');
    }
    persist();
    updateBadge();
    render();
  }

  function removeItem(key) {
    lines = lines.filter((l) => l.key !== key);
    persist();
    Toast.show('Removed from Cart', 'info');
    updateBadge();
    render();
  }

  function applyCoupon(code) {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    if (COUPONS[clean]) {
      appliedCoupon = { code: clean, rate: COUPONS[clean] };
      Toast.show(`Coupon Applied — ${Math.round(COUPONS[clean] * 100)}% off`, 'success');
    } else {
      appliedCoupon = null;
      Toast.show('Invalid coupon code', 'error');
    }
    render();
  }

  function computeTotals() {
    let subtotal = 0;
    let savings = 0;
    lines.forEach((l) => {
      const p = getProduct(l.productId);
      if (!p) return;
      subtotal += p.price * l.qty;
      savings += (p.mrp - p.price) * l.qty;
    });
    const couponDiscount = appliedCoupon ? subtotal * appliedCoupon.rate : 0;
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
    const gst = Math.round((subtotal - couponDiscount) * GST_RATE);
    const grandTotal = Math.max(0, subtotal - couponDiscount + shipping + gst);
    return { subtotal, savings, couponDiscount, shipping, gst, grandTotal };
  }

  function updateBadge() {
    const count = getCount();
    if (!navBadge) return;
    navBadge.textContent = count;
    navBadge.hidden = count === 0;
    if (count > 0) A11y.bump(navBadge);
    if (countPill) countPill.textContent = `${count} item${count === 1 ? '' : 's'}`;
  }

  function lineRowHTML(line) {
    const p = getProduct(line.productId);
    if (!p) return '';
    const lineTotal = p.price * line.qty;
    return `
      <div class="dline-item" data-key="${line.key}">
        <div class="dline-thumb">${productArtHTML(p)}</div>
        <div class="dline-info">
          <h5>${Utils.escapeHtml(p.name)}</h5>
          <span class="dline-meta">${Utils.escapeHtml(line.color)} · ${Utils.escapeHtml(line.size)} · Delivery in 2–5 days</span>
          <span class="dline-price">${Utils.formatINR(lineTotal)}</span>
          <div class="dline-row">
            <div class="qty-stepper">
              <button class="js-qty-dec" data-key="${line.key}" aria-label="Decrease quantity">−</button>
              <span>${line.qty}</span>
              <button class="js-qty-inc" data-key="${line.key}" aria-label="Increase quantity">+</button>
            </div>
            <div class="dline-actions">
              <button class="js-remove-cart" data-key="${line.key}">Remove</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function emptyStateHTML() {
    return `
      <div class="drawer-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="9.5" cy="20.5" r="1"/><circle cx="17.5" cy="20.5" r="1"/></svg>
        <p>Your cart is empty.</p>
        <button class="cta-btn js-start-shopping-cart">Continue Shopping</button>
      </div>`;
  }

  function render() {
    if (lines.length === 0) {
      body.innerHTML = emptyStateHTML();
      summaryEl.hidden = true;
      return;
    }
    body.innerHTML = lines.map(lineRowHTML).join('');
    summaryEl.hidden = false;

    const t = computeTotals();
    document.getElementById('sumSubtotal').textContent = Utils.formatINR(t.subtotal);
    document.getElementById('sumSavings').textContent = '−' + Utils.formatINR(t.savings + t.couponDiscount);
    document.getElementById('sumShipping').textContent = t.shipping === 0 ? 'Free' : Utils.formatINR(t.shipping);
    document.getElementById('sumGst').textContent = Utils.formatINR(t.gst);
    document.getElementById('sumTotal').textContent = Utils.formatINR(t.grandTotal);
  }

  function open(trigger) {
    lastFocusedEl = trigger || document.activeElement;
    render();
    drawer.classList.add('open');
    document.getElementById('scrim').classList.add('open');
    A11y.lockScroll();
    releaseFocusTrap = A11y.trapFocus(drawer);
    document.getElementById('cartClose')?.focus();
    document.getElementById('cartIcon')?.setAttribute('aria-expanded', 'true');
  }

  function close() {
    drawer.classList.remove('open');
    document.getElementById('scrim').classList.remove('open');
    A11y.unlockScroll();
    if (releaseFocusTrap) releaseFocusTrap();
    document.getElementById('cartIcon')?.setAttribute('aria-expanded', 'false');
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function isOpen() {
    return drawer.classList.contains('open');
  }

  function init() {
    updateBadge();

    document.getElementById('cartClose').addEventListener('click', close);
    document.getElementById('continueShoppingBtn').addEventListener('click', () => {
      close();
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('checkoutBtn').addEventListener('click', () => {
      if (lines.length === 0) return;
      Toast.show('This is a design demo — checkout isn\u2019t wired up yet.', 'info');
    });
    document.getElementById('couponApply').addEventListener('click', () => {
      applyCoupon(document.getElementById('couponInput').value);
    });
    document.getElementById('couponInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyCoupon(e.target.value);
    });

    // Quick-add-to-cart buttons on product cards (event delegation, works for
    // both the static homepage grid and dynamically rendered search results).
    document.addEventListener('click', (e) => {
      const quickAdd = e.target.closest('.js-quickadd-btn');
      if (quickAdd) {
        addItem(quickAdd.getAttribute('data-id'), 1);
        A11y.bump(quickAdd);
        return;
      }
      const inc = e.target.closest('.js-qty-inc');
      if (inc) return updateQty(inc.getAttribute('data-key'), 1);
      const dec = e.target.closest('.js-qty-dec');
      if (dec) return updateQty(dec.getAttribute('data-key'), -1);
      const remove = e.target.closest('.js-remove-cart');
      if (remove) return removeItem(remove.getAttribute('data-key'));
      if (e.target.closest('.js-start-shopping-cart')) {
        close();
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  return { init, open, close, isOpen, addItem, updateQty, removeItem, applyCoupon, getCount, render };
})();
