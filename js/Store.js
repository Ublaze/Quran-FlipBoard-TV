/**
 * Tiny persistence layer over localStorage.
 * Every access is guarded: storage can be unavailable or throw on some TVs,
 * and the app must keep running with defaults if it does.
 */
const STORE_KEY = 'quranFlipboard.v1';

export class Store {
  static load() {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  static save(patch) {
    try {
      const next = Object.assign(Store.load(), patch);
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch (e) {
      // Storage full or blocked: ignore, the app still works for this session
    }
  }
}
