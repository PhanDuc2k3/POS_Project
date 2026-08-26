function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function money(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function statusLabel(value) {
  const status = String(value || 'PENDING').toUpperCase();
  const map = {
    PENDING: 'Đang chờ',
    CONTACTED: 'Đã liên hệ',
    QUOTED: 'Đã gửi báo giá',
    WAITING_PAYMENT: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    APPROVED: 'Đã duyệt',
    PROVISIONING: 'Đang khởi tạo',
    ACTIVE: 'Sẵn sàng kích hoạt',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
    REJECTED: 'Đã từ chối',
    PROVISIONING_FAILED: 'Khởi tạo lỗi',
  };
  return map[status] || status.replaceAll('_', ' ');
}

function statusTone(value) {
  const status = String(value || '').toUpperCase();
  if (['ACTIVE', 'COMPLETED', 'APPROVED', 'PAID'].includes(status)) return 'success';
  if (['REJECTED', 'CANCELLED', 'PROVISIONING_FAILED'].includes(status)) return 'danger';
  if (['PENDING', 'CONTACTED', 'QUOTED', 'WAITING_PAYMENT', 'PROVISIONING'].includes(status)) return 'warning';
  return 'neutral';
}

function packageLabel(value) {
  const map = { trial: 'Trial Plus', plus: 'PLUS', pro: 'PRO' };
  return map[String(value || '').toLowerCase()] || String(value || '-').toUpperCase();
}

function renderAccountPanel(order, signup) {
  const account = order?.account || null;
  const hasPortalAccount = Boolean(account?.email || account?.username);
  const loginEmail = account?.email || signup?.email || order?.email || '-';
  const passwordHint = account?.passwordHint || (
    hasPortalAccount
      ? 'Dùng mật khẩu đã đặt khi kích hoạt tài khoản Portal.'
      : 'Tài khoản Portal sẽ xuất hiện sau khi Admin xác nhận thanh toán và khởi tạo tenant.'
  );

  return `
    <section class="order-detail-panel account">
      <div class="order-detail-panel-head">
        <div>
          <p class="eyebrow">Tài khoản Portal</p>
          <h2>Thông tin đăng nhập</h2>
        </div>
        <b class="profile-status ${account?.isActive ? 'success' : hasPortalAccount ? 'warning' : 'warning'}">${account?.isActive ? 'Đã kích hoạt' : hasPortalAccount ? 'Chờ kích hoạt' : 'Chưa khởi tạo'}</b>
      </div>
      <div class="order-detail-grid two">
        <div><span>Email đăng nhập</span><strong>${esc(loginEmail)}</strong></div>
        <div><span>Tên đăng nhập</span><strong>${esc(account?.username || loginEmail)}</strong></div>
        <div><span>Mật khẩu</span><strong>${esc(passwordHint)}</strong></div>
        <div><span>Portal</span><strong>${account?.portalUrl ? `<a href="${esc(account.portalUrl)}" target="_blank" rel="noreferrer">${esc(account.portalUrl)}</a>` : '-'}</strong></div>
      </div>
      ${account?.activationLink ? `
        <div class="activation-box">
          <span>Link kích hoạt</span>
          <a href="${esc(account.activationLink)}" target="_blank" rel="noreferrer">${esc(account.activationLink)}</a>
        </div>
      ` : hasPortalAccount ? `
        <div class="activation-box muted">
          <span>Link kích hoạt</span>
          <strong>Link đã được sử dụng hoặc đã hết hạn.</strong>
        </div>
      ` : ''}
      <p class="order-detail-note">Mật khẩu gốc không được lưu dạng đọc được. Nếu bạn đã đặt mật khẩu mới ở Portal thì dùng chính mật khẩu đó để đăng nhập.</p>
    </section>
  `;
}

function renderTimeline(order) {
  const status = String(order?.status || 'PENDING').toUpperCase();
  const steps = [
    ['PENDING', 'Đã gửi yêu cầu'],
    ['CONTACTED', 'Admin liên hệ'],
    ['QUOTED', 'Đã gửi báo giá'],
    ['PAID', 'Xác nhận thanh toán'],
    ['ACTIVE', 'Sẵn sàng kích hoạt'],
  ];
  const indexMap = {
    PENDING: 0,
    CONTACTED: 1,
    QUOTED: 2,
    WAITING_PAYMENT: 2,
    PAID: 3,
    APPROVED: 3,
    PROVISIONING: 3,
    ACTIVE: 4,
    COMPLETED: 4,
  };
  const activeIndex = indexMap[status] ?? 0;
  const failed = ['REJECTED', 'CANCELLED', 'PROVISIONING_FAILED'].includes(status);
  const completedTerminal = ['ACTIVE', 'COMPLETED'].includes(status);

  return `
    <ol class="profile-order-timeline order-detail-timeline">
      ${steps.map(([, label], index) => {
        const state = failed && index === activeIndex
          ? 'danger'
          : index < activeIndex || (completedTerminal && index === activeIndex)
            ? 'done'
            : index === activeIndex
              ? 'active'
              : '';
        return `<li class="${state}">${esc(label)}</li>`;
      }).join('')}
    </ol>
  `;
}

export function renderOrderDetailPage(state = {}) {
  const hashCode = window.location.hash.startsWith('#order/')
    ? decodeURIComponent(window.location.hash.replace('#order/', '').trim())
    : '';
  const order = state.purchaseOrder?.orderCode === hashCode
    ? state.purchaseOrder
    : (state.profileOrders || []).find((item) => (item.orderCode || item.id) === hashCode);

  if (!order) {
    return `
      <main class="order-detail-page">
        <section class="profile-empty-state">
          <p class="eyebrow">Chi tiết đơn</p>
          <h1>Đang tải thông tin đơn</h1>
          <p>Nếu dữ liệu chưa xuất hiện, quay lại trang cá nhân và mở lại đơn đăng ký.</p>
          <a class="button secondary" href="#profile">Quay lại cá nhân</a>
        </section>
      </main>
    `;
  }

  const orderCode = order.orderCode || order.id || hashCode || '-';
  const companyName = order.companyName || order.businessName || '-';
  const storeCount = order.requestedStoreCount || order.requestedStores || 1;

  return `
    <main class="order-detail-page">
      <section class="order-detail-hero">
        <a class="back-link" href="#profile">Quay lại trang cá nhân</a>
        <div class="order-detail-title">
          <div>
            <p class="eyebrow">Chi tiết đơn đăng ký</p>
            <h1>${esc(orderCode)}</h1>
            <p>${esc(companyName)} · ${esc(packageLabel(order.packageTier))}</p>
          </div>
          <b class="profile-status ${statusTone(order.status)}">${esc(statusLabel(order.status))}</b>
        </div>
      </section>

      <section class="order-detail-layout">
        <div class="order-detail-main">
          <section class="order-detail-panel">
            <h2>Tiến độ xử lý</h2>
            <p>${esc(order.message || 'Yêu cầu của bạn đang được xử lý.')}</p>
            ${renderTimeline(order)}
          </section>

          ${renderAccountPanel(order, state.marketingSignup)}
        </div>

        <aside class="order-detail-panel">
          <h2>Thông tin đơn</h2>
          <div class="order-detail-grid">
            <div><span>Doanh nghiệp</span><strong>${esc(companyName)}</strong></div>
            <div><span>Gói</span><strong>${esc(packageLabel(order.packageTier))}</strong></div>
            <div><span>Cửa hàng</span><strong>${esc(storeCount)}</strong></div>
            <div><span>Chi phí</span><strong>${money(order.amount)} VND</strong></div>
            <div><span>Ngày tạo</span><strong>${esc(formatDate(order.createdAt))}</strong></div>
            <div><span>Cập nhật</span><strong>${esc(formatDate(order.updatedAt))}</strong></div>
          </div>
        </aside>
      </section>
    </main>
  `;
}
