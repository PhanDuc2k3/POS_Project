import { warrantyPolicies } from '../shared/data.js';

export function renderWarrantyPage() {
  const policies = warrantyPolicies.map((item) => `<li>${item}</li>`).join('');

  return `
    <main class="page-main">
      <section class="section page-hero">
        <p class="eyebrow">Bảo hành</p>
        <h1>Đồng hành trong quá trình vận hành thực tế.</h1>
        <p>Chính sách hỗ trợ tập trung vào sự ổn định phần mềm, cấu hình hệ thống và phản hồi nhanh khi cửa hàng cần xử lý sự cố.</p>
      </section>
      <section class="section support-layout">
        <div class="content-card">
          <h2>Phạm vi hỗ trợ</h2>
          <ul class="check-list">${policies}</ul>
        </div>
        <div class="content-card support-contact">
          <h2>Kênh tiếp nhận</h2>
          <p>Email: support@precisionpos.local</p>
          <p>Hotline: 0900 000 800</p>
          <a class="button primary" href="#contact">Liên hệ hỗ trợ</a>
        </div>
      </section>
    </main>
  `;
}
