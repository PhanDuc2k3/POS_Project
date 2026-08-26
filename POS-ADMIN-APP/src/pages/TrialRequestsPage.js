import { esc } from '../utils/format.js';

const fallbackRequests = [
  {
    id: 'TR-2041',
    restaurantName: 'Northstar Bistro',
    contactName: 'Amelia Chen',
    email: 'amelia@northstar.test',
    phone: '(555) 014-2219',
    packageTier: 'pro',
    operatingMode: 'restaurant',
    status: 'pending',
    message: 'Cần màn hình bếp và đặt món cho khách tại hai địa điểm.',
    createdAt: '2026-08-18T09:30:00Z',
  },
  {
    id: 'TR-2038',
    restaurantName: 'Urban Beans',
    contactName: 'Jon Bell',
    email: 'jon@urbanbeans.test',
    phone: '(555) 012-8870',
    packageTier: 'plus',
    operatingMode: 'simple',
    status: 'approved',
    portalUsername: 'trial_2038',
    portalPassword: 'Đã tạo',
    reviewedBy: 'platform',
    createdAt: '2026-08-16T14:10:00Z',
  },
  {
    id: 'TR-2034',
    restaurantName: 'Deli Square',
    contactName: 'Priya Rao',
    email: 'priya@delisquare.test',
    phone: '(555) 018-1092',
    packageTier: 'trial',
    operatingMode: 'retail',
    status: 'rejected',
    reviewedBy: 'platform',
    message: 'Yêu cầu phần cứng tùy chỉnh chưa được hỗ trợ trong giai đoạn dùng thử.',
    createdAt: '2026-08-14T11:05:00Z',
  },
];

const fallbackLeads = [
  { id: 'lead-1', name: 'Golden Spoon Group', phone: '(555) 012-4411', email: 'ops@goldenspoon.test', status: 'new', message: 'Quan tâm triển khai nhiều chi nhánh.', createdAt: '2026-08-19' },
  { id: 'lead-2', name: 'Market Lane', phone: '(555) 019-8820', email: 'hello@marketlane.test', status: 'contacted', message: 'Đã hỏi bảng so sánh giá.', createdAt: '2026-08-17' },
];

export function renderTrialRequestsPage(state) {
  const sourceRequests = state.trialRequests?.length ? state.trialRequests : fallbackRequests;
  const requests = filterRequests(sourceRequests, state);
  const leads = state.salesLeads?.length ? state.salesLeads : fallbackLeads;
  const marketingSignups = state.marketingSignups || [];
  const selected = sourceRequests.find((request) => String(request.id) === String(state.selectedTrialRequestId)) || null;
  const selectedLead = leads.find((lead) => String(lead.id) === String(state.selectedSalesLeadId)) || null;
  const pendingCount = requests.filter((request) => statusOf(request) === 'pending').length;
  const approvedCount = requests.filter((request) => statusOf(request) === 'approved').length;
  const rejectedCount = requests.filter((request) => statusOf(request) === 'rejected').length;

  return `
    <section class="trial-page ${selected || selectedLead ? 'detail-open' : ''}">
      <header class="trial-heading">
        <div>
          <h1>Yêu cầu dùng thử</h1>
          <p>Rà soát yêu cầu dùng thử và chuyển doanh nghiệp phù hợp thành tenant.</p>
        </div>
        <button type="button" class="trial-refresh-btn" data-action="refresh-data"><i></i>Làm mới</button>
      </header>

      <section class="trial-metrics">
        ${metricCard('Chờ duyệt', pendingCount || 18, '+6%', 'warning')}
        ${metricCard('Đã duyệt dùng thử', approvedCount || 42, '+12%', 'success')}
        ${metricCard('Đã từ chối', rejectedCount || 7, '-3%', 'danger')}
        ${metricCard('Lead bán hàng', leads.length || 24, '+9%', 'neutral')}
        ${metricCard('Đăng ký marketing', marketingSignups.length, '+live', 'neutral')}
      </section>

      <div class="trial-workspace">
        <section class="trial-table-card">
          <div class="trial-tabs">
            ${[
              ['all', 'Tất cả yêu cầu'],
              ['pending', 'Đang chờ'],
              ['approved', 'Đã duyệt'],
              ['rejected', 'Đã từ chối'],
            ].map(([value, label]) => `
              <button type="button" class="${(state.trialStatusFilter || 'all') === value ? 'active' : ''}" data-action="set-trial-status-filter" data-status="${esc(value)}">${esc(label)}</button>
            `).join('')}
          </div>

          <div class="trial-toolbar">
            <label class="trial-search">
              <i></i>
              <input data-field="trialSearch" value="${esc(state.trialSearch || '')}" aria-label="Tìm yêu cầu dùng thử" placeholder="Tìm nhà hàng, liên hệ, email..." />
            </label>
            <div class="trial-filters">
              <select data-field="trialPackageFilter" aria-label="Lọc gói dùng thử">
                <option value="all">Tất cả gói</option>
                ${uniqueOptions(sourceRequests.map((request) => request.packageTier)).map((value) => `<option value="${esc(value)}" ${state.trialPackageFilter === value ? 'selected' : ''}>${esc(packageLabel(value))}</option>`).join('')}
              </select>
              <select data-field="trialModeFilter" aria-label="Lọc mô hình dùng thử">
                <option value="all">Tất cả mô hình</option>
                ${uniqueOptions(sourceRequests.map((request) => request.operatingMode)).map((value) => `<option value="${esc(value)}" ${state.trialModeFilter === value ? 'selected' : ''}>${esc(modeLabel(value))}</option>`).join('')}
              </select>
              <select data-field="trialSort" aria-label="Sắp xếp yêu cầu dùng thử">
                <option value="newest" ${state.trialSort !== 'oldest' ? 'selected' : ''}>Mới nhất trước</option>
                <option value="oldest" ${state.trialSort === 'oldest' ? 'selected' : ''}>Cũ nhất trước</option>
              </select>
            </div>
          </div>

          <div class="trial-table">
            ${tableHeader(['Yêu cầu', 'Liên hệ', 'Gói', 'Mô hình', 'Trạng thái', 'Ngày gửi', 'Thao tác'])}
            ${requests.map((request) => renderRequestRow(request)).join('') || '<div class="empty">Chưa có yêu cầu dùng thử</div>'}
          </div>
        </section>

        <aside class="sales-leads-panel">
          <div class="sales-leads-head">
            <h2>Lead bán hàng</h2>
            <span>${esc(leads.length)} yêu cầu liên hệ</span>
          </div>
          <div class="sales-lead-list">
            ${leads.map(renderLeadCard).join('') || '<div class="empty">Chưa có lead bán hàng</div>'}
          </div>
        </aside>
      </div>

      ${selected ? renderRequestDetail(selected) : ''}
      ${selectedLead ? renderLeadDetail(selectedLead) : ''}
    </section>
  `;
}

