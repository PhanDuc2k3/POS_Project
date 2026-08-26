export function renderFormsSection(state = {}) {
  const request = state.myTrialRequest || null;
  const packageDraft = state.packageDraft || 'pro';
  const hasMarketingSignup = Boolean(state.marketingSignup?.signupToken);
  const status = String(request?.status || '').toUpperCase();
  const locked = request && ['PENDING', 'CONTACTED', 'QUOTED', 'WAITING_PAYMENT', 'PAID', 'APPROVED', 'ACTIVE'].includes(status);
  const trialNote = locked
    ? `Yêu cầu hiện tại đang ở trạng thái ${status}.`
    : hasMarketingSignup
      ? 'Bạn đã đăng ký thông tin. Hãy gửi form để Admin duyệt, tạo tenant và gửi tài khoản Portal sau.'
      : 'Vui lòng đăng ký trước khi gửi form để hạn chế spam.';
  const requestStatus = request ? `
    <div class="request-status">
      <p class="eyebrow">Yêu cầu của bạn</p>
      <strong>${request.id || 'REQ-DEMO'}</strong>
      <span>${request.businessName || 'Doanh nghiệp'} · ${request.packageTier || 'PLUS'} · ${request.requestedStores || 1} cửa hàng</span>
      <ol>
        <li class="active">Đã gửi yêu cầu</li>
        <li>Đang xem xét</li>
        <li>Khởi tạo hệ thống</li>
        <li>Sẵn sàng sử dụng</li>
      </ol>
    </div>
  ` : '';

  return `
    <section class="section forms" id="trial">
      <div class="trial-panel">
        <div>
          <p class="eyebrow">Request trial / buy</p>
          <h2>Chọn gói, nhập số cửa hàng, gửi yêu cầu cho POS-Admin.</h2>
          <p>${trialNote}</p>
        </div>
        <div class="trial-form-stack">
          <form class="form-card" data-form="trial">
            <label>Tên doanh nghiệp<input name="businessName" placeholder="ABC Coffee" required /></label>
            <label>Người liên hệ<input name="contactName" placeholder="Nguyen Van A" required /></label>
            <label>Email<input name="email" type="email" placeholder="owner@example.com" required /></label>
            <label>Số điện thoại<input name="phone" placeholder="+84..." required /></label>
            <div class="two-inputs">
              <label>
                Gói dịch vụ
                <select name="packageTier">
                  <option value="trial" ${packageDraft === 'trial' ? 'selected' : ''}>Trial Plus</option>
                  <option value="plus" ${packageDraft === 'plus' ? 'selected' : ''}>PLUS</option>
                  <option value="pro" ${packageDraft === 'pro' ? 'selected' : ''}>PRO</option>
                </select>
              </label>
              <label>Số cửa hàng<input name="requestedStores" type="number" min="1" value="1" required /></label>
            </div>
            <div class="two-inputs">
              <label>Số thiết bị<input name="requestedDevices" type="number" min="0" value="1" required /></label>
              <label>
                Loại hình
                <select name="businessType">
                  <option value="cafe">Cafe / cửa hàng</option>
                  <option value="restaurant" selected>Nhà hàng</option>
                  <option value="chain">Chuỗi nhiều chi nhánh</option>
                </select>
              </label>
            </div>
            <label>Ghi chú<textarea name="note" rows="3" placeholder="Mô hình quán, số chi nhánh dự kiến, nhu cầu triển khai..."></textarea></label>
            <button class="button primary" type="submit" ${locked ? 'disabled' : ''}>${hasMarketingSignup ? 'Gửi yêu cầu' : 'Đăng ký để gửi yêu cầu'}</button>
            <p class="form-message" role="status"></p>
          </form>
          ${requestStatus}
        </div>
      </div>
    </section>
    <section class="section contact-signin contact-only" id="contact">
      <form class="contact-card" data-form="contact">
        <p class="eyebrow">Contact sales</p>
        <h2>Dành cho chuỗi lớn cần tư vấn riêng.</h2>
        <div class="two-inputs">
          <label>Họ tên<input name="name" placeholder="Your name" required /></label>
          <label>Số điện thoại<input name="phone" placeholder="+84..." required /></label>
        </div>
        <label>Email<input name="email" type="email" placeholder="owner@example.com" /></label>
        <label>Nhu cầu<textarea name="message" rows="4" placeholder="Ví dụ: 20 cửa hàng, cần triển khai nhiều khu vực"></textarea></label>
        <button class="button primary" type="submit">${hasMarketingSignup ? 'Gửi thông tin tư vấn' : 'Đăng ký để gửi tư vấn'}</button>
        <p class="form-message" role="status"></p>
      </form>
    </section>
  `;
}
