/**
 * toast.js
 * ------------------------------------------------------------------
 * Floating toast notifications ("Added to Cart", "Coupon Applied", etc).
 * Stacks multiple toasts, animates them in/out, and auto-dismisses
 * each one after ~3.2s (matching the CSS progress-bar animation).
 * ------------------------------------------------------------------
 */
window.RAUNA = window.RAUNA || {};

RAUNA.Toast = (function () {
  const ICONS = {
    success:
      '<svg class="t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    info:
      '<svg class="t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
    error:
      '<svg class="t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  };

  function getStack() {
    return document.getElementById('toastStack');
  }

  /**
   * Shows a toast.
   * @param {string} message
   * @param {'success'|'info'|'error'} type
   */
  function show(message, type = 'success') {
    const stack = getStack();
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      ${ICONS[type] || ICONS.success}
      <span class="t-text"></span>
      <div class="t-bar"></div>
    `;
    toast.querySelector('.t-text').textContent = message; // textContent avoids HTML injection

    stack.appendChild(toast);
    // Force a reflow before adding .show so the slide-in transition fires.
    void toast.offsetWidth;
    toast.classList.add('show');

    const dismiss = () => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    const timer = setTimeout(dismiss, 3200);
    toast.addEventListener('click', () => {
      clearTimeout(timer);
      dismiss();
    });
  }

  return { show };
})();
