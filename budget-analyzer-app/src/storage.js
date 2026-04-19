// Drop-in replacement for the artifact-runtime `window.storage` API.
// Uses localStorage under the hood. All data stays on the user's device —
// consistent with the "zero PII retention" posture of the app.
//
// The artifact API returns promises, so we do too for a one-line swap.

const PREFIX = 'budget-analyzer:';

function installStorageShim() {
  if (typeof window === 'undefined') return;
  if (window.storage) return; // don't clobber if already set (e.g. artifact runtime)

  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) throw new Error('Key not found: ' + key);
      return { key, value: raw, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(PREFIX + key, String(value));
      return { key, value, shared: false };
    },
    async delete(key) {
      const existed = localStorage.getItem(PREFIX + key) !== null;
      localStorage.removeItem(PREFIX + key);
      return { key, deleted: existed, shared: false };
    },
    async list(prefix = '') {
      const keys = [];
      const full = PREFIX + prefix;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(full)) keys.push(k.slice(PREFIX.length));
      }
      return { keys, prefix, shared: false };
    },
  };
}

installStorageShim();
