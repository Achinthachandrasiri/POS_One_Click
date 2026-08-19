// usePosHooks.js

import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProducts, fetchServices, fetchBrands, fetchCategories, fetchSuppliers, fetchStores, fetchCustomers, createCustomer,
  fetchWarrantyTypes, toBrandOptions, toCategoryOptions, toSupplierOptions, toStoreOptions, mapProductForGrid, mapServiceForGrid,
  createSale as persistSale,
} from "./posApi";
import {
  buildSalePayload,
  buildSaleLineItems,
  calculateOrderTotals,
  calculatePaymentSummary,
  clampNonNegative,
} from "./saleCalculations";
// NOTE: posApi's createSale (aliased persistSale here) is the IPC call that
// actually saves the sale via window.api.sale.create(). saleCalculations.js
// also used to export a same-named createSale() that just computed the
// payload/totals and console.logged them — that's now inlined below via
// buildSalePayload() directly, to avoid the naming collision and because
// "compute" and "persist" are genuinely two different steps now that IPC
// is wired up.

const usePosHooks = (session) => {
  const navigate = useNavigate();

  // ---------- Header ----------
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [heldBills, setHeldBills] = useState([]); // TODO: load from local/IPC hold-bill store
  const [closingSession, setClosingSession] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const onSaleReturnClick = useCallback(() => {
    // TODO: toggle POS into "sale return" mode (search existing invoice, select items to return)
  }, []);

  const onCalculatorClick = useCallback(() => {
    setIsCalculatorOpen(true);
  }, []);

  const onCloseCalculator = useCallback(() => {
    setIsCalculatorOpen(false);
  }, []);

  const onClosePosClick = useCallback(async () => {
    // TODO: this should open a closing-summary modal first (counted cash,
    // totals by payment type, discrepancy) before actually calling close.
    if (!session?._id) return;
    setClosingSession(true);
    try {
      const result = await window.api.cashSession.close({
        session_id: session._id,
        // TODO: pass closing summary fields once the Sales module can compute them
      });
      if (result.success) {
        navigate('/dashboard', { replace: true });
      }
      // TODO: surface result.error to the cashier via a toast/inline message
    } finally {
      setClosingSession(false);
    }
  }, [session, navigate]);

  const onHeldBillsClick = useCallback(() => {
    // TODO: open HeldBillsModal listing heldBills
  }, []);

  // ---------- Product panel: catalog tab (Products / Services) ----------
  const [catalogTab, setCatalogTab] = useState('products'); // 'products' | 'services'

  const onCatalogTabChange = useCallback((tab) => {
    setCatalogTab(tab === 'services' ? 'services' : 'products');
  }, []);

  // ---------- Product panel: filter option lists ----------
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(null);

  // ---------- Product panel: products ----------
  const [rawProducts, setRawProducts] = useState([]); // full serialized docs from posApi
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ---------- Product panel: services ----------
  const [rawServices, setRawServices] = useState([]); // full serialized docs from posApi
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);

  const [activeFilters, setActiveFilters] = useState({
    warehouse: session?.store_id ? String(session.store_id) : null, // POS defaults to the store this session was opened for
    brand: null,
    category: null,
    supplier: null,
  });

  // Fetch filter option lists once on mount.
  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const [brandsRes, categoriesRes, suppliersRes, storesRes] = await Promise.all([
          fetchBrands(),
          fetchCategories(),
          fetchSuppliers(),
          fetchStores(),
        ]);

        if (cancelled) return;

        if (brandsRes.success) setBrands(brandsRes.data);
        if (categoriesRes.success) setCategories(categoriesRes.data);
        if (suppliersRes.success) setSuppliers(suppliersRes.data);
        if (storesRes.success) setStores(storesRes.data);

        const firstError = [brandsRes, categoriesRes, suppliersRes, storesRes].find((r) => !r.success);
        if (firstError) setOptionsError(firstError.error);
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch products once on mount. Fetched unscoped (getAll) — warehouse
  // filtering happens client-side alongside brand/category/supplier so all
  // four filters behave consistently. Switch to fetchProducts({ storeId })
  // later if the catalog grows too large to load in full.
  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      const res = await fetchProducts();
      if (cancelled) return;
      if (res.success) {
        setRawProducts(res.data);
      } else {
        setProductsError(res.error);
      }
      setProductsLoading(false);
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch services once on mount, alongside products — both load
  // unconditionally regardless of which tab is active, so switching tabs
  // never shows a fresh loading spinner.
  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      setServicesLoading(true);
      setServicesError(null);
      const res = await fetchServices();
      if (cancelled) return;
      if (res.success) {
        setRawServices(res.data);
      } else {
        setServicesError(res.error);
      }
      setServicesLoading(false);
    };

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  const warehouseOptions = useMemo(() => toStoreOptions(stores), [stores]);
  const brandOptions = useMemo(() => toBrandOptions(brands), [brands]);
  const categoryOptions = useMemo(() => toCategoryOptions(categories), [categories]);
  const supplierOptions = useMemo(() => toSupplierOptions(suppliers), [suppliers]);

  const products = useMemo(() => rawProducts.map(mapProductForGrid).filter(Boolean), [rawProducts]);
  const services = useMemo(() => rawServices.map(mapServiceForGrid).filter(Boolean), [rawServices]);

  // Lookup back to the full, un-mapped product doc by _id. ProductPannel only
  // ever hands onProductClick the grid-mapped product (see `products` above),
  // which may not carry `structure` / `batch_tracking` / `variations` depending
  // on what mapProductForGrid keeps — so onProductClick resolves the raw doc
  // here rather than assuming those fields survived the mapping.
  const rawProductsById = useMemo(() => {
    const map = new Map();
    rawProducts.forEach((p) => map.set(String(p._id), p));
    return map;
  }, [rawProducts]);

  // Barcode-scanner lookup: maps a product's `code` to its raw product doc.
  // Confirmed: the barcode printed/scanned is the product code field, so
  // this indexes strictly on `p.code` (case-insensitive/trimmed, since
  // scanners can pad or vary case unpredictably).
  // NOTE: scanning currently only resolves against products. Services
  // aren't barcode-scanned in this pass — services have `service_code` but
  // no physical barcode workflow was requested, so onScanInput is left
  // product-only. Revisit if service codes need scanner support too.
  const productsByCode = useMemo(() => {
    const map = new Map();
    rawProducts.forEach((p) => {
      if (p.code) map.set(String(p.code).trim().toLowerCase(), p);
    });
    return map;
  }, [rawProducts]);

  const onSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const onFilterChange = useCallback((filterKey, value) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: value }));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchTerm && !p.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (activeFilters.warehouse && p.store_id && p.store_id !== activeFilters.warehouse) return false;
      if (activeFilters.brand && p.brand_id !== activeFilters.brand) return false;
      if (activeFilters.category && p.category_id !== activeFilters.category) return false;
      if (activeFilters.supplier && p.supplier_id !== activeFilters.supplier) return false;
      return true;
    });
  }, [products, searchTerm, activeFilters]);

  // Services are filterable by search + category only — no brand/supplier/
  // warehouse, since services have no store, brand, or supplier relationship.
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (searchTerm && !s.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (activeFilters.category && s.category_id !== activeFilters.category) return false;
      return true;
    });
  }, [services, searchTerm, activeFilters.category]);

  // ---------- Customer ----------
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState(null);

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerFormErrors, setCustomerFormErrors] = useState({});
  const [customerFormSubmitting, setCustomerFormSubmitting] = useState(false);

  // Fetch the full customer list once on mount. There's no server-side
  // search endpoint (customersController only exposes getAll/getById/
  // create/update/delete), so search below filters this list client-side —
  // same pattern as the product filters.
  useEffect(() => {
    let cancelled = false;

    const loadCustomers = async () => {
      setCustomersLoading(true);
      setCustomersError(null);
      const res = await fetchCustomers();
      if (cancelled) return;
      if (res.success) {
        setCustomers(res.data);
      } else {
        setCustomersError(res.error);
      }
      setCustomersLoading(false);
    };

    loadCustomers();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCustomerSearchChange = useCallback((value) => {
    setCustomerSearchTerm(value);
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = customerSearchTerm.trim().toLowerCase();
    if (!term) return [];
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.mobileNumber?.toLowerCase().includes(term)
    );
  }, [customers, customerSearchTerm]);

  const onSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm("");
  }, []);

  const onClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  const onNewCustomerClick = useCallback(() => {
    setCustomerFormErrors({});
    setIsCustomerModalOpen(true);
  }, []);

  const onCloseCustomerModal = useCallback(() => {
    setIsCustomerModalOpen(false);
    setCustomerFormErrors({});
  }, []);

  // Creates the customer via IPC, then — on success — adds it to the local
  // list and selects it directly onto the bill, closing the modal.
  // On failure, returns without closing so the modal can show fieldErrors.
  const onCreateCustomer = useCallback(async (formData) => {
    setCustomerFormSubmitting(true);
    setCustomerFormErrors({});
    try {
      const res = await createCustomer(formData);
      if (res.success && res.customer) {
        setCustomers((prev) => [res.customer, ...prev]);
        setSelectedCustomer(res.customer);
        setCustomerSearchTerm("");
        setIsCustomerModalOpen(false);
        return { success: true };
      }
      if (res.fieldErrors) {
        setCustomerFormErrors(res.fieldErrors);
      } else if (res.error) {
        setCustomerFormErrors({ _general: res.error });
      }
      return { success: false };
    } finally {
      setCustomerFormSubmitting(false);
    }
  }, []);

  // ---------- Cart ----------
  const [cartItems, setCartItems] = useState([]);
  // cart item shape (product line):
  // { _id (composite line key), product_id, name, image_url, variation_id,
  //   variation_name, batch_id, batch_number, price, cost, stock, qty, warranty }
  // cart item shape (service line):
  // { _id (composite line key), service_id, name, image_url: null, price,
  //   cost, qty, warranty }
  // A line is a service line if it carries `service_id` instead of
  // `product_id` — buildSaleLineItems (saleCalculations.js) branches on
  // exactly that, matching the Sale schema's own product_id/service_id
  // distinction.

  // ---------- Variation / batch selection modal ----------
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const [variationModalProduct, setVariationModalProduct] = useState(null);

  // Adds one resolved line (a specific product+variation+batch combo) to the
  // cart, merging qty into an existing line if that exact combo is already
  // there. Both the merge and the initial-add paths are clamped to
  // `line.stock` (when it's a number) — a cashier can never get a cart line
  // whose qty exceeds available stock, whether they're adding the same item
  // twice or the variation modal is handing over a bulk qty directly.
  const addLineToCart = useCallback((line) => {
    const cartKey = `${line.product._id}::${line.variation_id}::${line.batch_id || 'nb'}`;
    const stock = typeof line.stock === "number" && Number.isFinite(line.stock) ? line.stock : undefined;

    setCartItems((prev) => {
      const existing = prev.find((i) => i._id === cartKey);
      if (existing) {
        const requestedQty = existing.qty + (line.qty || 1);
        const clampedQty = stock !== undefined ? Math.min(requestedQty, Math.max(0, stock)) : requestedQty;
        return prev.map((i) => (i._id === cartKey ? { ...i, qty: clampedQty } : i));
      }
      const initialQty = stock !== undefined ? Math.min(line.qty || 1, Math.max(0, stock)) : (line.qty || 1);
      return [
        ...prev,
        {
          _id: cartKey,
          product_id: line.product._id,
          name: line.product.name,
          image_url: line.product.image_url,
          variation_id: line.variation_id,
          variation_name: line.variation_name,
          batch_id: line.batch_id,
          batch_number: line.batch_number,
          price: line.price || 0,
          cost: line.cost || 0,
          stock: line.stock,
          qty: initialQty,
          warranty: null,
          // carried through so buildSalePayload doesn't have to infer it
          structure: line.structure,
          batch_tracking: !!line.batch_tracking,
        },
      ];
    });
  }, []);

  // Adds a service straight to the cart — no variation/batch picker, no
  // stock ceiling (services aren't stocked), qty just increments on repeat
  // clicks like a plain counter. Mirrors addLineToCart's merge-by-key
  // behavior, keyed on service_id alone since a service has no
  // variation/batch to distinguish lines by.
  const addServiceLineToCart = useCallback((service) => {
    const cartKey = `service::${service._id}`;

    setCartItems((prev) => {
      const existing = prev.find((i) => i._id === cartKey);
      if (existing) {
        return prev.map((i) => (i._id === cartKey ? { ...i, qty: (Number(i.qty) || 0) + 1 } : i));
      }
      return [
        ...prev,
        {
          _id: cartKey,
          service_id: service._id,
          name: service.name,
          image_url: null,
          price: service.price || 0,
          cost: service.cost || 0,
          qty: 1,
          warranty: null,
        },
      ];
    });
  }, []);

  // Decides whether the clicked product can go straight to the cart, or
  // needs the variation/batch picker first.
  // - structure "single" + batch_tracking false -> exactly one variation, no batches -> add directly
  // - anything else (variable structure, and/or batch_tracking true) -> open modal
  //
  // `product` here is whatever ProductPannel passed in — the grid-mapped
  // product, not necessarily the full doc — so resolve the raw product from
  // rawProductsById first, since structure/batch_tracking/variations may not
  // survive mapProductForGrid. Falls back to the passed-in product if for some
  // reason it isn't found in rawProducts.
  const onProductClick = useCallback((product) => {
    const rawProduct = rawProductsById.get(String(product._id)) || product;
    const needsSelection = rawProduct.structure === 'variable' || rawProduct.batch_tracking;

    if (!needsSelection) {
      const variation = (rawProduct.variations || [])[0];
      if (!variation) return;
      addLineToCart({
        product: rawProduct,
        variation_id: variation._id,
        variation_name: variation.name,
        batch_id: null,
        batch_number: null,
        price: variation.price,
        cost: variation.cost,
        stock: variation.stock,
        qty: 1,
        structure: rawProduct.structure,
        batch_tracking: rawProduct.batch_tracking,
      });
      return;
    }

    setVariationModalProduct(rawProduct);
    setIsVariationModalOpen(true);
  }, [addLineToCart, rawProductsById]);

  // Fired when a service card is clicked — no variation/batch step, adds
  // straight to cart. `service` here is the grid-mapped shape from
  // mapServiceForGrid ({ _id, name, price, cost, ... }), which already has
  // everything addServiceLineToCart needs.
  const onServiceClick = useCallback((service) => {
    addServiceLineToCart(service);
  }, [addServiceLineToCart]);

  // Fired from ProductPannel's search/scan input on Enter — this is what a
  // barcode scanner effectively does (types the code, then sends a newline).
  // Looks the code up via productsByCode and, on a match, runs it through
  // the exact same onProductClick path a manual click would (so variable/
  // batch-tracked products still open the variation modal rather than
  // silently guessing a variation). Clears the search field on success so
  // the input is immediately ready for the next scan; on no match, the
  // search field is left as-is so the cashier can see what failed to
  // resolve. TODO: surface a "product not found" toast/inline message
  // instead of the console.warn below once there's a place to show it.
  const onScanInput = useCallback((code) => {
    const key = String(code || "").trim().toLowerCase();
    if (!key) return;
    const matched = productsByCode.get(key);
    if (!matched) {
      console.warn(`[onScanInput] no product matched code "${code}"`);
      return;
    }
    onProductClick(matched);
    setSearchTerm("");
  }, [productsByCode, onProductClick]);

  const onCloseVariationModal = useCallback(() => {
    setIsVariationModalOpen(false);
    setVariationModalProduct(null);
  }, []);

  // Called by ProductVariationModal with an array of chosen
  // { variation_id, variation_name, batch_id, batch_number, price, cost, stock, qty }
  const onConfirmVariationSelection = useCallback((items) => {
    if (!variationModalProduct) return;
    items.forEach((opt) => {
      addLineToCart({
        product: variationModalProduct,
        variation_id: opt.variation_id,
        variation_name: opt.variation_name,
        batch_id: opt.batch_id,
        batch_number: opt.batch_number,
        price: opt.price,
        cost: opt.cost,
        stock: opt.stock,
        qty: opt.qty,
        structure: variationModalProduct.structure,
        batch_tracking: variationModalProduct.batch_tracking,
      });
    });
    setIsVariationModalOpen(false);
    setVariationModalProduct(null);
  }, [variationModalProduct, addLineToCart]);

  // Blocked once qty would exceed the line's known stock. If `stock` isn't a
  // number (service items, non-tracked products), there's no ceiling to
  // enforce and the click always succeeds.
  const onIncreaseQty = useCallback((itemId) => {
    setCartItems((prev) =>
      prev.map((i) => {
        if (i._id !== itemId) return i;
        const nextQty = (Number(i.qty) || 0) + 1;
        if (typeof i.stock === "number" && Number.isFinite(i.stock) && nextQty > i.stock) {
          return i; // already at max available stock — ignore the click
        }
        return { ...i, qty: nextQty };
      })
    );
  }, []);

  const onDecreaseQty = useCallback((itemId) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i._id === itemId ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  // Direct qty edit from the typeable input in CartLine.
  // Accepts "" while the cashier is mid-typing (e.g. clearing the field to
  // retype); CartLine's onBlur handler is responsible for snapping "" or
  // invalid values back to 1 once the input loses focus.
  // Whatever is typed is clamped to [1, stock] — a cashier can type "999"
  // and it will silently settle at whatever stock actually allows. Service
  // lines have no `stock` field so this ceiling never applies to them.
  const onQtyChange = useCallback((itemId, newQty) => {
    setCartItems((prev) =>
      prev.map((i) => {
        if (i._id !== itemId) return i;
        if (newQty === "") return { ...i, qty: "" };
        let parsed = Math.max(1, Math.floor(Number(newQty)) || 1);
        if (typeof i.stock === "number" && Number.isFinite(i.stock)) {
          parsed = Math.min(parsed, Math.max(0, i.stock));
        }
        return { ...i, qty: parsed };
      })
    );
  }, []);

  const onRemoveItem = useCallback((itemId) => {
    setCartItems((prev) => prev.filter((i) => i._id !== itemId));
  }, []);

  // ---------- Warranty picker modal ----------
  const [warrantyModalItemId, setWarrantyModalItemId] = useState(null);
  const [warrantyTypes, setWarrantyTypes] = useState([]);
  const [warrantyTypesLoading, setWarrantyTypesLoading] = useState(false);
  const [warrantyTypesError, setWarrantyTypesError] = useState(null);
  const [warrantySubmitting, setWarrantySubmitting] = useState(false);

  const isWarrantyModalOpen = warrantyModalItemId !== null;

  // The cart line the modal is currently editing — resolved here so
  // mainScreen.jsx/WarrantyModal only ever deal with the full item object,
  // not the raw id.
  const warrantyModalCartItem = useMemo(
    () => cartItems.find((i) => i._id === warrantyModalItemId) || null,
    [cartItems, warrantyModalItemId]
  );

  // Fetch warranty types once, lazily, the first time the modal is opened —
  // no need to load them on POS mount if the cashier never clicks the shield icon.
  const [warrantyTypesFetched, setWarrantyTypesFetched] = useState(false);

  useEffect(() => {
    if (!isWarrantyModalOpen || warrantyTypesFetched) return;

    let cancelled = false;

    const loadWarrantyTypes = async () => {
      setWarrantyTypesLoading(true);
      setWarrantyTypesError(null);
      const res = await fetchWarrantyTypes();
      if (cancelled) return;
      if (res.success) {
        setWarrantyTypes(res.data);
        setWarrantyTypesFetched(true);
      } else {
        setWarrantyTypesError(res.error || 'Failed to load warranty types');
      }
      setWarrantyTypesLoading(false);
    };

    loadWarrantyTypes();
    return () => {
      cancelled = true;
    };
  }, [isWarrantyModalOpen, warrantyTypesFetched]);

  const onWarrantyClick = useCallback((itemId) => {
    setWarrantyModalItemId(itemId);
  }, []);

  const onCloseWarrantyModal = useCallback(() => {
    setWarrantyModalItemId(null);
  }, []);

  // Attaches the chosen warranty snapshot to the matching cart line. No IPC
  // call here — the Warranty document itself (which requires sale_id) is
  // only created once the sale is finalized, using this snapshot.
  const onConfirmWarranty = useCallback((itemId, warrantyData) => {
    setWarrantySubmitting(true);
    setCartItems((prev) =>
      prev.map((i) => (i._id === itemId ? { ...i, warranty: warrantyData } : i))
    );
    setWarrantySubmitting(false);
    setWarrantyModalItemId(null);
  }, []);

  const onRemoveWarranty = useCallback((itemId) => {
    setCartItems((prev) =>
      prev.map((i) => (i._id === itemId ? { ...i, warranty: null } : i))
    );
    setWarrantyModalItemId(null);
  }, []);

  // ---------- Discount / tax / delivery ----------
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState("fixed"); // 'fixed' | 'percentage'
  const [specialDiscount, setSpecialDiscount] = useState(0);
  const [isSpecialDiscountUnlocked, setIsSpecialDiscountUnlocked] = useState(false);
  const [tax, setTax] = useState("");
  const [taxType, setTaxType] = useState("fixed"); // 'fixed' | 'percentage' — service charge
  const [deliveryFee, setDeliveryFee] = useState("");

  // Sanitizes a raw money-input string WITHOUT collapsing it to a number —
  // "" must survive so the cashier can actually clear the field. Strips
  // anything that isn't a digit or decimal point (guards against paste of
  // "-5", "abc", "1e5", etc. slipping past the input's onKeyDown guard) and
  // collapses to at most one decimal point. The numeric value is only ever
  // resolved downstream inside calculateOrderTotals / calculatePaymentSummary
  // (via clampNonNegative — Number("") is 0, so an empty field always
  // computes as 0 without needing to be forced back to "0" here).
  const sanitizeMoneyInput = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    let sanitized = String(value).replace(/[^0-9.]/g, "");
    const firstDot = sanitized.indexOf(".");
    if (firstDot !== -1) {
      sanitized = sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, "");
    }
    return sanitized;
  };

  const onDiscountChange = useCallback((value) => {
    setDiscount(sanitizeMoneyInput(value));
  }, []);

  const onDiscountTypeToggle = useCallback(() => {
    setDiscountType((prev) => (prev === "fixed" ? "percentage" : "fixed"));
  }, []);

  const onDeliveryFeeChange = useCallback((value) => {
    setDeliveryFee(sanitizeMoneyInput(value));
  }, []);

  const onTaxChange = useCallback((value) => {
    setTax(sanitizeMoneyInput(value));
  }, []);

  const onTaxTypeToggle = useCallback(() => {
    setTaxType((prev) => (prev === "fixed" ? "percentage" : "fixed"));
  }, []);

  const onSpecialDiscountClick = useCallback(() => {
    // TODO: open SpecialDiscountAuthModal asking for manager PIN.
    // On successful auth: setIsSpecialDiscountUnlocked(true), then allow editing specialDiscount.
  }, []);

  // ---------- Computed totals ----------
  // All order-level math routes through calculateOrderTotals (saleCalculations.js)
  // so these on-screen totals are guaranteed to match what onSaveWithBill/
  // onSaveWithoutBill actually persist — no more risk of the two drifting apart.
  const lineItemsForTotals = useMemo(() => buildSaleLineItems(cartItems), [cartItems]);

  const orderTotals = useMemo(
    () =>
      calculateOrderTotals({
        lineItems: lineItemsForTotals,
        discountType,
        discountValue: discount,
        specialDiscountValue: specialDiscount,
        taxType,
        taxValue: tax,
        deliveryFee,
      }),
    [lineItemsForTotals, discountType, discount, specialDiscount, taxType, tax, deliveryFee]
  );

  const subtotal = orderTotals.subtotal;
  const discountAmount = orderTotals.discountAmount;
  const serviceChargeAmount = orderTotals.serviceChargeAmount;
  const totalDue = orderTotals.totalAmount;

  const totalItems = useMemo(
    () => cartItems.reduce((sum, i) => sum + (Number(i.qty) || 0), 0),
    [cartItems]
  );

  // ---------- Payment ----------
  const [paymentAmounts, setPaymentAmounts] = useState({
    cash: "",
    card: "",
    bank: "",
  });
  const [note, setNote] = useState("");

  // Same sanitize-not-clamp treatment as discount/tax/delivery above — a
  // split payment leg needs to be clearable, and clampNonNegative(value)
  // resolves "" to 0 automatically inside calculatePaymentSummary, so the
  // raw sanitized string is all that needs to live in state.
  const onPaymentAmountChange = useCallback((type, value) => {
    setPaymentAmounts((prev) => ({
      ...prev,
      [type]: sanitizeMoneyInput(value),
    }));
  }, []);

  const onNoteChange = useCallback((value) => {
    setNote(value);
  }, []);

  // Live balance: how much across all payment legs vs. totalDue.
  //   total 6000, paid 5000  -> dueAmount 1000 (customer still owes)
  //   total 6000, paid 10000 -> changeAmount 4000 (change back to customer)
  const paymentSummary = useMemo(
    () => calculatePaymentSummary(paymentAmounts, totalDue),
    [paymentAmounts, totalDue]
  );
  const totalPaid = paymentSummary.totalPaid;
  const dueAmount = paymentSummary.dueAmount;
  const changeAmount = paymentSummary.changeAmount;

  // ---------- Hold / Reset ----------
  const onHoldBill = useCallback(() => {
    // TODO: persist current cart + customer + totals as a held bill (local or IPC),
    // push into heldBills, then reset the working cart.
  }, []);

  const onReset = useCallback(() => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscount("");
    setDiscountType("fixed");
    setSpecialDiscount(0);
    setIsSpecialDiscountUnlocked(false);
    setTax("");
    setTaxType("fixed");
    setDeliveryFee("");
    setPaymentAmounts({ cash: "", card: "", bank: "" });
    setNote("");
  }, []);

  // ---------- Sale confirmation popup ----------
  // Holds the result of the most recent buildSalePayload() call so the
  // confirmation popup can render the totals/payment breakdown without
  // recalculating anything itself.
  //
  // `payload` is exactly what gets sent to window.api.sale.create() on
  // confirm. The popup (and everything else downstream) must only ever READ
  // from pendingSale.payload/pendingSale.totals, never merge them back into
  // one object before persistence — that merge is exactly the bug that
  // produced the duplicated _totals block previously.
  const [pendingSale, setPendingSale] = useState(null); // { payload, totals, printBill } | null
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [saleSubmitError, setSaleSubmitError] = useState(null);
  const [saleFieldErrors, setSaleFieldErrors] = useState(null);

  const isSaleConfirmModalOpen = pendingSale !== null;

  const onCloseSaleConfirmModal = useCallback(() => {
    setPendingSale(null);
    setSaleSubmitError(null);
    setSaleFieldErrors(null);
  }, []);

  // ---------- Sale submission ----------
  // onSaveWithBill/onSaveWithoutBill build the payload from the current
  // cart/discount/tax/payment state via buildSalePayload() (saleCalculations.js)
  // and open the confirmation popup with it — no IPC call happens yet at
  // this step, matching the "review before persist" flow.
  const buildPendingSale = useCallback(
    (printBill) => {
      // TEMP DEBUG — remove once the silent-failure bug is found.
      console.log('[DEBUG] buildPendingSale called with printBill =', printBill);

      const { payload, totals } = buildSalePayload({
        session,
        selectedCustomer,
        cartItems,
        discount,
        discountType,
        specialDiscount,
        tax,
        taxType,
        deliveryFee,
        paymentAmounts,
        note,
      });

      // TEMP DEBUG — remove once the silent-failure bug is found.
      console.log('[DEBUG] payload built:', payload);
      console.log('[DEBUG] totals built:', totals);

      setSaleSubmitError(null);
      setSaleFieldErrors(null);
      setPendingSale({ payload, totals, printBill });
    },
    [session, selectedCustomer, cartItems, discount, discountType, specialDiscount, tax, taxType, deliveryFee, paymentAmounts, note]
  );

  const onSaveWithBill = useCallback(() => buildPendingSale(true), [buildPendingSale]);
  const onSaveWithoutBill = useCallback(() => buildPendingSale(false), [buildPendingSale]);

  // Fired from the confirmation popup's "Confirm" button. Only
  // pendingSale.payload is ever sent over IPC — never pendingSale itself,
  // and never anything with totals/printBill mixed in.
  //
  // TODO: wire actual receipt printing for the printBill=true case — stubbed
  // with console.log(receipt) until the print IPC exists.
  const onConfirmSale = useCallback(async () => {
    // TEMP DEBUG — remove once the silent-failure bug is found.
    console.log('[DEBUG] onConfirmSale fired. pendingSale =', pendingSale);

    if (!pendingSale) {
      console.log('[DEBUG] onConfirmSale bailing early — pendingSale is null/falsy');
      return;
    }

    setSaleSubmitting(true);
    setSaleSubmitError(null);
    setSaleFieldErrors(null);

    try {
      const res = await persistSale(pendingSale.payload);

      // TEMP DEBUG — remove once the silent-failure bug is found.
      console.log('[DEBUG] persistSale result:', res);

      if (!res.success) {
        if (res.fieldErrors) {
          console.log('[DEBUG] sale rejected with fieldErrors:', res.fieldErrors);
          setSaleFieldErrors(res.fieldErrors);
        } else {
          console.log('[DEBUG] sale rejected with error:', res.error);
          setSaleSubmitError(res.error || "Failed to save sale.");
        }
        return;
      }

      if (pendingSale.printBill) {
        // TODO: replace with real print IPC once it exists.
        console.log("[onConfirmSale] receipt:", res.receipt);
      }

      onReset();
      setPendingSale(null);
    } catch (err) {
      // TEMP DEBUG — remove once the silent-failure bug is found.
      // persistSale (posApi.createSale) already catches internally and
      // should never throw, but this catch is here so a thrown error can't
      // silently vanish while debugging.
      console.error('[DEBUG] onConfirmSale threw:', err);
      setSaleSubmitError('Unexpected error while saving sale (see console).');
    } finally {
      setSaleSubmitting(false);
    }
  }, [pendingSale, onReset]);

  return {
    // Header
    session,
    storeName: session?.store_name || null, // TODO: populate if store isn't embedded on the session doc
    openedByName: session?.opened_by_name || null,
    currentDateTime,
    heldBillsCount: heldBills.length,
    closingSession,
    onSaleReturnClick,
    onHeldBillsClick,
    onCalculatorClick,
    isCalculatorOpen,
    onCloseCalculator,
    onClosePosClick,

    // Product panel: catalog tab
    catalogTab,
    onCatalogTabChange,

    // Product panel
    searchTerm,
    onSearchChange,
    onScanInput,
    warehouseOptions,
    brandOptions,
    categoryOptions,
    supplierOptions,
    optionsLoading,
    optionsError,
    activeFilters,
    onFilterChange,
    products: filteredProducts,
    productsLoading,
    productsError,
    onProductClick,

    // Product panel: services
    services: filteredServices,
    servicesLoading,
    servicesError,
    onServiceClick,

    // Variation / batch selection modal
    isVariationModalOpen,
    variationModalProduct,
    onCloseVariationModal,
    onConfirmVariationSelection,

    // Billing panel
    customerSearchTerm,
    onCustomerSearchChange,
    filteredCustomers,
    customersLoading,
    customersError,
    selectedCustomer,
    onSelectCustomer,
    onClearCustomer,
    onNewCustomerClick,
    isCustomerModalOpen,
    onCloseCustomerModal,
    onCreateCustomer,
    customerFormErrors,
    customerFormSubmitting,
    cartItems,
    onIncreaseQty,
    onDecreaseQty,
    onRemoveItem,
    onWarrantyClick,
    onQtyChange,
    subtotal,
    totalItems,
    discount,
    discountType,
    onDiscountChange,
    onDiscountTypeToggle,
    discountAmount,
    specialDiscount,
    isSpecialDiscountUnlocked,
    onSpecialDiscountClick,
    tax,
    taxType,
    onTaxChange,
    onTaxTypeToggle,
    serviceChargeAmount,
    deliveryFee,
    onDeliveryFeeChange,
    totalDue,
    onHoldBill,
    onReset,

    // Warranty picker modal
    isWarrantyModalOpen,
    warrantyModalCartItem,
    warrantyTypes,
    warrantyTypesLoading,
    warrantyTypesError,
    warrantySubmitting,
    onCloseWarrantyModal,
    onConfirmWarranty,
    onRemoveWarranty,

    // Paying panel
    paymentAmounts,
    onPaymentAmountChange,
    totalPaid,
    dueAmount,
    changeAmount,
    note,
    onNoteChange,
    onSaveWithBill,
    onSaveWithoutBill,

    // Sale confirmation popup
    isSaleConfirmModalOpen,
    pendingSale, // { payload, totals, printBill } | null
    onCloseSaleConfirmModal,
    onConfirmSale,
    saleSubmitting,
    saleSubmitError,
    saleFieldErrors,
  };
};

export default usePosHooks;
