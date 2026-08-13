export const STORAGE_KEY = 'pos-platform-admin-state-v1';

export function loadState(initialState) {
  try {
    return { ...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return structuredClone(initialState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
