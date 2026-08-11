import { apiFetch } from './client';

export const storeAPI = {
  async getStore() {
    const response = await apiFetch('/store/me');
    if (!response.ok) throw new Error('Failed to fetch store');
    return response.json();
  },

  async updateStore(data) {
    const response = await apiFetch('/store/me', { method: 'PUT', body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getBankConfig() {
    const response = await apiFetch('/store/bank');
    if (!response.ok) throw new Error('Failed to fetch bank config');
    return response.json();
  },

  async updateBankConfig(data) {
    const response = await apiFetch('/store/bank', { method: 'PUT', body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getReceiptConfig() {
    const response = await apiFetch('/store/receipt');
    if (!response.ok) throw new Error('Failed to fetch receipt config');
    return response.json();
  },

  async updateReceiptConfig(data) {
    const response = await apiFetch('/store/receipt', { method: 'PUT', body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getPOSConfig() {
    const response = await apiFetch('/store/pos-config');
    if (!response.ok) throw new Error('Failed to fetch POS config');
    return response.json();
  },
};
