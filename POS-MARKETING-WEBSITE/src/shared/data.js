export const navLinks = [
  { href: '#home', label: 'Trang chủ' },
  { href: '#products', label: 'Sản phẩm' },
  { href: '#news', label: 'Tin tức' },
  { href: '#warranty', label: 'Bảo hành' },
  { href: '#locations', label: 'Địa điểm công ty' },
];

export const softwareProducts = [
  {
    slug: 'trial-plus',
    category: 'software',
    title: 'Trial Plus 1 tuần',
    text: 'Dùng thử 7 ngày các tính năng bán hàng cốt lõi trước khi nâng cấp lên PLUS hoặc PRO.',
    image: 'assets/demo.png',
    badge: 'Trial',
    summary: 'Gói trải nghiệm nhanh cho cửa hàng mới muốn kiểm tra quy trình bán hàng, menu, đơn và báo cáo trước khi triển khai chính thức.',
    bestFor: 'Cửa hàng mới, cafe nhỏ hoặc đội vận hành muốn thử Precision POS trong môi trường thực tế.',
    highlights: ['Dùng thử trong 7 ngày', 'Có Portal quản lý và Staff POS', 'Dữ liệu demo để thao tác nhanh', 'Có thể nâng cấp lên PLUS hoặc PRO'],
    metrics: [
      { value: '7 ngày', label: 'thời gian trải nghiệm' },
      { value: '0đ', label: 'chi phí khởi đầu' },
      { value: 'PLUS', label: 'luồng bán hàng cốt lõi' },
    ],
    modules: ['Portal', 'Staff POS', 'Demo Menu', 'Sales Report'],
    package: 'Trial',
  },
  {
    slug: 'plus',
    category: 'software',
    title: 'PLUS',
    text: 'Gói phần mềm cho cửa hàng, cafe và mô hình bán tại quầy với Portal quản lý và Staff POS.',
    image: 'assets/home.png',
    badge: 'Software',
    summary: 'PLUS gom các tính năng vận hành cơ bản cho điểm bán: quản lý menu, bán tại quầy, thanh toán, in hóa đơn và báo cáo doanh thu.',
    bestFor: 'Cafe, cửa hàng đồ uống, quầy bán lẻ nhỏ và mô hình cần triển khai POS nhanh.',
    highlights: ['Portal quản lý sản phẩm và doanh thu', 'Staff POS bán tại quầy', 'Thanh toán tiền mặt/chuyển khoản', 'In hóa đơn và báo cáo cơ bản'],
    metrics: [
      { value: '1+', label: 'cửa hàng bằng Store Slot' },
      { value: '2 app', label: 'Portal và Staff POS' },
      { value: '290k', label: 'giá tham chiếu mỗi tháng' },
    ],
    modules: ['Portal', 'Staff POS', 'Products', 'Orders', 'Receipt'],
    package: 'PLUS',
  },
  {
    slug: 'pro',
    category: 'software',
    title: 'PRO',
    text: 'Gói phần mềm cho nhà hàng/F&B có QR order, Customer App, Kitchen App và table workflow.',
    image: 'assets/features.png',
    badge: 'Software',
    summary: 'PRO mở rộng PLUS thành workflow nhà hàng đầy đủ: khách gọi món, nhân viên xử lý đơn, bếp nhận ticket và quản lý theo bàn.',
    bestFor: 'Nhà hàng, quán ăn có bàn, mô hình fast casual hoặc chuỗi cần quy trình phục vụ nhiều bước.',
    highlights: ['Tất cả tính năng PLUS', 'Customer App và QR order', 'Kitchen App nhận ticket realtime', 'Table workflow và dining session'],
    metrics: [
      { value: '4 app', label: 'Portal, POS, Customer, Kitchen' },
      { value: 'Realtime', label: 'đồng bộ đơn và bếp' },
      { value: '1.9m', label: 'giá tham chiếu mỗi tháng' },
    ],
    modules: ['Portal', 'Staff POS', 'Customer App', 'Kitchen App', 'Dining Session'],
    package: 'PRO',
  },
];

