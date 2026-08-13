import { esc, money } from '../shared/format.js';

export function renderMenuSection(state, products, categories) {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Menu</h2>
        <button class="btn ghost" data-action="refresh">Refresh</button>
      </div>
      <div class="panel-body">
        <div class="field-row">
          <label class="field">
            <span>Store ID</span>
            <input data-field="storeId" value="${esc(state.storeId)}" />
          </label>
          <label class="field">
            <span>Search</span>
            <input data-field="search" placeholder="Find dishes" value="${esc(state.search)}" />
          </label>
        </div>
        <div class="category-strip">
          ${categories.map((category) => `
            <button class="chip ${String(state.categoryId) === String(category.id) ? 'active' : ''}" data-action="set-category" data-value="${esc(category.id)}">
              ${esc(category.name)}
            </button>
          `).join('')}
        </div>
        ${state.loading ? '<div class="loading">Loading menu...</div>' : ''}
        ${!state.loading && products.length === 0 ? '<div class="empty">No products yet</div>' : ''}
        <div class="menu-grid">
          ${products.map((product) => `
            <article class="menu-card">
              <div class="split">
                <strong>${esc(product.name)}</strong>
                <span class="price">${money(product.price)}</span>
              </div>
              <p>${esc(product.description || product.categoryName || 'Menu item')}</p>
              <div class="price-row">
                <span class="muted">${product.toppingGroups?.length || 0} topping groups</span>
                <button class="btn" data-action="add-cart" data-id="${esc(product.id)}">Add</button>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
