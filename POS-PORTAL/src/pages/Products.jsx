import { useState, useEffect, useCallback, useRef } from 'react';
import { REALTIME_EVENTS } from '../constants/realtimeEvents';
import { productAPI } from '../services/product.api';
import { useRealtime } from '../hooks/useRealtime';
import { Plus, Edit2, Trash2, Power, Search, Tag, Image } from 'lucide-react';
import './Products.css';

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN').format(v) + ' \u0111';
}

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', categoryId: '', description: '', image: '' });
  const [imagePreview, setImagePreview] = useState('');
  const fileRef = useRef(null);

  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');

  useEffect(() => { load(); }, []);

  const handleProductChange = useCallback(() => { load(); }, []);
  useRealtime(REALTIME_EVENTS.PRODUCT_CREATED, handleProductChange);
  useRealtime(REALTIME_EVENTS.PRODUCT_UPDATED, handleProductChange);
  useRealtime(REALTIME_EVENTS.PRODUCT_TOPPING_UPDATED, handleProductChange);
  useRealtime(REALTIME_EVENTS.PRODUCT_CATEGORY_CREATED, handleProductChange);

  async function load() {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([productAPI.getProducts(), productAPI.getCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function showToastMsg(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToastMsg('Ảnh tối đa 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, image: reader.result }));
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setForm(f => ({ ...f, image: '' }));
    setImagePreview('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      name: form.name,
      price: parseFloat(form.price),
      categoryId: form.categoryId || null,
      description: form.description,
      image: form.image || null,
    };
    try {
      if (editId) {
        await productAPI.updateProduct(editId, data);
        showToastMsg('Cập nhật sản phẩm thành công');
      } else {
        await productAPI.createProduct(data);
        showToastMsg('Thêm sản phẩm thành công');
      }
      closeForm();
      load();
    } catch (err) { showToastMsg(err.message); }
  }

  function openAddForm() {
    setEditId(null);
    setForm({ name: '', price: '', categoryId: '', description: '', image: '' });
    setImagePreview('');
    setShowForm(true);
  }

  function handleEdit(p) {
    setEditId(p.id);
    setForm({ name: p.name, price: String(p.price), categoryId: p.categoryId || '', description: p.description || '', image: p.image || '' });
    setImagePreview(p.image || '');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm({ name: '', price: '', categoryId: '', description: '', image: '' });
    setImagePreview('');
  }

  async function handleDelete(id) {
    if (!confirm('Xóa sản phẩm này?')) return;
    try { await productAPI.deleteProduct(id); load(); showToastMsg('Đã xóa'); } catch (err) { showToastMsg(err.message); }
  }

  async function handleToggle(id) {
    try { await productAPI.toggleProduct(id); load(); } catch { /* ignore */ }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!catName.trim()) return;
    try { await productAPI.createCategory(catName.trim()); setCatName(''); setShowCatForm(false); load(); showToastMsg('Thêm danh mục thành công'); }
    catch (err) { showToastMsg(err.message); }
  }

  async function handleDeleteCategory(id) {
    if (!confirm('Xóa danh mục?')) return;
    try { await productAPI.deleteCategory(id); load(); showToastMsg('Đã xóa danh mục'); } catch (err) { showToastMsg(err.message); }
  }

  const filtered = products.filter(p => {
    const matchCat = !filterCat || String(p.categoryId) === filterCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="products-page">
      <div className="products-toolbar">
        <div className="products-toolbar-left">
          <div className="search-box"><Search size={16} />
            <input placeholder="Tìm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="products-toolbar-right">
          <button className="btn btn-ghost" onClick={() => setShowCatForm(true)}><Tag size={14} /> Danh mục</button>
          <button className="btn btn-primary" onClick={openAddForm}><Plus size={14} /> Thêm sản phẩm</button>
        </div>
      </div>

      <div className="products-stats">
        <span>{products.length} sản phẩm</span><span>•</span>
        <span>{products.filter(p => p.isAvailable).length} đang bán</span><span>•</span>
        <span>{categories.length} danh mục</span>
      </div>

      <div className="products-grid">
        {loading && <p className="products-empty">Đang tải...</p>}
        {!loading && filtered.length === 0 && <p className="products-empty">Chưa có sản phẩm nào</p>}
        {filtered.map(p => (
          <div className={`product-card${!p.isAvailable ? ' unavailable' : ''}`} key={p.id}>
            {p.image && <img className="product-card-img" src={p.image} alt={p.name} />}
            {!p.image && <div className="product-card-img-empty"><Image size={24} /></div>}
            <div className="product-card-body">
              <div className="product-card-info">
                <span className="product-name">{p.name}</span>
                <span className="product-price">{formatCurrency(p.price)}</span>
                {p.categoryName && <span className="product-cat">{p.categoryName}</span>}
                {p.description && <span className="product-desc">{p.description}</span>}
              </div>
              {!p.isAvailable && <span className="product-badge-off">Hết hàng</span>}
            </div>
            <div className="product-card-actions">
              <button title={p.isAvailable ? 'Đánh dấu hết' : 'Mở bán lại'} onClick={() => handleToggle(p.id)}
                className={`action-btn ${p.isAvailable ? 'on' : 'off'}`}><Power size={14} /></button>
              <button title="Sửa" onClick={() => handleEdit(p)} className="action-btn"><Edit2 size={14} /></button>
              <button title="Xóa" onClick={() => handleDelete(p.id)} className="action-btn danger"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <form className="modal modal-wide" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3 className="modal-title">{editId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>

            {/* Image upload */}
            <div className="form-group">
              <label className="form-label">Hình ảnh</label>
              <div className="image-upload-area" onClick={() => fileRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="image-placeholder"><Image size={24} /><span>Bấm để chọn ảnh</span></div>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageSelect} />
              </div>
              {imagePreview && <button type="button" className="btn-link-remove" onClick={clearImage}>Xóa ảnh</button>}
            </div>

            <div className="form-group"><label className="form-label">Tên sản phẩm *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Giá (VNĐ) *</label>
                <input className="form-input" type="number" min="0" step="1000" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Danh mục</label>
                <select className="form-input" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                  <option value="">Chưa phân loại</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
            </div>
            <div className="form-group"><label className="form-label">Mô tả</label>
              <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Mô tả ngắn về sản phẩm..." /></div>
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary">{editId ? 'Lưu' : 'Thêm'}</button>
              <button type="button" className="btn btn-ghost" onClick={closeForm}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Category Modal */}
      {showCatForm && (
        <div className="modal-overlay" onClick={() => setShowCatForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Quản lý danh mục</h3>
            <div className="cat-list">
              {categories.map(c => (
                <div className="cat-item" key={c.id}>
                  <span>{c.name}</span>
                  <button className="action-btn danger" onClick={() => handleDeleteCategory(c.id)}><Trash2 size={12} /></button>
                </div>
              ))}
              {categories.length === 0 && <p style={{color:'var(--gray-400)', fontSize:13}}>Chưa có danh mục</p>}
            </div>
            <form className="cat-add-form" onSubmit={handleAddCategory}>
              <input className="form-input" placeholder="Tên danh mục mới..." value={catName} onChange={e => setCatName(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={!catName.trim()}>Thêm</button>
            </form>
            <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setShowCatForm(false)}>Đóng</button></div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Products;

