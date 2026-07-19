/**
 * storage.js
 * ------------------------------------------------------------------
 * A tiny persistence + pub/sub layer used by cart.js and wishlist.js.
 *
 * IMPORTANT NOTE ON PERSISTENCE:
 * This module *tries* real localStorage first, so that once this file
 * is downloaded and opened/hosted outside of Claude.ai's in-browser
 * preview sandbox, the cart and wishlist genuinely persist across
 * page refreshes as requested in the spec.
 *
 * If localStorage is unavailable (blocked by a sandboxed preview,
 * private-browsing mode, or disabled by the user), it automatically
 * falls back to an in-memory store for the current session — so the
 * UI never breaks, it just won't survive a hard refresh in that case.
 *
 * Every other module talks to `RAUNA.Storage`, never to
 * `localStorage` directly — that keeps them swappable for a real
 * backend/API later (see the `KEYS` map below for what you'd persist
 * server-side instead).
 * ------------------------------------------------------------------
 */
window.RAUNA = window.RAUNA || {};

RAUNA.Storage = (function () {

  const KEYS = {
    CART: 'rauna_cart',
    WISHLIST: 'rauna_wishlist',
    RECENT_SEARCHES: 'rauna_recent_searches',
  };

  const memoryStore = {};
  const listeners = {}; // key -> [callback, ...]

  function detectLocalStorage() {
    try {
      const testKey = '__rauna_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  const hasLocalStorage = detectLocalStorage();

  function get(key, fallback) {
    if (hasLocalStorage) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw !== null ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    }
    return key in memoryStore ? memoryStore[key] : fallback;
  }

  function set(key, value) {
    if (hasLocalStorage) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        /* storage full / blocked — fall through to memory copy below */
      }
    }
    memoryStore[key] = value;
    emit(key, value);
  }

  function on(key, callback) {
    (listeners[key] = listeners[key] || []).push(callback);
    return () => {
      listeners[key] = (listeners[key] || []).filter((cb) => cb !== callback);
    };
  }

  function emit(key, value) {
    (listeners[key] || []).forEach((cb) => cb(value));
  }

  return { KEYS, get, set, on, usingLocalStorage: hasLocalStorage };
})();
