import { esc, money } from '../utils/format.js';

const ORDER_ACTIONS = {
  PENDING: [
    ['order-contact', 'Đánh dấu đã liên hệ'],
    ['order-reject', 'Từ chối', 'danger'],
  ],
  CONTACTED: [
    ['order-quote', 'Xác nhận báo giá'],
    ['order-cancel', 'Hủy', 'danger'],
  ],
  QUOTED: [
    ['order-wait-payment', 'Chờ thanh toán'],
    ['order-cancel', 'Hủy', 'danger'],
  ],
  WAITING_PAYMENT: [
    ['order-confirm-payment', 'Xác nhận thanh toán'],
    ['order-cancel', 'Hủy', 'danger'],
  ],
  PAID: [
    ['order-approve', 'Duyệt'],
  ],
  APPROVED: [
    ['order-provision', 'Khởi tạo tenant'],
  ],
  PROVISIONING_FAILED: [
    ['order-provision', 'Thử khởi tạo lại'],
  ],
  ON_HOLD: [
    ['order-provision', 'Tiếp tục khởi tạo'],
  ],
};

export function renderOrdersPage(state, helpers) {
  const sourceOrders = buildUnifiedOrders(state);
  const orders = filterOrders(sourceOrders, state);
  const selected = sourceOrders.find((order) => order.id === state.selectedOrderId || order.orderCode === state.selectedOrderId) || null;
  const tabs = [
    ['all', 'Tất cả đơn'],
    ['pending', 'Đang chờ'],
    ['in_progress', 'Đang xử lý'],
    ['paid', 'Đã thanh toán'],
    ['provisioning', 'Khởi tạo'],
    ['completed', 'Hoàn tất'],
  ];

  return `
    <section class="orders-page ${selected ? 'detail-open' : ''}">
      <header class="orders-heading">
        <h1>Đơn đăng ký</h1>
        <p>Quản lý tất cả yêu cầu PLUS-Trial, PLUS và PRO từ đăng ký đến kích hoạt.</p>
      </header>

      <div class="order-filter-tabs" aria-label="Bộ lọc đơn đăng ký">
        ${tabs.map(([value, label]) => `
          <button type="button" class="${(state.orderStatusFilter || 'all') === value ? 'active' : ''}" data-action="set-order-status-filter" data-status="${esc(value)}">${esc(label)}</button>
        `).join('')}
      </div>

      ${renderPublicOrderLookup(state)}

      <section class="orders-card">
        <div class="order-filter-row">
          <label>Gói
            <select data-field="orderPackageFilter">
              <option value="all">Tất cả</option>
              ${['trial', 'plus', 'pro'].map((value) => `<option value="${esc(value)}" ${state.orderPackageFilter === value ? 'selected' : ''}>${esc(packageLabel(value))}</option>`).join('')}
            </select>
          </label>
          <label>Trạng thái
            <select data-field="orderDetailStatusFilter">
              <option value="all">Bất kỳ</option>
              ${uniqueOptions(sourceOrders.map((order) => String(order.status || '').toUpperCase())).map((value) => `<option value="${esc(value)}" ${state.orderDetailStatusFilter === value ? 'selected' : ''}>${esc(statusLabel(value))}</option>`).join('')}
            </select>
          </label>
          <label>Ngày
            <select data-field="orderDateFilter">
              <option value="all" ${state.orderDateFilter === 'all' ? 'selected' : ''}>Tất cả thời gian</option>
              <option value="7" ${state.orderDateFilter === '7' ? 'selected' : ''}>7 ngày qua</option>
              <option value="30" ${!state.orderDateFilter || state.orderDateFilter === '30' ? 'selected' : ''}>30 ngày qua</option>
              <option value="90" ${state.orderDateFilter === '90' ? 'selected' : ''}>90 ngày qua</option>
            </select>
          </label>
        </div>

        <div class="orders-list-table">
          ${tableHeader(['Mã đơn', 'Khách hàng & Công ty', 'Chi tiết gói', 'Số tiền', 'Trạng thái'])}
          ${orders.map((order) => renderOrderRow(order, selected)).join('') || '<div class="empty">Chưa có đơn đăng ký</div>'}
        </div>
        <div class="orders-count">Hiển thị ${orders.length ? `1 đến ${orders.length}` : '0'} trong ${orders.length || 0} đơn đăng ký</div>
      </section>

      ${selected ? renderOrderDetailPopup(selected, helpers, state) : ''}
      ${state.rejectOrderDialog?.open ? renderRejectOrderDialog(state) : ''}
    </section>
  `;
}