function filterRequests(requests, state) {
  const query = String(state.trialSearch || '').trim().toLowerCase();
  const filtered = requests.filter((request) => {
    const statusMatch = state.trialStatusFilter === 'all' || !state.trialStatusFilter || statusOf(request) === state.trialStatusFilter;
    const packageMatch = state.trialPackageFilter === 'all' || !state.trialPackageFilter || request.packageTier === state.trialPackageFilter;
    const modeMatch = state.trialModeFilter === 'all' || !state.trialModeFilter || request.operatingMode === state.trialModeFilter;
    const haystack = [request.id, request.restaurantName, request.contactName, request.email, request.phone, request.message].join(' ').toLowerCase();
    return statusMatch && packageMatch && modeMatch && (!query || haystack.includes(query));
  });
  return filtered.sort((a, b) => {
    const left = new Date(a.createdAt).getTime() || 0;
    const right = new Date(b.createdAt).getTime() || 0;
    return state.trialSort === 'oldest' ? left - right : right - left;
  });
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).toLowerCase()))];
}

function renderRequestRow(request) {
  const status = statusOf(request);
  return `
    <div class="trial-table-row">
      <button type="button" class="trial-request-cell" data-action="select-trial-request" data-id="${esc(request.id)}">
        <span>${esc(initials(request.restaurantName))}</span>
        <strong>${esc(request.restaurantName || '-')}</strong>
        <small>${esc(request.id)}</small>
      </button>
      <span class="trial-contact">
        <strong>${esc(request.contactName || '-')}</strong>
        <small>${esc(request.email || '-')}</small>
      </span>
      <span><b class="trial-package ${esc(packageTone(request.packageTier))}">${esc(packageLabel(request.packageTier))}</b></span>
      <span class="trial-mode">${esc(modeLabel(request.operatingMode))}</span>
      <span><b class="trial-status ${esc(status)}">${esc(statusLabel(status))}</b></span>
      <span class="trial-date">${esc(formatDate(request.createdAt))}</span>
      <span class="trial-row-actions">
        <button type="button" data-action="select-trial-request" data-id="${esc(request.id)}" aria-label="Mở chi tiết yêu cầu"></button>
      </span>
    </div>
  `;
}

