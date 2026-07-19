/**
 * navbar.js
 * ------------------------------------------------------------------
 * Owns the top-right navbar icons: wires the Search / Wishlist / Cart
 * buttons to their respective modules, and centralizes global
 * keyboard shortcuts (Ctrl+K or / to search, Esc to close whatever's
 * open). Also exposes a tiny `quickView` stub used by the wishlist
 * drawer's "Quick View" button.
 * ------------------------------------------------------------------
 */
window.RAUNA = window.RAUNA || {};

RAUNA.Navbar = (function () {

  function quickView(productId) {
    // This build doesn't have a standalone product page, so Quick View
    // scrolls to (and briefly highlights) the product on the homepage
    // grid if it's visible there, otherwise shows a toast.
    const card = document.querySelector(`#prodGrid .prod-card[data-id="${productId}"]`);
    RAUNA.Wishlist.close();
    RAUNA.Cart.close();
    if (card) {
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.transition = 'box-shadow .3s ease';
        card.style.boxShadow = '0 0 0 3px var(--gold)';
        setTimeout(() => (card.style.boxShadow = ''), 1600);
      }, 250);
    } else {
      RAUNA.Toast.show('Full product page coming soon.', 'info');
    }
  }

  function closeAllPanels() {
    if (RAUNA.Search.isOpen()) RAUNA.Search.close();
    if (RAUNA.Wishlist.isOpen()) RAUNA.Wishlist.close();
    if (RAUNA.Cart.isOpen()) RAUNA.Cart.close();
  }

  function init() {
    const searchIcon = document.getElementById('searchIcon');
    const wishlistIcon = document.getElementById('wishlistIcon');
    const cartIcon = document.getElementById('cartIcon');
    const scrim = document.getElementById('scrim');

    searchIcon.addEventListener('click', () => {
      RAUNA.Search.isOpen() ? RAUNA.Search.close() : RAUNA.Search.open(searchIcon);
    });
    wishlistIcon.addEventListener('click', () => {
      RAUNA.Wishlist.isOpen() ? RAUNA.Wishlist.close() : RAUNA.Wishlist.open(wishlistIcon);
    });
    cartIcon.addEventListener('click', () => {
      RAUNA.Cart.isOpen() ? RAUNA.Cart.close() : RAUNA.Cart.open(cartIcon);
    });

    // Clicking the shared background scrim closes whichever panel is open.
    scrim.addEventListener('click', closeAllPanels);

    // Global keyboard shortcuts.
    document.addEventListener('keydown', (e) => {
      const isTypingElsewhere =
        document.activeElement &&
        ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) &&
        document.activeElement.id !== 'searchInput';

      if (e.key === 'Escape') {
        closeAllPanels();
        return;
      }
      if (isTypingElsewhere) return;

      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !RAUNA.Search.isOpen())) {
        e.preventDefault();
        RAUNA.Search.open(searchIcon);
      }
    });
  }

  return { init, quickView, closeAllPanels };
})();
