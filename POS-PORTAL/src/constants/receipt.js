export const RECEIPT_BLOCKS = {
  LOGO: 'logo',
  HEADER: 'header',
  STORE_INFO: 'storeInfo',
  DIVIDER: 'divider',
  ORDER_INFO: 'orderInfo',
  ITEMS: 'items',
  TOTAL: 'total',
  PAYMENT: 'payment',
  QR: 'qr',
  FOOTER: 'footer',
};

export const RECEIPT_PRESETS = [
  {
    id: 'minimal',
    name: 'Tối giản',
    blocks: [
      RECEIPT_BLOCKS.HEADER,
      RECEIPT_BLOCKS.DIVIDER,
      RECEIPT_BLOCKS.ITEMS,
      RECEIPT_BLOCKS.TOTAL,
      RECEIPT_BLOCKS.FOOTER,
    ],
  },
  {
    id: 'standard',
    name: 'Tiêu chuẩn',
    blocks: [
      RECEIPT_BLOCKS.HEADER,
      RECEIPT_BLOCKS.STORE_INFO,
      RECEIPT_BLOCKS.DIVIDER,
      RECEIPT_BLOCKS.ORDER_INFO,
      RECEIPT_BLOCKS.DIVIDER,
      RECEIPT_BLOCKS.ITEMS,
      RECEIPT_BLOCKS.TOTAL,
      RECEIPT_BLOCKS.QR,
      RECEIPT_BLOCKS.FOOTER,
    ],
  },
  {
    id: 'full',
    name: 'Chuyên nghiệp',
    blocks: [
      RECEIPT_BLOCKS.LOGO,
      RECEIPT_BLOCKS.HEADER,
      RECEIPT_BLOCKS.STORE_INFO,
      RECEIPT_BLOCKS.DIVIDER,
      RECEIPT_BLOCKS.ORDER_INFO,
      RECEIPT_BLOCKS.DIVIDER,
      RECEIPT_BLOCKS.ITEMS,
      RECEIPT_BLOCKS.TOTAL,
      RECEIPT_BLOCKS.PAYMENT,
      RECEIPT_BLOCKS.DIVIDER,
      RECEIPT_BLOCKS.QR,
      RECEIPT_BLOCKS.FOOTER,
    ],
  },
];

export function getReceiptFlagsFromBlocks(blocks) {
  return {
    showLogo: blocks.includes(RECEIPT_BLOCKS.LOGO),
    showQR: blocks.includes(RECEIPT_BLOCKS.QR),
    showStoreInfo: blocks.includes(RECEIPT_BLOCKS.STORE_INFO),
    showTime: blocks.includes(RECEIPT_BLOCKS.ORDER_INFO),
    showTxnId: blocks.includes(RECEIPT_BLOCKS.ORDER_INFO),
  };
}
