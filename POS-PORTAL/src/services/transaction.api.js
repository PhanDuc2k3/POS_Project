import { apiFetch } from './client';

export const transactionAPI = {
  async createOrder(data) {
    const response = await apiFetch('/txn/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await apiFetch(`/txn/orders${query ? '?' + query : ''}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  async getOrder(id) {
    const response = await apiFetch(`/txn/orders/${id}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },

  async cancelOrder(id) {
    const response = await apiFetch(`/txn/orders/${id}/cancel`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async refundOrder(id) {
    const response = await apiFetch(`/txn/orders/${id}/refund`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getRecent(limit = 10) {
    const response = await apiFetch(`/txn/orders/recent/list?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent orders');
    return response.json();
  },

  async getDiningSessions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await apiFetch(`/txn/dining-sessions${query ? '?' + query : ''}`);
    if (!response.ok) throw new Error('Failed to fetch dining sessions');
    return response.json();
  },

  async createDiningSession(data) {
    const response = await apiFetch('/txn/dining-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getDiningSession(id) {
    const response = await apiFetch(`/txn/dining-sessions/${id}`);
    if (!response.ok) throw new Error('Failed to fetch dining session');
    return response.json();
  },

  async createSessionOrder(id, data) {
    const response = await apiFetch(`/txn/dining-sessions/${id}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async closeDiningSession(id) {
    const response = await apiFetch(`/txn/dining-sessions/${id}/close`, {
      method: 'POST',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },
};
