/**
 * Extended demo menu seed.
 *
 * The Electron app reads products from /api/product/menu, so product images
 * and demo menu growth belong in the Product service database seed.
 */

const STORE_ID = 1;

const CATEGORIES = [
  { name: '\u0110\u1ED3 \u0103n', sortOrder: 1 },
  { name: '\u0110\u1ED3 u\u1ED1ng', sortOrder: 2 },
  { name: 'Combo', sortOrder: 3 },
];

const PRODUCTS = [
  {
    categoryName: '\u0110\u1ED3 \u0103n',
    name: 'B\u00FAn ri\u00EAu',
    price: 35000,
    sortOrder: 1,
    description: 'T\u00F4 b\u00FAn ri\u00EAu n\u00F3ng v\u1EDBi ri\u00EAu cua, \u0111\u1EADu ph\u1EE5 v\u00E0 rau th\u01A1m.',
    image: menuImage('B\u00FAn ri\u00EAu', '#fff7ed', '#ea580c', 'bowl'),
  },
  {
    categoryName: '\u0110\u1ED3 \u0103n',
    name: 'B\u00FAn b\u00F2',
    price: 37000,
    sortOrder: 2,
    description: 'B\u00FAn b\u00F2 cay nh\u1EB9, n\u01B0\u1EDBc d\u00F9ng \u0111\u1EADm \u0111\u00E0.',
    image: menuImage('B\u00FAn b\u00F2', '#fef2f2', '#dc2626', 'bowl'),
  },
  {
    categoryName: '\u0110\u1ED3 \u0103n',
    name: 'B\u00FAn b\u00F2 \u0111\u1EB7c bi\u1EC7t',
    price: 50000,
    sortOrder: 3,
    description: 'Ph\u1EA7n \u0111\u1EB7c bi\u1EC7t th\u00EAm th\u1ECBt, gi\u00F2 v\u00E0 topping.',
    image: menuImage('B\u00FAn b\u00F2 \u0110B', '#fff1f2', '#be123c', 'bowl'),
  },
  {
    categoryName: '\u0110\u1ED3 \u0103n',
    name: 'Ph\u1EDF t\u00E1i',
    price: 45000,
    sortOrder: 4,
    description: 'Ph\u1EDF t\u00E1i b\u00F2 m\u1ECFng, n\u01B0\u1EDBc d\u00F9ng trong.',
    image: menuImage('Ph\u1EDF t\u00E1i', '#ecfdf5', '#16a34a', 'bowl'),
  },
  {
    categoryName: '\u0110\u1ED3 \u0103n',
    name: 'C\u01A1m g\u00E0 x\u1ED1i m\u1EE1',
    price: 42000,
    sortOrder: 5,
    description: 'C\u01A1m g\u00E0 gi\u00F2n da, \u0103n k\u00E8m d\u01B0a leo v\u00E0 n\u01B0\u1EDBc m\u1EAFm.',
    image: menuImage('C\u01A1m g\u00E0', '#fefce8', '#ca8a04', 'plate'),
  },
  {
    categoryName: '\u0110\u1ED3 \u0103n',
    name: 'M\u00EC x\u00E0o b\u00F2',
    price: 39000,
    sortOrder: 6,
    description: 'M\u00EC x\u00E0o b\u00F2 v\u00E0 rau c\u1EA3i, ph\u1EE5c v\u1EE5 n\u00F3ng.',
    image: menuImage('M\u00EC x\u00E0o', '#f5f3ff', '#7c3aed', 'plate'),
  },
  {
    categoryName: '\u0110\u1ED3 \u0103n',
    name: 'B\u00E1nh m\u00EC th\u1ECBt',
    price: 25000,
    sortOrder: 7,
    description: 'B\u00E1nh m\u00EC th\u1ECBt, pate, rau chua v\u00E0 s\u1ED1t.',
    image: menuImage('B\u00E1nh m\u00EC', '#fffbeb', '#d97706', 'sandwich'),
  },
  {
    categoryName: '\u0110\u1ED3 \u0103n',
    name: 'G\u1ECFi cu\u1ED1n',
    price: 30000,
    sortOrder: 8,
    description: 'G\u1ECFi cu\u1ED1n t\u00F4m th\u1ECBt v\u1EDBi rau t\u01B0\u01A1i.',
    image: menuImage('G\u1ECFi cu\u1ED1n', '#f0fdf4', '#059669', 'plate'),
  },
  {
    categoryName: '\u0110\u1ED3 u\u1ED1ng',
    name: 'Tr\u00E0 \u0111\u00E1',
    price: 5000,
    sortOrder: 1,
    description: 'Tr\u00E0 \u0111\u00E1 m\u00E1t, ph\u1EE5c v\u1EE5 nhanh.',
    image: menuImage('Tr\u00E0 \u0111\u00E1', '#eff6ff', '#2563eb', 'glass'),
  },
  {
    categoryName: '\u0110\u1ED3 u\u1ED1ng',
    name: 'N\u01B0\u1EDBc m\u00EDa',
    price: 15000,
    sortOrder: 2,
    description: 'N\u01B0\u1EDBc m\u00EDa t\u01B0\u01A1i, th\u00EAm \u0111\u00E1.',
    image: menuImage('N\u01B0\u1EDBc m\u00EDa', '#fefce8', '#65a30d', 'glass'),
  },
  {
    categoryName: '\u0110\u1ED3 u\u1ED1ng',
    name: 'C\u00E0 ph\u00EA s\u1EEFa',
    price: 20000,
    sortOrder: 3,
    description: 'C\u00E0 ph\u00EA s\u1EEFa \u0111\u00E1 \u0111\u1EADm v\u1ECB.',
    image: menuImage('C\u00E0 ph\u00EA', '#f5f5f4', '#92400e', 'cup'),
  },
  {
    categoryName: '\u0110\u1ED3 u\u1ED1ng',
    name: 'Tr\u00E0 t\u1EAFc',
    price: 18000,
    sortOrder: 4,
    description: 'Tr\u00E0 t\u1EAFc chua ng\u1ECDt, gi\u1EA3i kh\u00E1t.',
    image: menuImage('Tr\u00E0 t\u1EAFc', '#f0fdfa', '#0d9488', 'glass'),
  },
  {
    categoryName: '\u0110\u1ED3 u\u1ED1ng',
    name: 'S\u1EEFa \u0111\u1EADu n\u00E0nh',
    price: 12000,
    sortOrder: 5,
    description: 'S\u1EEFa \u0111\u1EADu n\u00E0nh m\u00E1t, v\u1ECB thanh.',
    image: menuImage('S\u1EEFa \u0111\u1EADu', '#fafaf9', '#78716c', 'glass'),
  },
  {
    categoryName: '\u0110\u1ED3 u\u1ED1ng',
    name: 'N\u01B0\u1EDBc su\u1ED1i',
    price: 10000,
    sortOrder: 6,
    description: 'N\u01B0\u1EDBc su\u1ED1i \u0111\u00F3ng chai.',
    image: menuImage('N\u01B0\u1EDBc su\u1ED1i', '#f0f9ff', '#0284c7', 'bottle'),
  },
  {
    categoryName: '\u0110\u1ED3 u\u1ED1ng',
    name: 'Cam \u00E9p',
    price: 25000,
    sortOrder: 7,
    description: 'Cam \u00E9p t\u01B0\u01A1i, kh\u00F4ng ga.',
    image: menuImage('Cam \u00E9p', '#fff7ed', '#f97316', 'glass'),
  },
  {
    categoryName: 'Combo',
    name: 'Combo b\u00FAn ri\u00EAu + tr\u00E0 \u0111\u00E1',
    price: 39000,
    sortOrder: 1,
    description: 'Combo nhanh cho b\u1EEFa tr\u01B0a: b\u00FAn ri\u00EAu v\u00E0 tr\u00E0 \u0111\u00E1.',
    image: menuImage('Combo 1', '#eef2ff', '#4f46e5', 'combo'),
  },
  {
    categoryName: 'Combo',
    name: 'Combo c\u01A1m g\u00E0 + tr\u00E0 t\u1EAFc',
    price: 56000,
    sortOrder: 2,
    description: 'C\u01A1m g\u00E0 k\u00E8m tr\u00E0 t\u1EAFc m\u00E1t.',
    image: menuImage('Combo 2', '#fef3c7', '#b45309', 'combo'),
  },
];

