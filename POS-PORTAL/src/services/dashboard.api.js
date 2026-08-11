import { apiFetch } from './client';

export const dashboardAPI = {
  async getStats() {
    const response = await apiFetch('/txn/dashboard/stats');
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async getHourlyChart(date) {
    const query = date ? `?date=${date}` : '';
    const response = await apiFetch(`/txn/dashboard/hourly${query}`);
    if (!response.ok) throw new Error('Failed to fetch hourly data');
    return response.json();
  },

  async getRevenueReport(period) {
    const response = await apiFetch(`/txn/dashboard/revenue?period=${period || 'today'}`);
    if (!response.ok) throw new Error('Failed to fetch revenue');
    return response.json();
  },

  async getTopProducts(date) {
    const query = date ? `?date=${date}` : '';
    const response = await apiFetch(`/txn/dashboard/top-products${query}`);
    if (!response.ok) throw new Error('Failed to fetch top products');
    return response.json();
  },

  async getPaymentBreakdown(date) {
    const query = date ? `?date=${date}` : '';
    const response = await apiFetch(`/txn/dashboard/payments${query}`);
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },
};