function renderRequestDetail(request) {
  const pending = statusOf(request) === 'pending';
  return `
    <div class="trial-detail-backdrop" data-action="close-trial-request"></div>
    <aside class="trial-detail-drawer" role="dialog" aria-modal="true" aria-label="Chi tiết yêu cầu dùng thử">
      <header class="trial-detail-head">
        <div>
          <h2>${esc(request.restaurantName || 'Yêu cầu dùng thử')}</h2>
          <p>${esc(request.id)} - Gửi lúc ${esc(formatDate(request.createdAt))}</p>
        </div>
        <b class="trial-status ${esc(statusOf(request))}">${esc(statusLabel(statusOf(request)))}</b>
        <button type="button" data-action="close-trial-request" aria-label="Đóng yêu cầu dùng thử"></button>
      </header>

      <section class="trial-contact-card">
        <span>${esc(initials(request.contactName || request.restaurantName))}</span>
        <div>
          <strong>${esc(request.contactName || '-')}</strong>
          <small>${esc(request.email || '-')}</small>
          <small>${esc(request.phone || 'Chưa có số điện thoại')}</small>
        </div>
      </section>

      <section class="trial-info-box">
        <h3>Chi tiết yêu cầu</h3>
        ${infoRow('Doanh nghiệp', request.restaurantName)}
        ${infoRow('Gói', packageLabel(request.packageTier))}
        ${infoRow('Mô hình vận hành', modeLabel(request.operatingMode))}
        ${infoRow('Ghi chú', request.message || 'Không có ghi chú')}
      </section>

      ${statusOf(request) === 'approved' ? accountBlock(request) : ''}

      <section class="trial-review-timeline">
        <h3>Dòng thời gian duyệt</h3>
        ${timelineItem('Đã nhận yêu cầu', request.createdAt, 'Form dùng thử trên website', 'done')}
        ${timelineItem('Đánh giá điều kiện', pending ? '' : request.reviewedAt, pending ? 'Chờ quản trị nền tảng' : `Đã duyệt bởi ${request.reviewedBy || 'platform'}`, pending ? 'current' : 'done')}
        ${timelineItem('Khởi tạo tenant', request.portalUsername ? request.reviewedAt : '', request.portalUsername ? 'Đã tạo thông tin đăng nhập Portal' : 'Chờ phê duyệt', request.portalUsername ? 'done' : '')}
      </section>

      <div class="trial-detail-actions">
        ${pending ? `
          <button type="button" class="trial-secondary-btn" data-action="reject-trial" data-id="${esc(request.id)}">Từ chối</button>
          <button type="button" class="trial-primary-btn" data-action="approve-trial" data-id="${esc(request.id)}">Duyệt & tạo tenant</button>
        ` : '<button type="button" class="trial-primary-btn" data-action="close-trial-request">Xong</button>'}
      </div>
    </aside>
  `;
}

function renderLeadCard(lead) {
  return `
    <button type="button" class="sales-lead-card" data-action="select-sales-lead" data-id="${esc(lead.id)}">
      <div>
        <strong>${esc(lead.name || '-')}</strong>
        <span>${esc(lead.phone || 'Chưa có số điện thoại')} - ${esc(lead.email || 'Chưa có email')}</span>
      </div>
      <b class="${esc(statusOf(lead))}">${esc(statusLabel(statusOf(lead)))}</b>
      ${lead.message ? `<p>${esc(lead.message)}</p>` : ''}
      <small>${esc(formatDate(lead.createdAt))}</small>
    </button>
  `;
}

