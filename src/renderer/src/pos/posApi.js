// posApi.js
// Centralized IPC calling layer for the POS screen.
// Every window.api.* call the POS screen needs lives here — usePosHooks.js
// imports from this file only, it never calls window.api directly.
// This keeps all "fetching" logic (products, services, brands, categories,
// suppliers, stores/warehouses, customers, warranty types, sale creation)
// in one auditable place.

// ── Normalizes a variety of controller response shapes into { success, data, error } ──
const unwrap = (res, key) => {
  if (!res) return [];
  if (!res.success) return [];
  return res[key] ?? res.data ?? [];
};

// ── PRODUCTS ──
// storeId is optional — pass it to scope to a single warehouse/store via
// product:getByStore, otherwise falls back to product:getAll and lets the
// caller filter client-side (this is what usePosHooks currently does).
export const fetchProducts = async ({ storeId } = {}) => {
  try {
    const res = storeId
      ? await window.api.product.getByStore(storeId)
      : await window.api.product.getAll();

    return {
      success: !!res?.success,
      data: unwrap(res, 'products'),
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.fetchProducts error:', err);
    return { success: false, data: [], error: 'Failed to load products' };
  }
};

// ── SERVICES ──
// Services have no store relationship (no store-gating on service CRUD),
// so — unlike fetchProducts — there's no storeId-scoped variant. Fetched
// unscoped via service:getAll and filtered client-side by search/category,
// same pattern as products.
export const fetchServices = async () => {
  try {
    const res = await window.api.service.getAll();
    return {
      success: !!res?.success,
      data: unwrap(res, 'services'),
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.fetchServices error:', err);
    return { success: false, data: [], error: 'Failed to load services' };
  }
};

// ── BRANDS ──
export const fetchBrands = async () => {
  try {
    const res = await window.api.brand.getAll();
    return {
      success: !!res?.success,
      data: unwrap(res, 'brands'),
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.fetchBrands error:', err);
    return { success: false, data: [], error: 'Failed to load brands' };
  }
};

// ── CATEGORIES ──
export const fetchCategories = async () => {
  try {
    const res = await window.api.category.getAll();
    return {
      success: !!res?.success,
      data: unwrap(res, 'categories'),
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.fetchCategories error:', err);
    return { success: false, data: [], error: 'Failed to load categories' };
  }
};

// ── SUPPLIERS ──
export const fetchSuppliers = async () => {
  try {
    const res = await window.api.supplier.getAll();
    return {
      success: !!res?.success,
      data: unwrap(res, 'suppliers'),
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.fetchSuppliers error:', err);
    return { success: false, data: [], error: 'Failed to load suppliers' };
  }
};

// ── STORES / WAREHOUSES ──
// Per project convention: response shape is storeRes.stores || storeRes.data
export const fetchStores = async () => {
  try {
    const res = await window.api.store.getAll();
    return {
      success: !!res?.success,
      data: res?.stores ?? res?.data ?? [],
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.fetchStores error:', err);
    return { success: false, data: [], error: 'Failed to load stores' };
  }
};

// ── CUSTOMERS ──
// NOTE: customersController only exposes getAll/getById/create/update/delete —
// there's no server-side search handler, so customer search is done
// client-side in usePosHooks against the full list fetched here.
export const fetchCustomers = async () => {
  try {
    const res = await window.api.customer.getAll();
    return {
      success: !!res?.success,
      data: unwrap(res, 'customers'),
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.fetchCustomers error:', err);
    return { success: false, data: [], error: 'Failed to load customers' };
  }
};

export const createCustomer = async (data) => {
  try {
    const res = await window.api.customer.create(data);
    return {
      success: !!res?.success,
      customer: res?.customer || null,
      message: res?.message || null,
      fieldErrors: res?.fieldErrors || null,
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.createCustomer error:', err);
    return { success: false, customer: null, fieldErrors: null, error: 'Failed to create customer' };
  }
};

// ── WARRANTY TYPES ──
// Backed by warrantyController.js / registerWarrantyTypeIpc — channel names
// are warrantyType:create / getAll / getById / update / delete.
export const fetchWarrantyTypes = async () => {
  try {
    const res = await window.api.warrantyType.getAll();
    return {
      success: !!res?.success,
      data: unwrap(res, 'warrantyTypes'),
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.fetchWarrantyTypes error:', err);
    return { success: false, data: [], error: 'Failed to load warranty types' };
  }
};

// ── SALES ──
// Backed by saleController.js (handleCreateSale) / registerSaleIpc.
// IMPORTANT: the preload bridge exposes window.api.sale.create — NOT
// window.api.sale.handleCreateSale (that's the controller's internal
// function name, not the IPC channel method exposed to the renderer).
// `data` here must be the Sale-model-shaped `payload` from
// buildSalePayload()/createSale() in saleCalculations.js — never the
// `{ payload, totals }` wrapper, and never anything with a `totals` or
// `_totals` key attached.
export const createSale = async (data) => {
  try {
    const res = await window.api.sale.create(data);
    return {
      success: !!res?.success,
      sale: res?.sale || null,
      receipt: res?.receipt || null,
      message: res?.message || null,
      fieldErrors: res?.fieldErrors || null,
      error: res?.error || null,
    };
  } catch (err) {
    console.error('posApi.createSale error:', err);
    return { success: false, sale: null, receipt: null, fieldErrors: null, error: 'Failed to create sale' };
  }
};

// ── DROPDOWN OPTION MAPPERS ──
// ProductPannel's <select> filters expect { value, label } pairs.
// Source docs use different display-name fields per module (brandName,
// categoryName, name, etc.) — normalize them all here in one spot.
export const toBrandOptions = (brands = []) =>
  brands.map((b) => ({ value: String(b._id), label: b.brandName ?? b.name ?? 'Unnamed brand' }));

export const toCategoryOptions = (categories = []) =>
  categories.map((c) => ({ value: String(c._id), label: c.categoryName ?? c.name ?? 'Unnamed category' }));

export const toSupplierOptions = (suppliers = []) =>
  suppliers.map((s) => ({ value: String(s._id), label: s.name ?? 'Unnamed supplier' }));

export const toStoreOptions = (stores = []) =>
  stores.map((s) => ({ value: String(s._id), label: s.name ?? 'Unnamed store' }));

export const mapProductForGrid = (product) => {
  if (!product) return null;

  const variations = product.variations || [];
  let price = 0;
  let qty = 0;

  variations.forEach((v) => {
    if (product.batch_tracking) {
      (v.batches || []).forEach((b) => {
        qty += Number(b.stock) || 0;
        if (!price && b.price) price = b.price;
      });
    } else {
      qty += Number(v.stock) || 0;
      if (!price && v.price) price = v.price;
    }
  });

  return {
    _id: product._id,
    name: product.name,
    code: product.code,
    price,
    qty,
    stock_qty: qty,
    unit_symbol: product.unit_id?.symbol || null,
    image_url: product.image || null,
    store_id: product.store_id?._id ? String(product.store_id._id) : null,
    brand_id: product.brand_id?._id ? String(product.brand_id._id) : null,
    category_id: product.category_id?._id ? String(product.category_id._id) : null,
    supplier_id: product.supplier_id?._id ? String(product.supplier_id._id) : null,
    _raw: product,
  };
};

// Maps a raw Service doc (see serviceModel.js) into the shape ProductPannel's
// grid cards expect. Mirrors mapProductForGrid, but there's no stock/qty
// concept for a service, and `category` may or may not come back populated
// depending on what the service:getAll controller does — handle both a
// populated object and a bare ObjectId string.
export const mapServiceForGrid = (service) => {
  if (!service) return null;

  const categoryId =
    service.category && typeof service.category === 'object'
      ? String(service.category._id)
      : service.category
        ? String(service.category)
        : null;

  return {
    _id: service._id,
    name: service.service_name,
    code: service.service_code,
    price: service.price || 0,
    cost: service.cost || 0,
    category_id: categoryId,
    status: service.status,
    description: service.description || '',
    _raw: service,
  };
};