export const hardwareProducts = [
  {
    slug: 'pos-terminal',
    category: 'hardware',
    title: 'Máy POS bán hàng',
    text: 'Thiết bị thu ngân cảm ứng tích hợp Staff POS, máy in hóa đơn và thanh toán tại quầy.',
    image: 'assets/home.png',
    badge: 'Hardware',
    summary: 'Bộ máy POS đặt tại quầy giúp nhân viên bán hàng, nhận thanh toán và in hóa đơn trên cùng một điểm thao tác.',
    bestFor: 'Cafe, cửa hàng tiện lợi, quầy order nhanh và nhà hàng cần điểm thanh toán cố định.',
    highlights: ['Màn hình cảm ứng cho Staff POS', 'Kết nối máy in hóa đơn', 'Đồng bộ đơn với Portal', 'Sẵn sàng tích hợp thanh toán'],
    metrics: [
      { value: 'All-in-one', label: 'quầy bán hàng gọn hơn' },
      { value: 'USB/LAN', label: 'kết nối thiết bị ngoại vi' },
      { value: 'PLUS/PRO', label: 'tương thích cả hai gói' },
    ],
    modules: ['Staff POS', 'Receipt Printer', 'Payment', 'Shift'],
    package: 'Tích hợp app',
  },
  {
    slug: 'self-order-kiosk',
    category: 'hardware',
    title: 'Kiosk đặt đồ ăn nhanh',
    text: 'Kiosk tự gọi món cho khách, gửi đơn vào POS và đẩy ticket xuống bếp theo thời gian thực.',
    image: 'assets/solutions.png',
    badge: 'Self-order',
    summary: 'Kiosk đặt món giúp khách tự chọn món, thêm topping, xác nhận đơn và giảm tải cho quầy trong giờ cao điểm.',
    bestFor: 'Fast food, food court, trà sữa, cafe đông khách và mô hình cần self-order.',
    highlights: ['Menu cảm ứng cho khách tự đặt', 'Đẩy đơn về Staff POS và Kitchen App', 'Hỗ trợ combo, topping, ghi chú món', 'Thiết kế cho luồng phục vụ nhanh'],
    metrics: [
      { value: 'Self-order', label: 'giảm hàng chờ tại quầy' },
      { value: 'Realtime', label: 'đơn đi thẳng tới bếp' },
      { value: 'PRO', label: 'phù hợp workflow đầy đủ' },
    ],
    modules: ['Customer Menu', 'Staff POS', 'Kitchen App', 'Dining Session'],
    package: 'Tích hợp app',
  },
  {
    slug: 'kitchen-display',
    category: 'hardware',
    title: 'Màn hình bếp/bar',
    text: 'Màn hình hiển thị ticket bếp theo trạng thái, đồng bộ với đơn từ POS, kiosk và Customer App.',
    image: 'assets/features.png',
    badge: 'Kitchen',
    summary: 'Thiết bị hiển thị Kitchen App tại bếp hoặc bar để đội vận hành theo dõi món cần làm, món đã xong và ghi chú từ khách.',
    bestFor: 'Nhà hàng có bếp riêng, quầy bar, khu pha chế hoặc nhiều line chế biến.',
    highlights: ['Hiển thị ticket theo thời gian', 'Phân trạng thái đang làm và hoàn tất', 'Nhận đơn từ POS, QR và kiosk', 'Giảm bỏ sót món trong giờ đông'],
    metrics: [
      { value: 'Live', label: 'ticket cập nhật tức thì' },
      { value: 'Bếp/bar', label: 'phù hợp nhiều khu chế biến' },
      { value: 'PRO', label: 'đồng bộ Kitchen App' },
    ],
    modules: ['Kitchen App', 'Ticket Board', 'Order Status', 'Notes'],
    package: 'Tích hợp app',
  },
  {
    slug: 'receipt-printer',
    category: 'hardware',
    title: 'Máy in hóa đơn / bếp',
    text: 'Máy in hóa đơn và phiếu bếp kết nối với Staff POS để in giao dịch, món và ghi chú vận hành.',
    image: 'assets/pricing.png',
    badge: 'Printer',
    summary: 'Thiết bị in giúp cửa hàng xuất hóa đơn tại quầy hoặc in phiếu chế biến cho từng khu bếp.',
    bestFor: 'Mọi mô hình cần hóa đơn giấy, phiếu bếp hoặc chứng từ thanh toán tại quầy.',
    highlights: ['In hóa đơn sau thanh toán', 'In phiếu bếp theo món', 'Kết nối với Staff POS', 'Hỗ trợ luồng tiền mặt và chuyển khoản'],
    metrics: [
      { value: '80mm', label: 'khổ giấy phổ biến' },
      { value: 'Quầy/bếp', label: 'dùng ở nhiều vị trí' },
      { value: 'PLUS/PRO', label: 'tương thích cả hai gói' },
    ],
    modules: ['Receipt', 'Kitchen Ticket', 'Staff POS', 'Payment'],
    package: 'Tích hợp app',
  },
];