function renderLeadDetail(lead) {
  const status = statusOf(lead);
  return `
    <div class="trial-detail-backdrop" data-action="close-sales-lead"></div>
    <aside class="trial-detail-drawer sales-lead-detail" role="dialog" aria-modal="true" aria-label="Chi tiết lead bán hàng">
      <header class="trial-detail-head">
        <div>
          <h2>${esc(lead.name || 'Lead bán hàng')}</h2>
          <p>${esc(lead.id)} - Tạo lúc ${esc(formatDate(lead.createdAt))}</p>
        </div>
        <b class="trial-status ${esc(status)}">${esc(statusLabel(status))}</b>
        <button type="button" data-action="close-sales-lead" aria-label="Đóng lead bán hàng"></button>
      </header>

      <section class="trial-contact-card">
        <span>${esc(initials(lead.name))}</span>
        <div>
          <strong>${esc(lead.name || '-')}</strong>
          <small>${esc(lead.email || 'Chưa có email')}</small>
          <small>${esc(lead.phone || 'Chưa có số điện thoại')}</small>
        </div>
      </section>

      <section class="trial-info-box">
        <h3>Chi tiết lead</h3>
        ${infoRow('Tên liên hệ', lead.name)}
        ${infoRow('Số điện thoại', lead.phone || 'Chưa có số điện thoại')}
        ${infoRow('Email', lead.email || 'Chưa có email')}
        ${infoRow('Ghi chú', lead.message || 'Không có ghi chú')}
        ${infoRow('Cập nhật gần nhất', lead.updatedAt ? formatDate(lead.updatedAt) : '-')}
      </section>

      <section class="trial-review-timeline">
        <h3>Dòng thời gian bán hàng</h3>
        ${timelineItem('Đã nhận lead', lead.createdAt, 'Form liên hệ công khai', 'done')}
        ${timelineItem('Liên hệ ban đầu', status === 'new' ? '' : lead.updatedAt, status === 'new' ? 'Chờ liên hệ' : 'Đã liên hệ lead', status === 'new' ? 'current' : 'done')}
        ${timelineItem('Đánh giá lead', ['qualified', 'lost'].includes(status) ? lead.updatedAt : '', status === 'qualified' ? 'Đủ điều kiện để sales theo dõi' : status === 'lost' ? 'Lead đã đánh dấu mất' : 'Chờ đánh giá', ['qualified', 'lost'].includes(status) ? 'done' : '')}
      </section>

      <div class="trial-detail-actions lead-detail-actions">
        ${leadActionButton(lead, 'CONTACTED', 'Đánh dấu đã liên hệ', 'trial-secondary-btn')}
        ${leadActionButton(lead, 'QUALIFIED', 'Đánh dấu đủ điều kiện', 'trial-primary-btn')}
        ${leadActionButton(lead, 'LOST', 'Đánh dấu mất', 'trial-danger-btn')}
      </div>
    </aside>
  `;
}

function leadActionButton(lead, status, label, className) {
  const current = statusOf(lead) === status.toLowerCase();
  return `
    <button
      type="button"
      class="${esc(className)}"
      data-action="update-sales-lead-status"
      data-id="${esc(lead.id)}"
      data-status="${esc(status)}"
      ${current ? 'disabled' : ''}
    >${esc(label)}</button>
  `;
}

function accountBlock(request) {
  return `
    <section class="trial-account-ready">
      <h3>Tài khoản sẵn sàng</h3>
      ${infoRow('Portal', 'http://localhost:3000')}
      ${infoRow('Tên đăng nhập', request.portalUsername || request.email)}
      ${infoRow('Mật khẩu', request.portalPassword || 'Đã tạo ở backend')}
    </section>
  `;
}

function metricCard(label, value, change, tone) {
  return `
    <article class="trial-metric ${tone}">
      <span>${esc(label)}</span>
      <strong>${Number(value || 0).toLocaleString('vi-VN')}</strong>
      <small>${esc(change)}</small>
    </article>
  `;
}

function tableHeader(items) {
  return `<div class="trial-table-head">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
}

function infoRow(label, value) {
  return `
    <div class="trial-info-row">
      <span>${esc(label)}</span>
      <strong>${esc(value || '-')}</strong>
    </div>
  `;
}

function timelineItem(label, date, detail, tone = '') {
  return `
    <div class="trial-timeline-item ${esc(tone)}">
      <strong>${esc(label)}</strong>
      <span>${date ? `${esc(formatDate(date))} - ` : ''}${esc(detail || 'Đang chờ')}</span>
    </div>
  `;
}

function statusOf(item) {
  return String(item.status || 'pending').toLowerCase();
}

function statusLabel(value) {
  const map = { pending: 'Đang chờ', approved: 'Đã duyệt', rejected: 'Đã từ chối', new: 'Mới', contacted: 'Đã liên hệ', qualified: 'Đủ điều kiện', lost: 'Đã mất' };
  return map[value] || value;
}

function packageLabel(value) {
  const map = { pro: 'PRO', plus: 'PLUS', trial: 'TRIAL', starter: 'STARTER' };
  return map[String(value || '').toLowerCase()] || String(value || '-').toUpperCase();
}

function packageTone(value) {
  const tier = String(value || '').toLowerCase();
  if (tier === 'pro') return 'pro';
  if (tier === 'plus') return 'plus';
  return 'trial';
}

function modeLabel(value) {
  const mode = String(value || '').toLowerCase();
  if (mode === 'restaurant') return 'Nhà hàng';
  if (mode === 'retail') return 'Bán lẻ';
  if (mode === 'simple') return 'Đơn giản';
  return mode ? mode[0].toUpperCase() + mode.slice(1) : '-';
}

function initials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'TR';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