function ensureEnhancedDemoMenu(db) {
  if (!db) return;

  let changed = 0;
  const categoryIds = {};

  CATEGORIES.forEach(category => {
    const result = ensureCategory(db, STORE_ID, category);
    categoryIds[category.name] = result.id;
    if (result.created) changed += 1;
  });

  PRODUCTS.forEach(product => {
    const status = ensureProduct(db, STORE_ID, {
      ...product,
      categoryId: categoryIds[product.categoryName],
    });
    if (status) changed += 1;
  });

  if (changed > 0) {
    console.log(`[Product] Enhanced demo menu updated (${changed} category/product changes)`);
  }
}

function ensureCategory(db, storeId, category) {
  const existing = db.exec(
    'SELECT id FROM categories WHERE store_id = ? AND name = ? LIMIT 1',
    [storeId, category.name]
  );

  if (existing.length && existing[0].values.length) {
    return { id: existing[0].values[0][0], created: false };
  }

  db.run(
    'INSERT INTO categories (store_id, name, sort_order) VALUES (?, ?, ?)',
    [storeId, category.name, category.sortOrder]
  );
  const idResult = db.exec('SELECT last_insert_rowid()');
  return { id: idResult[0].values[0][0], created: true };
}

function ensureProduct(db, storeId, product) {
  const existing = db.exec(
    'SELECT id, image, description FROM products WHERE store_id = ? AND name = ? LIMIT 1',
    [storeId, product.name]
  );

  if (!existing.length || !existing[0].values.length) {
    db.run(
      `INSERT INTO products
        (store_id, category_id, name, price, image, description, sort_order, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        storeId,
        product.categoryId,
        product.name,
        product.price,
        product.image,
        product.description,
        product.sortOrder,
      ]
    );
    return 'created';
  }

  const [id, image, description] = existing[0].values[0];
  const updates = [];
  const params = [];

  if (!image) {
    updates.push('image = ?');
    params.push(product.image);
  }
  if (!description) {
    updates.push('description = ?');
    params.push(product.description);
  }

  if (!updates.length) return null;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id, storeId);
  db.run(`UPDATE products SET ${updates.join(', ')} WHERE id = ? AND store_id = ?`, params);
  return 'updated';
}

function menuImage(label, background, accent, kind) {
  const shapes = {
    bowl: `<ellipse cx="120" cy="106" rx="58" ry="18" fill="${accent}" opacity=".18"/>
      <path d="M63 88h114c-5 34-25 51-57 51S68 122 63 88Z" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <path d="M78 87c13-17 70-17 84 0" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="98" cy="101" r="7" fill="${accent}" opacity=".85"/>
      <circle cx="124" cy="99" r="6" fill="#facc15"/>
      <circle cx="145" cy="103" r="7" fill="#22c55e"/>`,
    plate: `<circle cx="120" cy="102" r="49" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <circle cx="120" cy="102" r="30" fill="${accent}" opacity=".16"/>
      <path d="M92 109c18-22 40-22 58 0" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="104" cy="92" r="7" fill="#f97316"/>
      <circle cx="129" cy="88" r="7" fill="#22c55e"/>
      <circle cx="139" cy="111" r="7" fill="#ef4444"/>`,
    sandwich: `<path d="M65 105c26-41 83-41 110 0H65Z" fill="#fde68a" stroke="${accent}" stroke-width="5"/>
      <path d="M75 108h90v22H75z" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <path d="M82 113c20 13 44-14 70 0" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/>`,
    glass: `<path d="M88 63h64l-9 83H97L88 63Z" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <path d="M94 91h52l-5 47H99l-5-47Z" fill="${accent}" opacity=".22"/>
      <circle cx="108" cy="81" r="5" fill="${accent}" opacity=".75"/>
      <circle cx="131" cy="113" r="6" fill="${accent}" opacity=".55"/>`,
    cup: `<path d="M77 80h76v52c0 12-10 22-22 22H99c-12 0-22-10-22-22V80Z" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <path d="M153 95h12c10 0 15 7 13 16-2 11-10 16-25 16" fill="none" stroke="${accent}" stroke-width="5"/>
      <path d="M91 97h48" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity=".7"/>`,
    bottle: `<path d="M106 55h28v23l13 19v54c0 8-7 15-15 15h-24c-8 0-15-7-15-15V97l13-19V55Z" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <path d="M100 112h40v28h-40z" fill="${accent}" opacity=".2"/>
      <path d="M108 55h24" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
    combo: `<circle cx="94" cy="100" r="34" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <path d="M75 102c12-14 27-14 39 0" stroke="${accent}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M139 70h38l-6 77h-26l-6-77Z" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <path d="M144 98h28l-4 41h-20l-4-41Z" fill="${accent}" opacity=".2"/>`,
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180">
    <rect width="240" height="180" rx="26" fill="${background}"/>
    <circle cx="202" cy="35" r="24" fill="${accent}" opacity=".12"/>
    <circle cx="40" cy="150" r="31" fill="${accent}" opacity=".1"/>
    ${shapes[kind] || shapes.plate}
    <rect x="28" y="144" width="184" height="24" rx="12" fill="#ffffff" opacity=".82"/>
    <text x="120" y="161" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#111827">${escapeSvg(label)}</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { ensureEnhancedDemoMenu };
