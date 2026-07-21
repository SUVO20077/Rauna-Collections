/**
 * animations.js
 * ------------------------------------------------------------------
 * Small accessibility + motion helpers shared by the search overlay
 * and the wishlist/cart drawers: focus trapping, scroll locking, and
 * a couple of one-off DOM animation utilities.
 * ------------------------------------------------------------------
 */
window.RAUNA = window.RAUNA || {};

RAUNA.A11y = (function () {

  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  /** Returns all focusable elements inside a container, in DOM order. */
  function getFocusable(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null
    );
  }

  /**
   * Traps Tab/Shift+Tab focus inside `container` while it's open.
   * Returns a cleanup function to call when the panel closes.
   */
  function trapFocus(container) {
    function handleKeydown(e) {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable(container);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    container.addEventListener('keydown', handleKeydown);
    return () => container.removeEventListener('keydown', handleKeydown);
  }

  let scrollLockCount = 0;
  function lockScroll() {
    scrollLockCount++;
    document.body.classList.add('no-scroll');
  }
  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) document.body.classList.remove('no-scroll');
  }

  /** Briefly adds a bump/pop animation class, then removes it (retriggerable). */
  function bump(el) {
    if (!el) return;
    el.classList.remove('bump');
    // Force reflow so the animation can restart if it was already applied.
    void el.offsetWidth;
    el.classList.add('bump');
    el.addEventListener('animationend', () => el.classList.remove('bump'), { once: true });
  }

  return { getFocusable, trapFocus, lockScroll, unlockScroll, bump };
})();