export const products = [...softwareProducts, ...hardwareProducts];

export const news = [
  {
    slug: 'ra-mat-bo-giai-phap-pos-nha-hang',
    date: '17/08/2026',
    category: 'Sản phẩm',
    readTime: '5 phút đọc',
    author: 'Precision POS Team',
    title: 'Ra mắt bộ giải pháp POS cho nhà hàng',
    text: 'Precision POS kết nối thu ngân, QR order, bếp, thanh toán và báo cáo trên một nền tảng.',
    image: 'assets/home.png',
    summary: 'Bộ giải pháp mới giúp nhà hàng vận hành liền mạch từ lúc khách gọi món đến khi bếp hoàn tất và quản lý xem báo cáo cuối ngày.',
    tags: ['POS', 'QR order', 'Kitchen App'],
    takeaways: ['Gom Staff POS, Customer App, Kitchen App và Portal trong cùng hệ sinh thái.', 'Đơn hàng đồng bộ theo thời gian thực giữa quầy, khách và bếp.', 'Phù hợp cho cửa hàng bắt đầu nhỏ rồi mở rộng bằng Store Slot.'],
    sections: [
      {
        heading: 'Một luồng vận hành thống nhất',
        body: 'Thay vì mỗi khu vực dùng một công cụ riêng, Precision POS gom dữ liệu đơn hàng, trạng thái thanh toán và ticket bếp vào cùng một nền tảng. Nhân viên quầy, khách tại bàn và đội bếp cùng nhìn thấy dữ liệu phù hợp với vai trò của mình.',
      },
      {
        heading: 'Thiết kế cho mô hình F&B thực tế',
        body: 'Nhà hàng có thể bắt đầu với PLUS cho bán tại quầy hoặc chọn PRO khi cần QR order, dining session và Kitchen App. Cách tách gói này giúp đội vận hành chọn đúng tính năng thay vì mua một bộ quá lớn ngay từ đầu.',
      },
      {
        heading: 'Sẵn sàng tích hợp phần cứng',
        body: 'Máy POS, kiosk đặt món, màn hình bếp và máy in hóa đơn đều được định hướng chạy cùng app. Khi triển khai tại điểm bán, thiết bị phần cứng trở thành một phần của workflow thay vì một lớp rời rạc.',
      },
    ],
  },
  {
    slug: 'toi-uu-van-hanh-da-chi-nhanh',
    date: '10/08/2026',
    category: 'Vận hành',
    readTime: '4 phút đọc',
    author: 'Operations Team',
    title: 'Tối ưu vận hành đa chi nhánh',
    text: 'Store Slot giúp cửa hàng bắt đầu nhỏ, sau đó mở rộng thêm chi nhánh khi cần.',
    image: 'assets/features.png',
    summary: 'Store Slot tách số lượng cửa hàng khỏi package phần mềm, giúp chủ cửa hàng mở rộng chi nhánh mà không phải đổi toàn bộ mô hình gói.',
    tags: ['Store Slot', 'Multi-store', 'Portal'],
    takeaways: ['Package quyết định bộ tính năng, Store Slot quyết định số cửa hàng.', 'Portal giữ vai trò trung tâm để quản lý sản phẩm, đơn và cấu hình.', 'Cách này giúp mô hình pricing dễ hiểu hơn khi mở rộng.'],
    sections: [
      {
        heading: 'Không cần tách quá nhiều gói',
        body: 'Thay vì tạo PLUS Single, PLUS Multi, PRO Single và PRO Multi, Precision POS giữ hai gói chính là PLUS và PRO. Khi khách mở thêm chi nhánh, hệ thống chỉ cần tăng Store Slot tương ứng.',
      },
      {
        heading: 'Dữ liệu tập trung cho chủ cửa hàng',
        body: 'Portal giúp chủ cửa hàng theo dõi doanh thu, sản phẩm và cấu hình theo từng điểm bán. Cách tổ chức này phù hợp với chuỗi nhỏ cần kiểm soát nhưng vẫn muốn triển khai nhanh.',
      },
      {
        heading: 'Dễ nâng cấp theo giai đoạn',
        body: 'Một cửa hàng có thể bắt đầu bằng PLUS, mở thêm Store Slot khi phát triển, rồi nâng lên PRO nếu cần QR order, bàn và bếp realtime. Đường nâng cấp giữ nguyên logic vận hành đã quen.',
      },
    ],
  },
  {
    slug: 'cai-thien-trai-nghiem-goi-mon-tai-ban',
    date: '01/08/2026',
    category: 'Trải nghiệm khách hàng',
    readTime: '6 phút đọc',
    author: 'Product Design Team',
    title: 'Cải thiện trải nghiệm gọi món tại bàn',
    text: 'Dining session và Kitchen App giúp đơn hàng đi từ khách đến bếp rõ ràng hơn.',
    image: 'assets/demo.png',
    summary: 'QR order không chỉ là menu online. Khi kết hợp dining session và Kitchen App, toàn bộ hành trình gọi món tại bàn trở nên rõ ràng hơn cho cả khách, nhân viên và bếp.',
    tags: ['Customer App', 'Dining Session', 'Kitchen'],
    takeaways: ['Khách có thể quét QR và tạo đơn theo bàn.', 'Dining session giúp gom món gọi thêm trong cùng một lượt phục vụ.', 'Kitchen App giảm tình trạng thất lạc order giữa phục vụ và bếp.'],
    sections: [
      {
        heading: 'Từ QR menu đến order thật',
        body: 'Một trải nghiệm gọi món tốt cần nhiều hơn danh sách món. Customer App phải hiểu bàn, session, ghi chú món và trạng thái đơn để khách biết yêu cầu của mình đã được ghi nhận.',
      },
      {
        heading: 'Bếp nhận ticket rõ ràng',
        body: 'Kitchen App hiển thị ticket theo trạng thái để bếp biết món nào mới vào, món nào đang làm và món nào đã xong. Điều này đặc biệt quan trọng khi khách gọi thêm nhiều lần trong cùng một bàn.',
      },
      {
        heading: 'Nhân viên phục vụ ít thao tác hơn',
        body: 'Khi khách tự tạo order, nhân viên có thể tập trung xác nhận, phục vụ và xử lý ngoại lệ. Luồng này giúp giảm áp lực ở giờ cao điểm mà vẫn giữ kiểm soát trên Staff POS.',
      },
    ],
  },
  {
    slug: 'kiosk-dat-mon-nhanh-cho-gio-cao-diem',
    date: '25/07/2026',
    category: 'Phần cứng',
    readTime: '5 phút đọc',
    author: 'Hardware Integration Team',
    title: 'Kiosk đặt món nhanh cho giờ cao điểm',
    text: 'Kiosk tự order giúp khách chọn món, gửi đơn vào POS và đẩy ticket xuống bếp mà không cần chờ quầy.',
    image: 'assets/solutions.png',
    summary: 'Với mô hình fast food, kiosk giúp giảm hàng chờ và biến thiết bị phần cứng thành một điểm vào trực tiếp của hệ thống POS.',
    tags: ['Kiosk', 'Self-order', 'Hardware'],
    takeaways: ['Kiosk phù hợp với fast food, food court và trà sữa đông khách.', 'Đơn từ kiosk có thể đồng bộ về Staff POS và Kitchen App.', 'Thiết bị cần được thiết kế theo luồng order nhanh, ít bước.'],
    sections: [
      {
        heading: 'Giảm tải cho quầy order',
        body: 'Trong giờ cao điểm, khách có thể tự chọn món, thêm topping và xác nhận đơn trên kiosk. Nhân viên quầy tập trung xử lý thanh toán, hỗ trợ khách và kiểm soát những đơn cần can thiệp.',
      },
      {
        heading: 'Kết nối với app hiện có',
        body: 'Kiosk không nên là hệ thống riêng. Khi tích hợp với Staff POS, Customer App và Kitchen App, mọi đơn hàng vẫn đi qua cùng pipeline dữ liệu và báo cáo.',
      },
      {
        heading: 'Thiết kế cho thao tác nhanh',
        body: 'Màn kiosk cần ưu tiên danh mục rõ, nút lớn, trạng thái giỏ hàng dễ thấy và xác nhận đơn mạch lạc. Mục tiêu là giúp khách hoàn tất order trong vài bước.',
      },
    ],
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
  { value: '2', label: 'gói dịch vụ chính: PLUS và PRO' },
  { value: '1+', label: 'cửa hàng, mở rộng bằng Store Slot' },
  { value: '4', label: 'module vận hành kết nối với nhau' },
  { value: '24/7', label: 'quy trình bán hàng và nhà hàng' },
];

export const features = [
  {
    number: '01',
    title: 'Portal quản lý',
    text: 'Quản lý sản phẩm, đơn hàng, doanh thu, cửa hàng và cấu hình vận hành.',
  },
  {
    number: '02',
    title: 'Staff POS',
    text: 'Tối ưu thao tác bán hàng tại quầy, thanh toán và in hóa đơn.',
  },
  {
    number: '03',
    title: 'Customer App',
    text: 'Khách quét QR, gọi món tại bàn và giảm tải cho nhân viên phục vụ.',
  },
  {
    number: '04',
    title: 'Kitchen App',
    text: 'Đơn hàng route realtime tới bếp/bar để theo dõi trạng thái chuẩn bị.',
    tone: 'dark',
  },
];

export const solutions = [
  {
    title: 'PLUS cho cafe và cửa hàng',
    text: 'Portal + Staff POS cho mô hình bán tại quầy, cần triển khai nhanh và dễ quản lý.',
  },
  {
    title: 'PRO cho nhà hàng',
    text: 'Thêm Customer App, Kitchen App, bàn và dining session cho quy trình phục vụ đầy đủ.',
  },
  {
    title: 'Store Slot cho chuỗi',
    text: 'Không cần tách PLUS Multi hay PRO Multi. Chỉ cần thêm số cửa hàng khi mở rộng.',
  },
];

export const workflowSteps = [
  {
    title: 'Khách chọn PLUS hoặc PRO',
    text: 'Package quyết định bộ tính năng phù hợp với mô hình vận hành.',
  },
  {
    title: 'Chọn số cửa hàng',
    text: 'Bắt đầu với 1 cửa hàng, sau đó thêm Store Slot khi mở chi nhánh.',
  },
  {
    title: 'Gửi yêu cầu',
    text: 'Marketing ghi nhận thông tin doanh nghiệp, gói cần dùng và số cửa hàng.',
  },
  {
    title: 'Admin duyệt và khởi tạo',
    text: 'POS-Admin tạo tenant, set package, maxStores và owner account cho khách.',
  },
];

export const plans = [
  {
    name: 'PLUS',
    description: 'Dành cho cửa hàng, cafe và mô hình bán tại quầy.',
    price: '290k',
    suffix: ' VND/mo',
    cta: 'Đăng ký PLUS',
    href: '#trial',
    includedStores: 1,
    features: ['Portal quản lý', 'Staff POS', 'In hóa đơn', 'Báo cáo doanh thu cơ bản'],
  },
  {
    name: 'PRO',
    description: 'Dành cho nhà hàng cần QR order, bếp và table workflow.',
    price: '1.9m',
    suffix: ' VND/mo',
    cta: 'Đăng ký PRO',
    href: '#trial',
    recommended: true,
    includedStores: 1,
    features: ['Tất cả tính năng PLUS', 'Customer App', 'Kitchen App', 'Table/Dining session', 'Realtime order sync'],
  },
];

export const storeSlotHighlights = [
  'Mỗi gói bao gồm 1 cửa hàng mặc định.',
  'Có thể thêm Store Slot khi mở chi nhánh mới.',
  'Package quyết định bộ tính năng, số cửa hàng quyết định maxStores.',
];

export const featureComparison = [
  { feature: 'Thời gian sử dụng', trial: '7 ngày', plus: 'Theo tháng', pro: 'Theo tháng' },
  { feature: 'Portal quản lý', trial: true, plus: true, pro: true },
  { feature: 'Staff POS', trial: true, plus: true, pro: true },
  { feature: 'In hóa đơn', trial: 'Demo', plus: true, pro: true },
  { feature: 'Customer App / QR order', trial: false, plus: false, pro: true },
  { feature: 'Kitchen App', trial: false, plus: false, pro: true },
  { feature: 'Table workflow', trial: false, plus: false, pro: true },
  { feature: 'Dining session', trial: false, plus: false, pro: true },
  { feature: 'Tích hợp phần cứng', trial: 'Demo', plus: true, pro: true },
  { feature: 'Mở rộng nhiều cửa hàng', trial: false, plus: true, pro: true },
];

export const faqs = [
  {
    question: 'PLUS và PRO khác nhau ở đâu?',
    answer: 'PLUS tập trung vào Portal và Staff POS. PRO thêm Customer App, Kitchen App, bàn và dining session cho nhà hàng full-service.',
  },
  {
    question: 'Single/Multi có còn là gói riêng không?',
    answer: 'Không. Gói PLUS/PRO quyết định tính năng, còn số lượng cửa hàng được mở rộng bằng Store Slot.',
  },
  {
    question: 'Khách có cần tài khoản trước khi đăng ký không?',
    answer: 'Không cần. Khách gửi thông tin trước, Admin duyệt rồi tạo tenant và owner account sau.',
  },
];
