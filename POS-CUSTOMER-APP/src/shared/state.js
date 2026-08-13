export const STORE_ID_KEY = 'pos-customer-store-id';
export const SESSION_KEY = 'pos-customer-session-id';

export const state = {
  storeId: Number(localStorage.getItem(STORE_ID_KEY) || 1),
  menu: { categories: [], products: [] },
  activeSession: null,
  cart: [],
  search: '',
  categoryId: 'all',
  tableCode: '',
  guestCount: 2,
  sessionNote: '',
  orderNote: '',
  loading: true,
  toast: '',
};
