export const STORE_ID_KEY = 'pos-kitchen-store-id';

export const state = {
  storeId: Number(localStorage.getItem(STORE_ID_KEY) || 1),
  sessions: [],
  activeSession: null,
  selectedSessionId: null,
  loadingSessions: true,
  toast: '',
};
