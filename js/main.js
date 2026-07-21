/**
 * main.js
 * ------------------------------------------------------------------
 * Boots the whole storefront layer once the DOM is ready. Order
 * matters here: wishlist/cart set up their badges and event
 * delegation first, then search (which reads wishlist state when
 * rendering result cards), then navbar (which wires the icon clicks
 * that open all three panels).
 * ------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
  RAUNA.Wishlist.init();
  RAUNA.Cart.init();
  RAUNA.Search.init();
  RAUNA.Navbar.init();
});
