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
    REGISTERED: 'Đã đăng ký',
    NEW: 'Mới',
    CONTACTED: 'Đã liên hệ',
    QUALIFIED: 'Đủ điều kiện',
    LOST: 'Đã mất',
    PENDING: 'Đang chờ',
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
  if (['ACTIVE', 'COMPLETED', 'APPROVED', 'PAID', 'QUALIFIED', 'REGISTERED'].includes(status)) return 'success';
  if (['REJECTED', 'CANCELLED', 'LOST', 'PROVISIONING_FAILED'].includes(status)) return 'danger';
  if (['PENDING', 'WAITING_PAYMENT', 'CONTACTED', 'QUOTED', 'PROVISIONING'].includes(status)) return 'warning';
  return 'neutral';
}

function packageLabel(value) {
  const map = { trial: 'Trial Plus', plus: 'PLUS', pro: 'PRO' };
  return map[String(value || '').toLowerCase()] || String(value || '-').toUpperCase();
}

function initials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';
}

function orderTimeline(order) {
  const status = String(order.status || 'PENDING').toUpperCase();
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
    <ol class="profile-order-timeline">
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

function renderOrderCard(order) {
  const orderCode = order.orderCode || order.id || '-';
  const companyName = order.companyName || order.businessName || '-';
  return `
    <article class="profile-record-card">
      <div class="profile-record-head">
        <div>
          <span>Đơn đăng ký</span>
          <strong>${esc(orderCode)}</strong>
        </div>
        <b class="profile-status ${statusTone(order.status)}">${esc(statusLabel(order.status))}</b>
      </div>
      <div class="profile-record-grid">
        <div><span>Doanh nghiệp</span><strong>${esc(companyName)}</strong></div>
        <div><span>Gói</span><strong>${esc(packageLabel(order.packageTier))}</strong></div>
        <div><span>Cửa hàng</span><strong>${esc(order.requestedStoreCount || 1)}</strong></div>
        <div><span>Chi phí</span><strong>${money(order.amount)} VND</strong></div>
      </div>
      <p>${esc(order.message || 'Yêu cầu của bạn đang được xử lý.')}</p>
      ${orderTimeline(order)}
      <a class="profile-link-button" href="#order/${encodeURIComponent(orderCode)}">Xem trạng thái công khai</a>
    </article>
  `;
}

function renderLeadCard(lead) {
  return `
    <article class="profile-record-card compact">
      <div class="profile-record-head">
        <div>
          <span>Yêu cầu tư vấn</span>
          <strong>${esc(lead.id || lead.leadCode || '-')}</strong>
        </div>
        <b class="profile-status ${statusTone(lead.status)}">${esc(statusLabel(lead.status))}</b>
      </div>
      <p>${esc(lead.message || 'Đội tư vấn sẽ liên hệ theo thông tin bạn đã gửi.')}</p>
      <small>Gửi ngày ${esc(formatDate(lead.createdAt))}</small>
    </article>
  `;
}

export function renderProfilePage(state = {}) {
  const signup = state.marketingSignup || null;
  const orders = state.profileOrders || [];
  const leads = state.profileLeads || [];
  const latestOrder = orders[0] || state.myTrialRequest || null;

  if (!signup?.signupToken) {
    return `
      <main class="profile-page">
        <section class="profile-empty-state">
          <p class="eyebrow">Tài khoản cá nhân</p>
          <h1>Đăng nhập để xem hồ sơ đăng ký</h1>
          <p>Trang cá nhân lưu thông tin người dùng, đơn đăng ký POS và các yêu cầu tư vấn đã gửi.</p>
          <button class="button primary" type="button" data-action="open-auth" data-auth-mode="signin">Đăng nhập</button>
        </section>
      </main>
    `;
  }

  return `
    <main class="profile-page">
      <section class="profile-hero">
        <div class="profile-avatar">${esc(initials(signup.name || signup.email))}</div>
        <div>
          <p class="eyebrow">Trang cá nhân</p>
          <h1>${esc(signup.name || 'Người dùng')}</h1>
          <p>${esc(signup.email || '-')}</p>
        </div>
        <b class="profile-status ${statusTone(signup.status)}">${esc(statusLabel(signup.status))}</b>
      </section>

      <section class="profile-summary-grid">
        <article><span>Mã đăng ký</span><strong>${esc(signup.id || signup.signupId || '-')}</strong></article>
        <article><span>Ngày đăng ký</span><strong>${esc(formatDate(signup.registeredAt || signup.createdAt))}</strong></article>
        <article><span>Đơn đã gửi</span><strong>${esc(orders.length)}</strong></article>
        <article><span>Yêu cầu tư vấn</span><strong>${esc(leads.length)}</strong></article>
      </section>

      <section class="profile-layout">
        <div class="profile-main-column">
          <div class="profile-section-head">
            <h2>Kết quả đăng ký</h2>
            <a href="#trial">Gửi yêu cầu mới</a>
          </div>
          ${orders.length ? orders.map(renderOrderCard).join('') : `
            <div class="profile-empty-panel">
              <strong>Chưa có đơn đăng ký POS</strong>
              <p>Hãy chọn gói và gửi yêu cầu để Admin báo giá, xác nhận thanh toán và khởi tạo tenant.</p>
              <a class="profile-link-button" href="#trial">Tạo yêu cầu đăng ký</a>
            </div>
          `}
        </div>

        <aside class="profile-side-column">
          <section class="profile-info-panel">
            <h2>Thông tin người dùng</h2>
            <div><span>Họ tên</span><strong>${esc(signup.name || '-')}</strong></div>
            <div><span>Email</span><strong>${esc(signup.email || '-')}</strong></div>
            <div><span>Trạng thái</span><strong>${esc(statusLabel(signup.status))}</strong></div>
            <div><span>Đơn gần nhất</span><strong>${esc(latestOrder?.orderCode || latestOrder?.id || '-')}</strong></div>
          </section>

          <section class="profile-info-panel">
            <h2>Yêu cầu tư vấn</h2>
            ${leads.length ? leads.map(renderLeadCard).join('') : '<p class="profile-muted">Bạn chưa gửi yêu cầu tư vấn nào.</p>'}
          </section>
        </aside>
      </section>
    </main>
  `;
}
