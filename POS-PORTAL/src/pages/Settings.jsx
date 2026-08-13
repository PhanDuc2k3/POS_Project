import { useEffect, useState } from 'react';
import { Building2, Layers3, Percent, Printer, Save } from 'lucide-react';
import { storeAPI } from '../services/store.api';
import { VIETNAM_BANKS, findBankByBin } from '../constants/vietnamBanks';
import './Settings.css';

function Settings() {
  const [store, setStore] = useState({
    name: '',
    address: '',
    phone: '',
    logo: '',
    packageTier: 'starter',
    operatingMode: 'simple',
  });
  const [bank, setBank] = useState({ bankName: '', bankBin: '', accountName: '', accountNumber: '', qrProvider: 'VietQR' });
  const [receipt, setReceipt] = useState({ header: '', footer: '', showQR: true, showLogo: false, showTime: true, showTxnId: true, showStoreInfo: true, paperWidth: '80mm' });
  const [taxRate, setTaxRate] = useState(8);
  const [autoPrintQr, setAutoPrintQr] = useState(true);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [storeData, bankData, receiptData] = await Promise.all([
        storeAPI.getStore(),
        storeAPI.getBankConfig(),
        storeAPI.getReceiptConfig(),
      ]);

      if (storeData) {
        setStore({
          name: storeData.name || '',
          address: storeData.address || '',
          phone: storeData.phone || '',
          logo: storeData.logo || '',
          packageTier: storeData.packageTier || 'starter',
          operatingMode: storeData.operatingMode || 'simple',
        });
      }

      if (bankData) {
        const selectedBank = findBankByBin(bankData.bankBin);
        setBank({
          bankName: bankData.bankName || selectedBank?.name || '',
          bankBin: bankData.bankBin || '',
          accountName: bankData.accountName || '',
          accountNumber: bankData.accountNumber || '',
          qrProvider: bankData.qrProvider || 'VietQR',
        });
      }

      if (receiptData) {
        setReceipt({
          ...receiptData,
          paperWidth: receiptData.paperWidth || '80mm',
          footer: receiptData.footer || '',
        });
        setTaxRate(Number.isFinite(Number(receiptData.taxRate)) ? Number(receiptData.taxRate) : 8);
        setAutoPrintQr(Boolean(receiptData.showQR));
      }
    } catch {
      // Keep defaults when the config service is unavailable.
    } finally {
      setLoading(false);
    }
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleSaveStore() {
    try {
      setSavingStore(true);
      await storeAPI.updateStore({
        name: store.name,
        phone: store.phone,
        address: store.address,
        logo: store.logo,
        packageTier: store.packageTier,
        operatingMode: store.operatingMode,
      });
      showToast('Đã lưu cấu hình gói vận hành');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSavingStore(false);
    }
  }

  async function handleSaveBank() {
    try {
      if (!bank.bankBin || !bank.accountName.trim() || !bank.accountNumber.trim()) {
        showToast('Vui lòng chọn ngân hàng, nhập tên và số tài khoản');
        return;
      }
      await storeAPI.updateBankConfig(bank);
      showToast('Đã lưu cấu hình ngân hàng');
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleSaveReceipt() {
    try {
      if (!Number.isFinite(Number(taxRate)) || Number(taxRate) < 0 || Number(taxRate) > 100) {
        showToast('Thuế VAT phải nằm trong khoảng 0-100%');
        return;
      }
      await storeAPI.updateReceiptConfig({ ...receipt, showQR: autoPrintQr, taxRate: Number(taxRate) });
      showToast('Đã lưu cấu hình hóa đơn');
    } catch (err) {
      showToast(err.message);
    }
  }

  if (loading) return <div className="settings"><p className="settings-muted">Đang tải...</p></div>;

  const qrPreviewUrl = buildVietQRPreviewUrl(bank);

  return (
    <div className="settings">
      <div className="settings-heading">
        <h1>Cài đặt</h1>
      </div>

      <section className="settings-panel">
        <div className="settings-panel-header">
          <h2><Layers3 size={18} /> Gói vận hành & chế độ</h2>
          <button className="settings-save-btn" type="button" onClick={handleSaveStore} disabled={savingStore}>
            <Save size={13} />
            {savingStore ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        <div className="tier-settings-grid">
          <div className="settings-form">
            <label className="settings-field">
              <span>Tên cửa hàng</span>
              <input value={store.name} onChange={e => setStore({ ...store, name: e.target.value })} placeholder="Cửa hàng Flagship Q1" />
            </label>
            <label className="settings-field">
              <span>Gói sản phẩm</span>
              <select value={store.packageTier} onChange={e => setStore({ ...store, packageTier: e.target.value })}>
                <option value="starter">Starter - quán nhỏ</option>
                <option value="pro">Pro - vận hành nâng cao</option>
                <option value="restaurant">Restaurant - nhà hàng</option>
                <option value="chain">Chain - chuỗi nhiều chi nhánh</option>
              </select>
            </label>
            <label className="settings-field">
              <span>Chế độ vận hành</span>
              <select value={store.operatingMode} onChange={e => setStore({ ...store, operatingMode: e.target.value })}>
                <option value="simple">Simple POS - thanh toán ngay</option>
                <option value="restaurant">Restaurant - phiên bàn & gom bill</option>
              </select>
            </label>
            <label className="settings-field">
              <span>Địa chỉ</span>
              <input value={store.address} onChange={e => setStore({ ...store, address: e.target.value })} placeholder="123 Đường Lê Lợi, Quận 1, TP.HCM" />
            </label>
            <label className="settings-field">
              <span>Số điện thoại</span>
              <input value={store.phone} onChange={e => setStore({ ...store, phone: e.target.value })} placeholder="090 123 4567" />
            </label>
          </div>

          <div className="tier-summary">
            <strong>{describePackage(store.packageTier)}</strong>
            <p>{describeMode(store.operatingMode)}</p>
            <ul>
              {getEnabledModules(store.packageTier, store.operatingMode).map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="settings-panel bank-panel">
        <div className="settings-panel-header">
          <h2><Building2 size={18} /> Cấu hình ngân hàng & VietQR</h2>
          <button className="settings-save-btn" type="button" onClick={handleSaveBank}>
            <Save size={13} />
            Lưu thay đổi
          </button>
        </div>

        <div className="bank-settings-grid">
          <div className="settings-form">
            <label className="settings-field">
              <span>Ngân hàng</span>
              <select
                value={bank.bankBin}
                onChange={e => {
                  const selectedBank = findBankByBin(e.target.value);
                  setBank({ ...bank, bankBin: selectedBank?.bin || '', bankName: selectedBank?.name || '' });
                }}
              >
                <option value="">Chọn ngân hàng</option>
                {VIETNAM_BANKS.map(item => (
                  <option key={item.bin} value={item.bin}>{formatBankOption(item)}</option>
                ))}
              </select>
            </label>
            <label className="settings-field">
              <span>Tên tài khoản</span>
              <input value={bank.accountName} onChange={e => setBank({ ...bank, accountName: e.target.value })} placeholder="CONG TY TNHH POS CONTROL" />
            </label>
            <label className="settings-field">
              <span>Số tài khoản</span>
              <input value={bank.accountNumber} onChange={e => setBank({ ...bank, accountNumber: e.target.value.replace(/\s/g, '') })} placeholder="19001002003" />
            </label>
            <label className="settings-field">
              <span>Nhà cung cấp VietQR</span>
              <select value={bank.qrProvider} onChange={e => setBank({ ...bank, qrProvider: e.target.value })}>
                <option value="VietQR">VietQR</option>
                <option value="VietQR Pro API">VietQR Pro API</option>
              </select>
            </label>
            <label className="settings-toggle-row">
              <button type="button" className={`settings-switch ${autoPrintQr ? 'on' : ''}`} onClick={() => setAutoPrintQr(value => !value)}>
                <i />
              </button>
              <span>Tự động in mã QR trên hóa đơn</span>
            </label>
          </div>

          <div className="vietqr-preview-wrap">
            <div className="vietqr-card">
              <div className="vietqr-card-header">
                <strong><Building2 size={18} /> {bank.bankName || 'MB BANK'}</strong>
                <span>VietQR</span>
              </div>
              <div className="vietqr-image">
                {qrPreviewUrl ? <img src={qrPreviewUrl} alt="VietQR preview" /> : <span>QR</span>}
              </div>
              <strong className="vietqr-account">{bank.accountNumber || '19001002003'}</strong>
              <span className="vietqr-owner">{bank.accountName || 'CONG TY TNHH POS CONTROL'}</span>
            </div>
            <span className="vietqr-note">Bản xem trước mã QR tĩnh</span>
          </div>
        </div>
      </section>

      <section className="settings-panel">
        <div className="settings-panel-header">
          <h2><Printer size={18} /> Cấu hình máy in & Hóa đơn</h2>
          <button className="settings-save-btn" type="button" onClick={handleSaveReceipt}>
            <Save size={13} />
            Lưu thay đổi
          </button>
        </div>

        <div className="printer-settings-grid">
          <div className="settings-form">
            <div className="tax-config-box">
              <div className="tax-config-icon">
                <Percent size={20} />
              </div>
              <div className="tax-config-copy">
                <strong>Thuế VAT</strong>
                <span>Áp dụng khi tính tổng thanh toán trên POS</span>
              </div>
              <label className="tax-rate-input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                />
                <span>%</span>
              </label>
            </div>
            <label className="settings-field">
              <span>Máy in mặc định</span>
              <select>
                <option>Xprinter XP-N160II (USB)</option>
                <option>Máy in hệ thống</option>
              </select>
            </label>
            <label className="settings-field">
              <span>Khổ giấy</span>
              <select value={receipt.paperWidth} onChange={e => setReceipt({ ...receipt, paperWidth: e.target.value })}>
                <option value="80mm">K80 (80mm)</option>
                <option value="58mm">K58 (58mm)</option>
              </select>
            </label>
          </div>
          <label className="settings-field receipt-footer-field">
            <span>Lời chào cuối hóa đơn</span>
            <textarea
              value={receipt.footer || ''}
              onChange={e => setReceipt({ ...receipt, footer: e.target.value })}
              placeholder={'Cảm ơn quý khách đã mua sắm!\nHẹn gặp lại quý khách.'}
            />
          </label>
        </div>
      </section>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function buildVietQRPreviewUrl(bank) {
  if (!bank.bankBin || !bank.accountNumber) return '';
  const amount = 10000;
  const description = 'TEST POS';
  return `https://img.vietqr.io/image/${bank.bankBin}-${bank.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(bank.accountName || '')}`;
}

function describePackage(packageTier) {
  switch (packageTier) {
    case 'pro':
      return 'Pro package';
    case 'restaurant':
      return 'Restaurant package';
    case 'chain':
      return 'Chain package';
    default:
      return 'Starter package';
  }
}

function describeMode(mode) {
  return mode === 'restaurant'
    ? 'Bật flow bàn, bếp, gom bill cho nhà hàng'
    : 'Thanh toán nhanh tại quầy, ít màn hình, ít cấu hình';
}

function getEnabledModules(packageTier, operatingMode) {
  const modules = ['POS App', 'Portal App'];
  if (packageTier === 'pro' || packageTier === 'restaurant' || packageTier === 'chain') {
    modules.push('Báo cáo nâng cao');
  }
  if (packageTier === 'restaurant' || packageTier === 'chain' || operatingMode === 'restaurant') {
    modules.push('Customer Order App');
    modules.push('Kitchen App');
    modules.push('Staff Billing Flow');
  }
  if (packageTier === 'chain') {
    modules.push('Management App');
    modules.push('Multi-branch control');
  }
  return modules;
}

function formatBankOption(bank) {
  if (bank.bin === '970422') return 'MB Bank - Ngân hàng TMCP Quân Đội';
  return bank.name;
}

export default Settings;
