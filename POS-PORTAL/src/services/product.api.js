import { apiFetch } from './client';

export const productAPI = {
  async getCategories() {
    const response = await apiFetch('/product/categories');
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async createCategory(name) {
    const response = await apiFetch('/product/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async updateCategory(id, data) {
    const response = await apiFetch(`/product/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async deleteCategory(id) {
    const response = await apiFetch(`/product/categories/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await apiFetch(`/product/products${query ? '?' + query : ''}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async createProduct(data) {
    const response = await apiFetch('/product/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async updateProduct(id, data) {
    const response = await apiFetch(`/product/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async deleteProduct(id) {
    const response = await apiFetch(`/product/products/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async toggleProduct(id) {
    const response = await apiFetch(`/product/products/${id}/toggle`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },
};
