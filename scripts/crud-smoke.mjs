/*
  Tech Store API CRUD Smoke Test
  Usage (PowerShell):
    # Optional: login
    # $env:EMAIL="admin@example.com"; $env:PASSWORD="yourpassword"
    $env:BASE_URL="http://localhost:5032"; $env:TOKEN=""; npm run smoke:crud
*/

const BASE_URL = process.env.BASE_URL || 'http://localhost:5032';
let TOKEN = process.env.TOKEN || '';
const CATEGORY_ID = Number(process.env.CATEGORY_ID || '1');

const json = (obj) => JSON.stringify(obj, null, 2);

async function http(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { ok: res.ok, status: res.status, statusText: res.statusText, data };
}

function logStep(title) {
  console.log(`\n=== ${title} ===`);
}

function assertOk(label, res) {
  if (res.ok) {
    console.log(`PASS ${label} [${res.status}]`);
  } else {
    console.error(`FAIL ${label} [${res.status} ${res.statusText}] ->`, typeof res.data === 'string' ? res.data : json(res.data));
  }
}

async function tryLogin() {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  if (!TOKEN && email && password) {
    logStep('Auth: Login');
    const res = await http('POST', '/api/auth/login', { email, password });
    assertOk('login', res);
    if (res.ok && res.data && res.data.token) {
      TOKEN = res.data.token;
      console.log('Received token.');
    }
  }
}

(async () => {
  console.log(`Base URL: ${BASE_URL}`);
  await tryLogin();

  // 1) List products (sanity check)
  logStep('GET /api/Product');
  let res = await http('GET', '/api/Product?pageNumber=1&pageSize=1&sortBy=name&sortOrder=asc');
  assertOk('list', res);
  if (!res.ok) process.exit(1);

  // 2) Create product
  const createBody = {
    name: 'CRUD Smoke Test Product',
    price: 1234500,
    originalPrice: 1500000,
    imageUrl: 'https://example.com/images/smoke-test.jpg',
    brand: 'SmokeBrand',
    description: 'Created by automated smoke test.',
    specifications: { key: 'value' },
    stockQuantity: 5,
    rating: 4.2,
    reviewCount: 0,
    isNew: true,
    isBestSeller: false,
    categoryId: CATEGORY_ID,
  };
  logStep('POST /api/Product (create)');
  res = await http('POST', '/api/Product', createBody);
  assertOk('create', res);
  if (!res.ok) process.exit(1);
  const created = res.data?.data || res.data; // envelope support
  const createdId = created.productId || created.id;
  console.log('Created ID:', createdId);

  // 3) Update product
  const updateBody = { name: 'CRUD Smoke Test Product (Updated)', price: 1333300, stockQuantity: 7 };
  logStep('PUT /api/Product/{id} (update)');
  res = await http('PUT', `/api/Product/${createdId}`, updateBody);
  assertOk('update', res);
  if (!res.ok) process.exit(1);

  // 4) Delete product
  logStep('DELETE /api/Product/{id} (delete)');
  res = await http('DELETE', `/api/Product/${createdId}`);
  assertOk('delete', res);
  if (!res.ok) process.exit(1);

  console.log('\nCRUD Smoke Test completed.');
})();
