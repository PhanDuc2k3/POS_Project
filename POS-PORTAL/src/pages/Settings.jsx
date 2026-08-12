import { useState, useEffect } from 'react';
import { Building2, Printer, Save } from 'lucide-react';
import { storeAPI } from '../services/store.api';
import { VIETNAM_BANKS, findBankByBin } from '../constants/vietnamBanks';
import './Settings.css';

function Settings() {
  const [bank, setBank] = useState({ bankName: '', bankBin: '', accountName: '', accountNumber: '', qrProvider: 'VietQR' });
  const [receipt, setReceipt] = useState({ header: '', footer: '', showQR: true, showLogo: false, showTime: true, showTxnId: true, showStoreInfo: true, paperWidth: '80mm' });
  const [autoPrintQr, setAutoPrintQr] = useState(true);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [bankData, receiptData] = await Promise.all([storeAPI.getBankConfig(), storeAPI.getReceiptConfig()]);
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
        setAutoPrintQr(Boolean(receiptData.showQR));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleSave() {
    try {
      if (!bank.bankBin || !bank.accountName.trim() || !bank.accountNumber.trim()) {
        showToast('Vui lòng chọn ngân hàng, nhập tên và số tài khoản');
        return;
      }
      await Promise.all([
        storeAPI.updateBankConfig(bank),
        storeAPI.updateReceiptConfig({ ...receipt, showQR: autoPrintQr }),
      ]);
      showToast('Đã lưu thay đổi');
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

      <section className="settings-panel bank-panel">
        <div className="settings-panel-header">
          <h2><Building2 size={18} /> Cấu hình ngân hàng & VietQR</h2>
          <button className="settings-save-btn" type="button" onClick={handleSave}>
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
                <option value="VietQR">VietQR Pro API</option>
                <option value="VietQR">VietQR</option>
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
        </div>

        <div className="printer-settings-grid">
          <div className="settings-form">
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
              placeholder="Cảm ơn quý khách đã mua sắm!&#10;Hẹn gặp lại quý khách."
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

function formatBankOption(bank) {
  if (bank.bin === '970422') return 'MB Bank - Ngân hàng TMCP Quân Đội';
  return bank.name;
}

export default Settings;
