// In-memory stand-in for the browser storage adapter, used only by regression tests.
const items = new Map();
export const scopedStorage = {
  getItem: key => items.get(key) ?? null,
  setItem: (key, value) => items.set(key, value),
};
