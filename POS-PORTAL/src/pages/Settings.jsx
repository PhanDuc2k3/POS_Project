import { useState, useEffect } from 'react';
import { storeAPI } from '../services/store.api';
import { VIETNAM_BANKS, findBankByBin } from '../constants/vietnamBanks';
import './Settings.css';

function Settings() {
  const [bank, setBank] = useState({ bankName: '', bankBin: '', accountName: '', accountNumber: '', qrProvider: 'VietQR' });
  const [receipt, setReceipt] = useState({ header: '', footer: '', showQR: true, showLogo: false, showTime: true, showTxnId: true, showStoreInfo: true, paperWidth: '58mm' });
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
          qrProvider: 'VietQR',
        });
      }
      if (receiptData) setReceipt(receiptData);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function handleBankSave(e) {
    e.preventDefault();
    try {
      if (!bank.bankBin || !bank.accountName.trim() || !bank.accountNumber.trim()) {
        showToast('Vui lòng chọn ngân hàng, nhập tên và số tài khoản');
        return;
      }
      await storeAPI.updateBankConfig(bank);
      showToast('Đã lưu cấu hình ngân hàng');
    } catch (err) { showToast(err.message); }
  }

  async function handleReceiptSave(e) {
    e.preventDefault();
    try { await storeAPI.updateReceiptConfig(receipt); showToast('Đã lưu mẫu hóa đơn'); } catch (err) { showToast(err.message); }
  }

  if (loading) return <div className="settings"><p style={{color:'var(--gray-400)'}}>Đang tải...</p></div>;

  const qrPreviewUrl = buildVietQRPreviewUrl(bank);

  return (
    <div className="settings">
      <form className="settings-section" onSubmit={handleBankSave}>
        <h2 className="settings-section-title">Cấu hình ngân hàng</h2>
        <p className="settings-section-desc">Thông tin VietQR thật để tạo mã QR thanh toán trên POS.</p>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Ngân hàng</label>
            <select
              className="form-select"
              value={bank.bankBin}
              onChange={e => {
                const selectedBank = findBankByBin(e.target.value);
                setBank({ ...bank, bankBin: selectedBank?.bin || '', bankName: selectedBank?.name || '' });
              }}
            >
              <option value="">Chọn ngân hàng</option>
              {VIETNAM_BANKS.map(item => (
                <option key={item.bin} value={item.bin}>{item.name} ({item.bin})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tên tài khoản</label>
            <input className="form-input" value={bank.accountName} onChange={e => setBank({...bank, accountName: e.target.value})} placeholder="VD: NGUYEN VAN A" />
          </div>
          <div className="form-group">
            <label className="form-label">Số tài khoản</label>
            <input
              className="form-input"
              value={bank.accountNumber}
              onChange={e => setBank({...bank, accountNumber: e.target.value.replace(/\s/g, '')})}
              placeholder="VD: 123456789"
            />
          </div>
          <div className="form-group">
            <label className="form-label">QR Provider</label>
            <select className="form-select" value={bank.qrProvider} onChange={e => setBank({...bank, qrProvider: e.target.value})}>
              <option value="VietQR">VietQR</option>
            </select>
          </div>
        </div>

        <div className="bank-preview">
          <div>
            <div className="bank-preview-title">{bank.bankName || 'Chưa chọn ngân hàng'}</div>
            <div className="bank-preview-meta">BIN: {bank.bankBin || '-'} · STK: {bank.accountNumber || '-'}</div>
            <div className="bank-preview-meta">Chủ TK: {bank.accountName || '-'}</div>
          </div>
          <div className="bank-preview-qr">
            {qrPreviewUrl ? <img src={qrPreviewUrl} alt="VietQR preview" /> : <span>QR</span>}
          </div>
        </div>

        <div className="form-actions"><button type="submit" className="btn btn-primary">Lưu cấu hình</button></div>
      </form>

      <form className="settings-section" onSubmit={handleReceiptSave}>
        <h2 className="settings-section-title">Mẫu hóa đơn</h2>
        <p className="settings-section-desc">Tùy chỉnh nội dung in trên hóa đơn. POS sẽ tự đồng bộ.</p>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Header (tiêu đề)</label>
            <input className="form-input" value={receipt.header || ''} onChange={e => setReceipt({...receipt, header: e.target.value})} placeholder="Tên cửa hàng" />
          </div>
          <div className="form-group">
            <label className="form-label">Footer (chân bill)</label>
            <input className="form-input" value={receipt.footer || ''} onChange={e => setReceipt({...receipt, footer: e.target.value})} placeholder="Xin cảm ơn quý khách" />
          </div>
          <div className="form-group">
            <label className="form-label">Khổ giấy</label>
            <select className="form-select" value={receipt.paperWidth} onChange={e => setReceipt({...receipt, paperWidth: e.target.value})}>
              <option value="58mm">58mm (nhỏ)</option>
              <option value="80mm">80mm (lớn)</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{marginTop: 16}}>
          <label className="form-label">Hiển thị trên hóa đơn</label>
          <div className="checkbox-group">
            <label className="checkbox-item"><input type="checkbox" checked={receipt.showQR} onChange={e => setReceipt({...receipt, showQR: e.target.checked})} /> In QR thanh toán</label>
            <label className="checkbox-item"><input type="checkbox" checked={receipt.showLogo} onChange={e => setReceipt({...receipt, showLogo: e.target.checked})} /> In logo</label>
            <label className="checkbox-item"><input type="checkbox" checked={receipt.showTime} onChange={e => setReceipt({...receipt, showTime: e.target.checked})} /> In giờ</label>
            <label className="checkbox-item"><input type="checkbox" checked={receipt.showTxnId} onChange={e => setReceipt({...receipt, showTxnId: e.target.checked})} /> In mã giao dịch</label>
            <label className="checkbox-item"><input type="checkbox" checked={receipt.showStoreInfo} onChange={e => setReceipt({...receipt, showStoreInfo: e.target.checked})} /> In thông tin cửa hàng</label>
          </div>
        </div>
        <div className="form-actions"><button type="submit" className="btn btn-primary">Lưu mẫu hóa đơn</button></div>
      </form>

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

export default Settings;
