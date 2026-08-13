export const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#workflow', label: 'How it works' },
  { href: '#demo', label: 'Demo' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#contact', label: 'Contact' },
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
