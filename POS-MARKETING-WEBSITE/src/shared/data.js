export const navLinks = [
  { href: '#home', label: 'Trang chủ' },
  { href: '#products', label: 'Sản phẩm' },
  { href: '#news', label: 'Tin tức' },
  { href: '#warranty', label: 'Bảo hành' },
  { href: '#locations', label: 'Địa điểm công ty' },
];

export const products = [
  {
    title: 'POS bán hàng',
    text: 'Giao diện thu ngân nhanh, quản lý ca làm, thanh toán tiền mặt/chuyển khoản và in hóa đơn.',
    image: 'assets/home.png',
  },
  {
    title: 'Portal quản lý',
    text: 'Theo dõi doanh thu, đơn hàng, sản phẩm, cấu hình cửa hàng và báo cáo vận hành.',
    image: 'assets/features.png',
  },
  {
    title: 'QR order và bếp',
    text: 'Khách gọi món tại bàn, bếp nhận ticket realtime và nhân viên theo dõi trạng thái phục vụ.',
    image: 'assets/demo.png',
  },
];

export const news = [
  {
    date: '17/08/2026',
    title: 'Ra mắt bộ giải pháp POS cho nhà hàng',
    text: 'Precision POS kết nối thu ngân, QR order, bếp, thanh toán và báo cáo trên một nền tảng.',
  },
  {
    date: '10/08/2026',
    title: 'Tối ưu vận hành đa chi nhánh',
    text: 'Bộ công cụ platform admin giúp quản lý tenant, gói dịch vụ, tài khoản và quyền truy cập.',
  },
  {
    date: '01/08/2026',
    title: 'Cải thiện trải nghiệm gọi món tại bàn',
    text: 'Dining session và kitchen display giúp đơn hàng đi từ khách đến bếp rõ ràng hơn.',
  },
];

export const warrantyPolicies = [
  'Hỗ trợ kỹ thuật từ xa trong giờ làm việc cho khách hàng đang sử dụng dịch vụ.',
  'Bảo trì phần mềm định kỳ, cập nhật lỗi và cải thiện tính ổn định hệ thống.',
  'Hỗ trợ cấu hình máy in, tài khoản, cửa hàng, menu và quy trình vận hành ban đầu.',
  'Tiếp nhận sự cố qua email, hotline hoặc form liên hệ trên website.',
];

export const companyLocations = [
  {
    city: 'TP. Hồ Chí Minh',
    address: 'Tầng 5, Tòa nhà Innovation Hub, Quận 1',
    phone: '0900 000 800',
  },
  {
    city: 'Hà Nội',
    address: 'Tầng 3, Tòa nhà Business Center, Cầu Giấy',
    phone: '0900 000 801',
  },
];

export const metrics = [
  { value: '30%', label: 'faster order entry' },
  { value: '4', label: 'connected apps' },
  { value: '24/7', label: 'restaurant operations' },
  { value: '1', label: 'source of truth' },
];

export const features = [
  {
    number: '02',
    title: 'Kitchen Display System',
    text: 'Orders route instantly to kitchen/bar with visible timing, status, and prep flow.',
    tone: 'dark',
  },
  {
    number: '03',
    title: 'QR order and pay',
    text: 'Guests scan, browse the live menu, submit orders, and reduce staff bottlenecks.',
  },
  {
    number: '04',
    title: 'Management portal',
    text: 'Track revenue, orders, menu performance, store configuration, and operational reports.',
  },
  {
    number: '05',
    title: 'Integrated payments',
    text: 'Support cash, transfer, webhook confirmation, and payment state synchronization.',
  },
];

export const solutions = [
  {
    title: 'Cafe and quick service',
    text: 'Fast counter sales, receipts, menu control, and daily dashboard.',
  },
  {
    title: 'Full-service restaurants',
    text: 'QR ordering, dining sessions, kitchen display, and staff POS.',
  },
  {
    title: 'Chains and platform owners',
    text: 'Tenant, package, account, and permission management across locations.',
  },
];

export const workflowSteps = [
  {
    title: 'Guest or staff creates order',
    text: 'Orders begin from QR ordering, customer app, or the staff POS terminal.',
  },
  {
    title: 'Kitchen receives tickets',
    text: 'The KDS shows live tickets by station so prep work stays visible and accountable.',
  },
  {
    title: 'Payment is confirmed',
    text: 'Cash or transfer payments update the order state and can trigger receipt printing.',
  },
  {
    title: 'Managers see the full picture',
    text: 'Portal analytics and admin controls stay aligned with the live operational data.',
  },
];

export const plans = [
  {
    name: 'Basic',
    description: 'For small shops and counter-service teams.',
    price: '290k',
    suffix: ' VND/mo',
    cta: 'Start free trial',
    href: '#trial',
    features: ['Staff POS', 'Basic portal', 'Receipt printing', 'Daily sales report'],
  },
  {
    name: 'Restaurant',
    description: 'For venues using QR order and kitchen flow.',
    price: '1.9m',
    suffix: ' VND/mo',
    cta: 'Start free trial',
    href: '#trial',
    recommended: true,
    features: ['Customer ordering app', 'Kitchen display system', 'Dining sessions', 'Realtime order sync'],
  },
  {
    name: 'Enterprise',
    description: 'For chains and platform owners.',
    price: 'Custom',
    suffix: '',
    cta: 'Contact sales',
    href: '#contact',
    features: ['Multi-branch control', 'Tenant administration', 'Advanced permission matrix', 'Priority support'],
  },
];