function buildUnifiedOrders(state) {
  const orders = (state.orders || []).map((order) => ({ ...order, recordType: 'order', packageTier: normalizePackageTier(order.packageTier) }));
  const trialOrders = (state.trialRequests || []).map((request) => {
    const status = statusFromTrialRequest(request.status);
    return {
      id: `trial:${request.id}`,
      sourceId: request.id,
      recordType: 'trial',
      orderCode: request.id,
      customerName: request.contactName,
      companyName: request.restaurantName,
      email: request.email,
      phone: request.phone,
      packageTier: 'trial',
      requestedStoreCount: 1,
      requestedDeviceCount: 0,
      amount: 0,
      status,
      paymentStatus: status === 'ACTIVE' ? 'PAID' : 'UNPAID',
      orderType: 'TRIAL_REQUEST',
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy,
      note: request.message,
      portalUsername: request.portalUsername,
      portalPassword: request.portalPassword,
      rawTrialRequest: request,
    };
  });
  return [...orders, ...trialOrders].sort((left, right) => (new Date(right.createdAt).getTime() || 0) - (new Date(left.createdAt).getTime() || 0));
}

function statusFromTrialRequest(value) {
  const status = String(value || 'pending').toLowerCase();
  if (status === 'approved') return 'ACTIVE';
  if (status === 'rejected') return 'REJECTED';
  return 'PENDING';
}

function normalizePackageTier(value) {
  const tier = String(value || '').toLowerCase();
  if (tier === 'trial' || tier === 'trial-plus' || tier === 'plus-trial') return 'trial';
  if (tier === 'plus') return 'plus';
  if (tier === 'pro') return 'pro';
  return tier || 'trial';
}

function filterOrders(orders, state) {
  return orders.filter((order) => {
    const status = String(order.status || '').toUpperCase();
    const tabMatch = orderTabMatches(status, state.orderStatusFilter || 'all');
    const packageMatch = state.orderPackageFilter === 'all' || !state.orderPackageFilter || normalizePackageTier(order.packageTier) === state.orderPackageFilter;
    const statusMatch = state.orderDetailStatusFilter === 'all' || !state.orderDetailStatusFilter || status === state.orderDetailStatusFilter;
    const dateMatch = orderDateMatches(order.createdAt, state.orderDateFilter || 'all');
    return tabMatch && packageMatch && statusMatch && dateMatch;
  });
}

function orderTabMatches(status, filter) {
  if (filter === 'all') return true;
  if (filter === 'pending') return status === 'PENDING';
  if (filter === 'in_progress') return ['CONTACTED', 'QUOTED', 'WAITING_PAYMENT'].includes(status);
  if (filter === 'paid') return status === 'PAID' || status === 'APPROVED';
  if (filter === 'provisioning') return ['PROVISIONING', 'PROVISIONING_FAILED', 'ON_HOLD'].includes(status);
  if (filter === 'completed') return ['COMPLETED', 'ACTIVE'].includes(status);
  return true;
}

function orderDateMatches(value, range) {
  if (!range || range === 'all') return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(range));
  return date >= cutoff;
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function renderPublicOrderLookup(state) {
  const result = state.publicOrderLookupResult || null;
  return `
    <section class="public-order-lookup">
      <div class="public-order-copy">
        <h2>Tra cứu đơn công khai</h2>
        <p>Kiểm tra trạng thái mà endpoint công khai trả về cho khách hàng.</p>
      </div>
      <div class="public-order-search">
        <label>
          <span>Mã đơn</span>
          <input data-field="publicOrderLookupCode" value="${esc(state.publicOrderLookupCode || '')}" placeholder="ORD-2026-000001" />
        </label>
        <button type="button" data-action="lookup-public-order">Tra cứu</button>
        ${result ? '<button type="button" class="public-order-clear" data-action="clear-public-order-lookup">Xóa</button>' : ''}
      </div>
      ${result ? renderPublicOrderResult(result) : ''}
    </section>
  `;
}

