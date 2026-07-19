/**
 * utils.js
 * ------------------------------------------------------------------
 * Small, dependency-free helper functions shared by every other
 * RAUNA storefront module (search, cart, wishlist, toast, etc).
 * Everything is attached to a single global namespace, `RAUNA`,
 * so plain <script> tags can share state without a bundler.
 * ------------------------------------------------------------------
 */
window.RAUNA = window.RAUNA || {};

RAUNA.Utils = (function () {

  /** Debounce: waits `delay` ms after the last call before firing `fn`. */
  function debounce(fn, delay) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /** Formats a number as Indian Rupees, e.g. 1499 -> "₹1,499". */
  function formatINR(amount) {
    const rounded = Math.round(amount);
    return '₹' + rounded.toLocaleString('en-IN');
  }

  /** Escapes user-generated text before it is dropped into innerHTML. */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  }

  /**
   * Classic Levenshtein edit-distance between two strings.
   * Used to give the search bar typo tolerance (e.g. "hodie" -> "hoodie").
   */
  function levenshtein(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
      }
    }
    return dp[m][n];
  }

  /**
   * Fuzzy "does query match this field" test with typo tolerance.
   * Returns a match score (higher = better) or 0 for no match.
   * - Exact substring match scores highest.
   * - Per-word fuzzy match (small edit distance) scores lower but still counts,
   *   so "hodie" still finds "Hoodie" and "traking" still finds "tracking".
   */
  function fuzzyScore(fieldText, query) {
    if (!fieldText || !query) return 0;
    const field = String(fieldText).toLowerCase();
    const q = query.trim().toLowerCase();
    if (!q) return 0;

    if (field.includes(q)) {
      // Reward matches near the start of the field slightly more.
      return field.startsWith(q) ? 100 : 70;
    }

    // Typo-tolerant word-by-word check.
    const words = field.split(/[\s,/-]+/).filter(Boolean);
    let best = 0;
    for (const word of words) {
      if (word.length < 3) continue;
      const dist = levenshtein(word.slice(0, q.length + 2), q);
      const tolerance = Math.max(1, Math.floor(q.length * 0.34)); // ~1 typo per 3 chars
      if (dist <= tolerance) {
        best = Math.max(best, 40 - dist * 5);
      }
    }
    return best;
  }

  /** Clamp a number between min and max. */
  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  /** Generates a short unique id, e.g. for cart line items. */
  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  return { debounce, formatINR, escapeHtml, levenshtein, fuzzyScore, clamp, uid };
})();
