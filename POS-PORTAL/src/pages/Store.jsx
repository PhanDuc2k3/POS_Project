import { useState, useEffect, useRef } from 'react';
import { RECEIPT_BLOCKS, RECEIPT_PRESETS, getReceiptFlagsFromBlocks } from '../constants/receipt';
import { REALTIME_EVENTS } from '../constants/realtimeEvents';
import { storeAPI } from '../services/store.api';
import { dispatchEvent } from '../services/socket';
import { Store as StoreIcon, Phone, MapPin, Upload, X, Check } from 'lucide-react';
import './Store.css';


function Store() {
  const [store, setStore] = useState({ name: '', address: '', phone: '', logo: '' });
  const [receiptConfig, setReceiptConfig] = useState({ header: '', footer: 'Xin cảm ơn quý khách!', paperWidth: '58mm' });
  const [activePreset, setActivePreset] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const logoInputRef = useRef(null);

  const currentPreset = RECEIPT_PRESETS.find(p => p.id === activePreset) || RECEIPT_PRESETS[1];
  const blocks = currentPreset.blocks;

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [s, r] = await Promise.all([
        storeAPI.getStore(),
        storeAPI.getReceiptConfig(),
      ]);

      setStore({
        name: s.name || '',
        address: s.address || '',
        phone: s.phone || '',
        logo: s.logo || '',
      });
      if (r) {
        setReceiptConfig({
          header: r.header || '',
          footer: r.footer || 'Xin cảm ơn quý khách!',
          paperWidth: r.paperWidth || '58mm',
        });
        // Match preset by comparing sorted blocks (order-independent)
        const savedBlocks = r.blocks || [];
        const sortedSaved = [...savedBlocks].sort().join(',');
        const matched = RECEIPT_PRESETS.find(p => {
          const sortedPreset = [...p.blocks].sort().join(',');
          return sortedSaved === sortedPreset;
        });
        if (matched) {
          setActivePreset(matched.id);
        }
      }
    } catch {
      showToast('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setStore(s => ({ ...s, logo: ev.target.result }));
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setStore(s => ({ ...s, logo: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        storeAPI.updateStore(store),
        storeAPI.updateReceiptConfig({
          ...receiptConfig,
          ...getReceiptFlagsFromBlocks(blocks),
          blocks,
        }),
      ]);
      showToast('Đã lưu hóa đơn cho cửa hàng');
      dispatchEvent(REALTIME_EVENTS.STORE_RECEIPT_UPDATED, {
        storeId: store.id || 1,
        blocks,
        header: receiptConfig.header,
        footer: receiptConfig.footer,
        paperWidth: receiptConfig.paperWidth,
      });
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  }

  const storeName = store.name || 'Tên cửa hàng';
  const headerText = receiptConfig.header || storeName;

  if (loading) {
    return (
      <div className="store-page">
        <div className="settings-section">
          <p style={{ color: 'var(--gray-400)' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      <form className="settings-section" onSubmit={handleSave}>
        <h2 className="settings-section-title">Mẫu hóa đơn</h2>
        <p className="settings-section-desc">Chọn mẫu và nhập thông tin. Dữ liệu sẽ được lưu làm hóa đơn mặc định cho cửa hàng.</p>

        <div className="preset-selector">
          {RECEIPT_PRESETS.map(p => (
            <div key={p.id}
              className={'preset-card' + (activePreset === p.id ? ' active' : '')}
              onClick={() => setActivePreset(p.id)}>
              <div className="preset-card-header">
                <span className="preset-card-name">{p.name}</span>
                {activePreset === p.id && <Check size={14} className="preset-card-check" />}
              </div>
              <div className="preset-card-blocks">
                {p.blocks.filter(b => b !== 'divider').map(b => (
                  <span key={b} className="preset-block-tag">{b}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="content-row">
          <div className="content-left">
            <div className="form-section">
              <h3 className="form-section-title">
                {activePreset === 'minimal' ? 'Thông tin cơ bản' :
                 activePreset === 'standard' ? 'Thông tin đầy đủ' : 'Thông tin chuyên nghiệp'}
              </h3>

              <div className="form-grid">
                {blocks.includes(RECEIPT_BLOCKS.LOGO) && (
                  <div className="form-group">
                    <label className="form-label">Logo</label>
                    <div className="logo-upload">
                      {store.logo ? (
                        <div className="logo-preview">
                          <img src={store.logo} alt="logo" />
                          <button type="button" className="logo-remove" onClick={removeLogo}>
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="logo-dropzone">
                          <Upload size={20} />
                          <span>Tải ảnh lên</span>
                          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {blocks.includes(RECEIPT_BLOCKS.HEADER) && (
                  <div className="form-group">
                    <label className="form-label">Tiêu đề hóa đơn</label>
                    <input className="form-input" value={receiptConfig.header}
                      onChange={e => setReceiptConfig({ ...receiptConfig, header: e.target.value })}
                      placeholder={storeName} />
                  </div>
                )}

                {blocks.includes(RECEIPT_BLOCKS.FOOTER) && (
                  <div className="form-group">
                    <label className="form-label">Chân hóa đơn</label>
                    <input className="form-input" value={receiptConfig.footer}
                      onChange={e => setReceiptConfig({ ...receiptConfig, footer: e.target.value })}
                      placeholder="Xin cảm ơn quý khách!" />
                  </div>
                )}

                {blocks.includes(RECEIPT_BLOCKS.STORE_INFO) && (
                  <>
                    <div className="form-group">
                      <label className="form-label"><StoreIcon size={14} /> Tên cửa hàng</label>
                      <input className="form-input" value={store.name}
                        onChange={e => setStore({ ...store, name: e.target.value })}
                        placeholder="VD: Bún Bò ABC" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Phone size={14} /> Điện thoại</label>
                      <input className="form-input" value={store.phone}
                        onChange={e => setStore({ ...store, phone: e.target.value })}
                        placeholder="VD: 0901 234 567" />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><MapPin size={14} /> Địa chỉ</label>
                      <input className="form-input" value={store.address}
                        onChange={e => setStore({ ...store, address: e.target.value })}
                        placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM" />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Khổ giấy</label>
                  <select className="form-input"
                    value={receiptConfig.paperWidth}
                    onChange={e => setReceiptConfig({ ...receiptConfig, paperWidth: e.target.value })}>
                    <option value="58mm">58mm (nhỏ)</option>
                    <option value="80mm">80mm (lớn)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="content-right">
            <div className="receipt-preview">
              <h3 className="receipt-preview-title">Xem trước hóa đơn</h3>
              <div className={'receipt-paper' + (receiptConfig.paperWidth === '80mm' ? ' wide' : '')}>
                {blocks.map((bid, i) => (
                  <ReceiptBlock key={bid + i} id={bid} config={receiptConfig} store={store} headerText={headerText} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function ReceiptBlock({ id, config, store, headerText }) {
  switch (id) {
    case 'logo':
      return store.logo ? (
        <div className="receipt-logo"><img src={store.logo} alt="" /></div>
      ) : null;
    case 'header':
      return <div className="receipt-header">{headerText}</div>;
    case 'storeInfo':
      return (
        <div className="receipt-store-info">
          {store.name && <div style={{ fontWeight: 700, fontSize: 12 }}>{store.name}</div>}
          {store.address && <div>{store.address}</div>}
          {store.phone && <div>ĐT: {store.phone}</div>}
        </div>
      );
    case 'divider':
      return <div className="receipt-divider">{'─'.repeat(config.paperWidth === '80mm' ? 38 : 28)}</div>;
    case 'orderInfo':
      return (
        <div className="receipt-order-info">
          <div>ORD-20260806-001</div>
          <div>06/08/2026, 10:30</div>
        </div>
      );
    case 'items':
      return (
        <div className="receipt-items">
          <div className="receipt-item"><span>Bún bò x1</span><span>37.000đ</span></div>
          <div className="receipt-item"><span>Trà đá x2</span><span>10.000đ</span></div>
          <div className="receipt-item"><span>Chả giò x1</span><span>33.000đ</span></div>
        </div>
      );
    case 'total':
      return (
        <div className="receipt-total">
          <span>Tổng cộng:</span><span>80.000đ</span>
        </div>
      );
    case 'payment':
      return <div className="receipt-payment">Thanh toán: Tiền mặt</div>;
    case 'qr':
      return (
        <div className="receipt-qr">
          <div className="receipt-qr-box">QR</div>
        </div>
      );
    case 'footer':
      return <div className="receipt-footer">{config.footer}</div>;
    default:
      return null;
  }
}

export default Store;