function renderPublicOrderResult(order) {
  return `
    <div class="public-order-result">
      <span class="order-status-pill ${statusTone(order.status)}">${esc(statusLabel(order.status))}</span>
      <div>
        <strong>${esc(order.orderCode || '-')}</strong>
        <small>Tạo lúc ${esc(formatShortDate(order.createdAt) || '-')}</small>
      </div>
      <div>
        <strong>${esc(packageLabel(order.packageTier))}</strong>
        <small>${esc(order.requestedStoreCount || 1)} cửa hàng</small>
      </div>
      <div>
        <strong>${esc(statusLabel(order.paymentStatus || 'UNPAID'))}</strong>
        <small>Trạng thái thanh toán</small>
      </div>
    </div>
  `;
}

function renderOrderRow(order, selected) {
  const active = selected && selected.id === order.id ? 'active' : '';
  const storeCount = order.requestedStoreCount || 1;
  const deviceCount = order.requestedDeviceCount || 0;

  return `
    <button class="orders-list-row ${active}" data-action="select-order" data-id="${esc(order.id)}">
      <span class="order-code">
        <strong>${esc(order.orderCode || order.id)}</strong>
        <small>${order.recordType === 'trial' ? 'PLUS-Trial' : `#${esc(shortId(order.id))}`}</small>
      </span>
      <span class="order-customer">
        <strong>${esc(order.customerName || '-')}</strong>
        <small>${esc(order.companyName || '-')}</small>
      </span>
      <span class="order-package">
        <strong>${esc(packageLabel(order.packageTier))}</strong>
        <small>${esc(storeCount)} cửa hàng + ${esc(deviceCount)} thiết bị</small>
      </span>
      <span class="order-amount">${money(order.amount)} VND</span>
      <span><span class="order-status-pill ${statusTone(order.status)}">${esc(statusLabel(order.status))}</span></span>
    </button>
  `;
}

function renderOrderDetailPopup(order, helpers, state) {
  return `
    <div class="order-detail-backdrop" data-action="close-order-detail"></div>
    ${renderOrderDetail(order, helpers, state)}
  `;
}

function renderOrderDetail(order, helpers, state) {
  if (order.recordType === 'trial') return renderTrialOrderDetail(order);

  const status = String(order.status || '').toUpperCase();
  const actions = (ORDER_ACTIONS[String(order.status || '').toUpperCase()] || [])
    .map(([action, label, tone]) => `<button class="detail-action-btn ${tone || 'primary'}" data-action="${action}" data-id="${esc(order.id)}">${esc(label)}</button>`)
    .join('');
  const tenantName = order.tenantId ? helpers.tenantName(order.tenantId) : '';
  const total = Number(order.amount || 0);
  const base = Math.round(total * 0.72);
  const hardware = Math.max(0, total - base);
  const canHold = ['APPROVED', 'PROVISIONING', 'PROVISIONING_FAILED'].includes(status);
  const provisioningResult = state?.lastProvisioningResult?.orderId === order.id || state?.lastProvisioningResult?.orderId === order.orderCode
    ? state.lastProvisioningResult
    : null;
  const rejectionReason = String(order.rejectionReason || '').trim();
  const timeline = buildActivationTimeline(order);

  return `
    <aside class="order-detail-drawer" role="dialog" aria-modal="true" aria-label="Chi tiết đơn đăng ký">
      <header class="order-detail-head">
        <div>
          <h2>#${esc(order.orderCode || order.id)}</h2>
          <p>Tạo lúc ${esc(formatShortDate(order.createdAt) || 'Đang chờ')} bởi ${esc(order.approvedBy || 'Hệ thống')}</p>
        </div>
        <span class="order-status-pill ${statusTone(order.status)}">${esc(statusLabel(order.status))}</span>
        <button class="order-detail-close" type="button" data-action="close-order-detail" aria-label="Đóng chi tiết đơn đăng ký"></button>
      </header>

      <section class="order-contact-card">
        <div class="contact-avatar">${esc(initials(order.customerName || order.companyName || 'SJ'))}</div>
        <div>
          <strong>${esc(order.customerName || '-')}</strong>
          <span>${esc(order.companyName || tenantName || '-')}</span>
          <small>${esc(order.email || '-')}</small>
        </div>
        <div class="contact-phone">
          <span>${esc(order.phone || '(555) 123-4567')}</span>
        </div>
      </section>

      <section class="order-details-box">
        <h3>Chi tiết đơn đăng ký</h3>
        ${detailLine(`${packageLabel(order.packageTier)} (${esc(orderTypeLabel(order.orderType || 'Annual'))})`, `${money(total)} VND`)}
        ${detailLine(`License cơ bản (${esc(order.requestedStoreCount || 1)} cửa hàng)`, `${money(base)} VND`)}
        ${detailLine(`Phần cứng bổ sung (${esc(order.requestedDeviceCount || 0)} thiết bị)`, `${money(hardware)} VND`)}
        ${detailLine('Tổng đã thanh toán', `${money(total)} VND`, 'total')}
      </section>

      <section class="activation-timeline">
        <h3>Dòng thời gian kích hoạt</h3>
        ${timeline.map((item) => drawerTimelineItem(item.label, item.date, item.detail, item.state)).join('')}
      </section>

      ${rejectionReason ? `
        <section class="order-details-box order-rejection-box">
          <h3>Lý do từ chối</h3>
          <p>${esc(rejectionReason)}</p>
        </section>
      ` : ''}

      ${provisioningResult ? renderProvisioningResult(provisioningResult) : ''}

      <div class="order-drawer-actions">
        ${canHold ? `<button class="detail-action-btn muted" type="button" data-action="order-hold-provisioning" data-id="${esc(order.id)}">Tạm giữ khởi tạo</button>` : ''}
        ${actions}
      </div>
    </aside>
  `;
}

function renderTrialOrderDetail(order) {
  const request = order.rawTrialRequest || order;
  const pending = String(request.status || 'pending').toLowerCase() === 'pending';
  return `
    <aside class="order-detail-drawer" role="dialog" aria-modal="true" aria-label="Chi tiết đơn đăng ký PLUS-Trial">
      <header class="order-detail-head">
        <div>
          <h2>#${esc(order.orderCode || order.id)}</h2>
          <p>PLUS-Trial - Gửi lúc ${esc(formatShortDate(order.createdAt) || 'Đang chờ')}</p>
        </div>
        <span class="order-status-pill ${statusTone(order.status)}">${esc(statusLabel(order.status))}</span>
        <button class="order-detail-close" type="button" data-action="close-order-detail" aria-label="Đóng chi tiết đơn đăng ký"></button>
      </header>

      <section class="order-contact-card">
        <div class="contact-avatar">${esc(initials(order.customerName || order.companyName || 'TR'))}</div>
        <div>
          <strong>${esc(order.customerName || '-')}</strong>
          <span>${esc(order.companyName || '-')}</span>
          <small>${esc(order.email || '-')}</small>
        </div>
        <div class="contact-phone">
          <span>${esc(order.phone || 'Chưa có số điện thoại')}</span>
        </div>
      </section>

      <section class="order-details-box">
        <h3>Chi tiết đơn đăng ký</h3>
        ${detailLine('Gói', 'PLUS-Trial')}
        ${detailLine('Loại đơn', 'PLUS-Trial')}
        ${detailLine('Ghi chú', order.note || 'Không có ghi chú')}
        ${detailLine('Người duyệt', order.reviewedBy || '-')}
      </section>

      ${String(request.status || '').toLowerCase() === 'approved' ? `
        <section class="order-details-box provisioning-result">
          <h3>Tài khoản dùng thử</h3>
          ${detailLine('Portal', 'http://localhost:3000')}
          ${detailLine('Tên đăng nhập', request.portalUsername || request.email || '-')}
          ${detailLine('Mật khẩu', request.portalPassword || 'Đã tạo ở backend')}
        </section>
      ` : ''}

      <section class="activation-timeline">
        <h3>Dòng thời gian xử lý</h3>
        ${drawerTimelineItem('Đã nhận yêu cầu', order.createdAt, 'Form dùng thử trên website', 'completed')}
        ${drawerTimelineItem('Đánh giá điều kiện', order.reviewedAt, pending ? 'Chờ quản trị nền tảng' : `Đã xử lý bởi ${order.reviewedBy || 'platform'}`, pending ? 'current' : 'completed')}
        ${drawerTimelineItem('Khởi tạo tenant', request.portalUsername ? order.reviewedAt : '', request.portalUsername ? 'Đã tạo thông tin Portal' : 'Chờ phê duyệt', request.portalUsername ? 'completed' : 'pending')}
      </section>

      <div class="order-drawer-actions">
        ${pending ? `
          <button type="button" class="detail-action-btn danger" data-action="reject-trial" data-id="${esc(order.sourceId)}">Từ chối</button>
          <button type="button" class="detail-action-btn primary" data-action="approve-trial" data-id="${esc(order.sourceId)}">Duyệt & tạo tenant</button>
        ` : '<button type="button" class="detail-action-btn primary" data-action="close-order-detail">Xong</button>'}
      </div>
    </aside>
  `;
}

function renderRejectOrderDialog(state) {
  const dialog = state.rejectOrderDialog || {};
  return `
    <div class="order-reject-backdrop" data-action="close-order-reject-dialog"></div>
    <aside class="order-reject-modal" role="dialog" aria-modal="true" aria-label="Lý do từ chối đơn đăng ký">
      <header class="order-reject-head">
        <div>
          <h2>Từ chối đơn đăng ký</h2>
          <p>${esc(dialog.orderCode || dialog.orderId || 'Đơn đăng ký')}</p>
        </div>
        <button type="button" data-action="close-order-reject-dialog" aria-label="Đóng"></button>
      </header>
      <label class="order-reject-field">
        <span>Lý do từ chối</span>
        <textarea data-field="rejectOrderReason" rows="5" placeholder="Nhập lý do để hiển thị trong chi tiết đơn">${esc(dialog.reason || '')}</textarea>
      </label>
      <div class="order-reject-actions">
        <button type="button" class="tenant-create-secondary" data-action="close-order-reject-dialog">Hủy</button>
        <button type="button" class="tenant-create-primary danger" data-action="confirm-order-reject">Từ chối</button>
      </div>
    </aside>
  `;
}

function renderProvisioningResult(result) {
  const activation = result.activationEmail || {};
  const account = result.account || {};
  const tenant = result.tenant || {};
  const authUser = result.authUser || {};
  const loginName = account.email || authUser.username || '-';
  return `
    <section class="order-details-box provisioning-result">
      <h3>Sẵn sàng kích hoạt</h3>
      ${detailLine('Tenant', tenant.name || tenant.id || '-')}
      ${detailLine('Tài khoản chủ sở hữu', account.email || '-')}
      ${detailLine('Email đăng nhập', loginName)}
      ${detailLine('Mật khẩu', activation.activationLink ? 'Chủ cửa hàng tự đặt qua link kích hoạt' : 'Tài khoản đã tồn tại')}
      ${detailLine('Portal', activation.portalUrl || '-')}
      ${activation.activationLink ? detailLine('Liên kết kích hoạt', activation.activationLink) : detailLine('Trạng thái kích hoạt', activation.status || '-')}
    </section>
  `;
}

function detailLine(label, value, tone = '') {
  return `
    <div class="order-detail-line ${tone}">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
    </div>
  `;
}

function drawerTimelineItem(label, date, detail = '', tone = '') {
  return `
    <div class="drawer-timeline-item ${esc(tone || 'pending')}">
      <strong>${esc(label)}</strong>
      <span>${esc(formatShortDate(date) || 'Đang chờ')} ${detail ? `- ${esc(detail)}` : ''}</span>
    </div>
  `;
}

function buildActivationTimeline(order) {
  const status = String(order.status || 'PENDING').toUpperCase();
  const failed = ['REJECTED', 'CANCELLED', 'FAILED', 'PROVISIONING_FAILED'].includes(status);
  const cancelled = ['REJECTED', 'CANCELLED', 'FAILED'].includes(status);
  const completedByStatus = {
    PENDING: 0,
    CONTACTED: 1,
    QUOTED: 2,
    WAITING_PAYMENT: 2,
    PAID: 3,
    APPROVED: 3,
    PROVISIONING: 3,
    ON_HOLD: 3,
    PROVISIONING_FAILED: 3,
    COMPLETED: 4,
    ACTIVE: 4,
    REJECTED: 0,
    CANCELLED: 0,
    FAILED: 0,
  };
  const currentByStatus = {
    PENDING: 0,
    CONTACTED: 2,
    QUOTED: 3,
    WAITING_PAYMENT: 3,
    PAID: 4,
    APPROVED: 4,
    PROVISIONING: 4,
    ON_HOLD: 4,
    PROVISIONING_FAILED: 4,
    REJECTED: 0,
    CANCELLED: 0,
    FAILED: 0,
  };
  const completedFromDates = [
    order.contactedAt || order.quotedAt || order.paidAt || order.provisionedAt || (!failed && status !== 'PENDING' && order.createdAt),
    order.contactedAt,
    order.quotedAt,
    order.paidAt,
    order.provisionedAt,
  ].reduce((last, value, index) => (value ? index : last), -1);
  const completedIndex = Math.max(completedByStatus[status] ?? -1, completedFromDates);
  const currentIndex = failed ? Math.min(completedIndex + 1, 4) : (currentByStatus[status] ?? 0);
  const steps = [
    ['Đã tạo yêu cầu', order.createdAt, 'Form web'],
    ['Đã liên hệ', order.contactedAt, 'Nhân viên kinh doanh'],
    ['Đã gửi báo giá', order.quotedAt, 'Hiệu lực 30 ngày'],
    ['Đã xác nhận thanh toán', order.paidAt, statusLabel(order.paymentStatus || 'UNPAID')],
    ['Khởi tạo môi trường', order.provisionedAt, order.provisioningStep || 'Đang xử lý - tạo mã tenant...'],
  ];

  if (status === 'REJECTED') {
    steps[1] = ['Đã từ chối', order.rejectedAt, order.rejectionReason || 'Chưa ghi lý do'];
  }
  if (status === 'CANCELLED') {
    steps[1] = ['Đã hủy', order.rejectedAt || order.updatedAt, order.rejectionReason || 'Đơn đăng ký đã hủy'];
  }

  return steps.map(([label, date, detail], index) => {
    let state = 'pending';
    if (index <= completedIndex) state = 'completed';
    if (index === currentIndex && index > completedIndex) state = 'current';
    if (failed && index === currentIndex) state = 'failed current';
    if (cancelled && completedIndex < 0 && index === 0) state = 'failed current';
    return { label, date, detail, state };
  });
}

function tableHeader(items) {
  return `<div class="orders-list-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
}

