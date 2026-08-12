import { useState, useEffect, useRef } from 'react';
import { Image, Save, Store as StoreIcon, Upload, X } from 'lucide-react';
import { RECEIPT_BLOCKS, getReceiptFlagsFromBlocks } from '../constants/receipt';
import { REALTIME_EVENTS } from '../constants/realtimeEvents';
import { storeAPI } from '../services/store.api';
import { dispatchEvent } from '../services/socket';
import './Store.css';

const BASE_RECEIPT_BLOCKS = [
  RECEIPT_BLOCKS.HEADER,
  RECEIPT_BLOCKS.STORE_INFO,
  RECEIPT_BLOCKS.DIVIDER,
  RECEIPT_BLOCKS.ORDER_INFO,
  RECEIPT_BLOCKS.DIVIDER,
  RECEIPT_BLOCKS.ITEMS,
  RECEIPT_BLOCKS.TOTAL,
  RECEIPT_BLOCKS.FOOTER,
];

function Store() {
  const [store, setStore] = useState({ name: '', address: '', phone: '', email: '', logo: '' });
  const [receiptConfig, setReceiptConfig] = useState({
    header: '',
    footer: 'Cảm ơn quý khách và hẹn gặp lại!',
    paperWidth: '58mm',
  });
  const [receiptOptions, setReceiptOptions] = useState({ logo: true, staff: true, barcode: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const logoInputRef = useRef(null);

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
        email: s.email || '',
        logo: s.logo || '',
      });

      if (r) {
        setReceiptConfig({
          header: r.header || '',
          footer: r.footer || 'Cảm ơn quý khách và hẹn gặp lại!',
          paperWidth: r.paperWidth || '58mm',
        });
        const savedBlocks = r.blocks || [];
        setReceiptOptions({
          logo: savedBlocks.includes(RECEIPT_BLOCKS.LOGO) || Boolean(s.logo),
          staff: savedBlocks.includes(RECEIPT_BLOCKS.PAYMENT),
          barcode: savedBlocks.includes(RECEIPT_BLOCKS.QR),
        });
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

  function getReceiptBlocks() {
    const blocks = [...BASE_RECEIPT_BLOCKS];
    if (receiptOptions.logo) blocks.unshift(RECEIPT_BLOCKS.LOGO);
    if (receiptOptions.staff) blocks.splice(blocks.indexOf(RECEIPT_BLOCKS.TOTAL) + 1, 0, RECEIPT_BLOCKS.PAYMENT);
    if (receiptOptions.barcode) blocks.splice(blocks.length - 1, 0, RECEIPT_BLOCKS.QR);
    return blocks;
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setStore(s => ({ ...s, logo: ev.target.result }));
      setReceiptOptions(options => ({ ...options, logo: true }));
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setStore(s => ({ ...s, logo: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  async function handleSave() {
    setSaving(true);
    const blocks = getReceiptBlocks();
    try {
      await Promise.all([
        storeAPI.updateStore(store),
        storeAPI.updateReceiptConfig({
          ...receiptConfig,
          ...getReceiptFlagsFromBlocks(blocks),
          blocks,
        }),
      ]);
      showToast('Đã lưu thông tin cửa hàng');
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

  const storeName = store.name || 'Cửa hàng Flagship Q1';
  const headerText = receiptConfig.header || `${storeName}\n123 Lê Lợi, Q1, TP.HCM\nSĐT: ${store.phone || '090 123 4567'}`;
  const blocks = getReceiptBlocks();

  if (loading) {
    return (
      <div className="store-page">
        <div className="store-panel"><p className="store-muted">Đang tải...</p></div>
      </div>
    );
  }

  return (
    <div className="store-page">
      <div className="store-heading">
        <h1>Cửa hàng</h1>
        <p>Thông tin và nhận diện cửa hàng</p>
      </div>

      <section className="store-panel">
        <div className="store-panel-header">
          <h2>Thông tin cơ bản</h2>
          <button type="button" className="store-save-btn" onClick={handleSave} disabled={saving}>
            <Save size={13} />
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>

        <div className="store-basic-grid">
          <div className="store-logo-column">
            <button type="button" className="store-logo-upload" onClick={() => logoInputRef.current?.click()}>
              {store.logo ? (
                <img src={store.logo} alt="Logo cửa hàng" />
              ) : (
                <span>
                  <StoreIcon size={34} />
                  <strong>Cửa hàng</strong>
                </span>
              )}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />
            {store.logo && (
              <button type="button" className="store-logo-remove" onClick={removeLogo}>
                <X size={12} /> Xóa logo
              </button>
            )}
            <p>Khuyến nghị: 512x512px. Định dạng JPG, PNG.</p>
          </div>

          <div className="store-form-grid">
            <label className="store-field">
              <span>Tên cửa hàng <b>*</b></span>
              <input value={store.name} onChange={e => setStore({ ...store, name: e.target.value })} placeholder="Cửa hàng Flagship Q1" />
            </label>
            <label className="store-field">
              <span>Số điện thoại</span>
              <input value={store.phone} onChange={e => setStore({ ...store, phone: e.target.value })} placeholder="090 123 4567" />
            </label>
            <label className="store-field full">
              <span>Email liên hệ</span>
              <input value={store.email} onChange={e => setStore({ ...store, email: e.target.value })} placeholder="contact@flagship.vn" />
            </label>
            <label className="store-field full">
              <span>Địa chỉ</span>
              <input value={store.address} onChange={e => setStore({ ...store, address: e.target.value })} placeholder="123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh" />
            </label>
          </div>
        </div>
      </section>

      <section className="store-panel receipt-panel">
        <div className="store-panel-header">
          <h2>Mẫu hóa đơn</h2>
          <button type="button" className="store-save-btn" onClick={handleSave} disabled={saving}>
            In thử
          </button>
        </div>

        <div className="receipt-layout">
          <div className="receipt-config">
            <label className="store-field">
              <span>Tiêu đề hóa đơn (Header)</span>
              <textarea
                value={receiptConfig.header}
                onChange={e => setReceiptConfig({ ...receiptConfig, header: e.target.value })}
                placeholder={`Cửa hàng Flagship Q1\n123 Lê Lợi, Q1, TP.HCM\nSĐT: 090 123 4567`}
              />
            </label>
            <label className="store-field">
              <span>Lời cảm ơn (Footer)</span>
              <textarea
                value={receiptConfig.footer}
                onChange={e => setReceiptConfig({ ...receiptConfig, footer: e.target.value })}
                placeholder="Cảm ơn quý khách và hẹn gặp lại!"
              />
            </label>

            <div className="receipt-options">
              <span>Tùy chọn hiển thị</span>
              <ToggleRow label="Hiển thị Logo" checked={receiptOptions.logo} onChange={() => setReceiptOptions(o => ({ ...o, logo: !o.logo }))} />
              <ToggleRow label="Hiển thị tên nhân viên" checked={receiptOptions.staff} onChange={() => setReceiptOptions(o => ({ ...o, staff: !o.staff }))} />
              <ToggleRow label="Hiển thị mã vạch (Barcode)" checked={receiptOptions.barcode} onChange={() => setReceiptOptions(o => ({ ...o, barcode: !o.barcode }))} />
            </div>
          </div>

          <div className="receipt-preview-wrap">
            <div className="receipt-paper-preview">
              {blocks.map((bid, i) => (
                <ReceiptBlock key={bid + i} id={bid} config={receiptConfig} store={store} headerText={headerText} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button type="button" className={`store-switch ${checked ? 'on' : ''}`} onClick={onChange}>
        <i />
      </button>
    </label>
  );
}

function ReceiptBlock({ id, config, store, headerText }) {
  switch (id) {
    case 'logo':
      return (
        <div className="receipt-logo">
          {store.logo ? <img src={store.logo} alt="" /> : <Image size={18} />}
        </div>
      );
    case 'header':
      return <div className="receipt-header">{headerText}</div>;
    case 'storeInfo':
      return (
        <div className="receipt-store-info">
          <div>{store.address || '123 Lê Lợi, Q1, TP.HCM'}</div>
          <div>SĐT: {store.phone || '090 123 4567'}</div>
        </div>
      );
    case 'divider':
      return <div className="receipt-divider" />;
    case 'orderInfo':
      return (
        <div className="receipt-order-info">
          <div><span>Ngày: 24/10/2023</span><span>14:38</span></div>
          <div>Số HĐ: HD-00123</div>
          <div>Thu ngân: Nguyễn Văn A</div>
        </div>
      );
    case 'items':
      return (
        <div className="receipt-items">
          <div className="receipt-item receipt-item-head"><span>Món</span><span>SL</span><span>TT</span></div>
          <div className="receipt-item"><span>Cà phê sữa đá</span><span>2</span><span>78.000</span></div>
          <div className="receipt-item"><span>Bánh mì thịt</span><span>1</span><span>35.000</span></div>
        </div>
      );
    case 'total':
      return <div className="receipt-total"><span>Tổng cộng:</span><span>113.000 đ</span></div>;
    case 'payment':
      return null;
    case 'qr':
      return <div className="receipt-barcode">|||| ||| |||| ||</div>;
    case 'footer':
      return <div className="receipt-footer">{config.footer}</div>;
    default:
      return null;
  }
}

export default Store;