function formatDate(value) {
  if (!value) return '';
  return String(value).replace('T', ' ').slice(0, 19);
}

function formatShortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function packageLabel(value) {
  const map = { trial: 'PLUS-Trial', plus: 'PLUS', pro: 'PRO', starter: 'Starter', restaurant: 'Nhà hàng', chain: 'Chuỗi' };
  return map[value] || value || '-';
}

function statusLabel(value) {
  const status = String(value || 'PENDING').toUpperCase();
  const map = {
    PENDING: 'Đang chờ',
    CONTACTED: 'Đã liên hệ',
    QUOTED: 'Đã báo giá',
    WAITING_PAYMENT: 'Chờ thanh toán',
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    APPROVED: 'Đã duyệt',
    PROVISIONING: 'Đang khởi tạo',
    PROVISIONING_FAILED: 'Khởi tạo lỗi',
    ON_HOLD: 'Tạm giữ',
    COMPLETED: 'Hoàn tất',
    ACTIVE: 'Đang hoạt động',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
    FAILED: 'Thất bại',
  };
  return map[status] || status.replaceAll('_', ' ');
}

function orderTypeLabel(value) {
  const type = String(value || '').toUpperCase();
  const map = { ANNUAL: 'Hàng năm', MONTHLY: 'Hàng tháng', MANAGED: 'Quản lý' };
  return map[type] || value || '-';
}

function statusTone(value) {
  const status = String(value || '').toUpperCase();
  if (['PROVISIONING', 'APPROVED', 'ON_HOLD'].includes(status)) return 'provisioning';
  if (['PAID', 'COMPLETED', 'ACTIVE'].includes(status)) return 'success';
  if (['REJECTED', 'CANCELLED', 'FAILED', 'PROVISIONING_FAILED'].includes(status)) return 'danger';
  if (['PENDING', 'CONTACTED', 'QUOTED', 'WAITING_PAYMENT'].includes(status)) return 'warning';
  return 'neutral';
}

function shortId(value) {
  return String(value || '').slice(0, 8) || 'order';
}

function initials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'SJ';
}
