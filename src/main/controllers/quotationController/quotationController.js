import { Quotation } from '../../models/quatationModel'

// ── SERIALIZATION HELPER ──
const serializeQuotation = (doc) => {
  if (!doc) return null

  const obj = doc.toObject ? doc.toObject() : doc

  return {
    ...obj,
    _id: obj._id.toString(),
    store_id: obj.store_id?._id
      ? { ...obj.store_id, _id: obj.store_id._id.toString() }
      : obj.store_id?.toString?.() ?? obj.store_id,
    customer_id: obj.customer_id?._id
      ? { ...obj.customer_id, _id: obj.customer_id._id.toString() }
      : obj.customer_id?.toString?.() ?? obj.customer_id,
    products: (obj.products || []).map((p) => ({
      ...p,
      _id: p._id?.toString?.() ?? p._id,
      product_id: p.product_id?._id
        ? { ...p.product_id, _id: p.product_id._id.toString() }
        : p.product_id?.toString?.() ?? p.product_id,
      variation_id: p.variation_id?.toString?.() ?? p.variation_id,
      batches: (p.batches || []).map((b) => ({
        ...b,
        _id: b._id?.toString?.() ?? b._id
      }))
    }))
  }
}

// ── CREATE QUOTATION ──
// Pure record creation. Does NOT touch product/variation/batch stock —
// a quotation is a proposal, not a stock transaction.
export const createQuotation = async (data) => {
  try {
    const {
      store_id, quotation_number, customer_id, date, products, grand_total,
      discount_type, discount_value, tax, shipping
    } = data

    if (!store_id) throw new Error('Store is required')
    if (!quotation_number) throw new Error('Quotation number is required')
    if (!customer_id) throw new Error('Customer is required')
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('At least one product is required')
    }

    const quotation = new Quotation({
      store_id,
      quotation_number,
      customer_id,
      date: date || Date.now(),
      products,
      // Whole-bill adjustments, applied on top of the products subtotal
      discount_type: discount_type || 'none',
      discount_value: discount_type && discount_type !== 'none' ? (discount_value || 0) : 0,
      tax: tax || 0,
      shipping: shipping || 0,
      grand_total: grand_total || 0
    })

    const saved = await quotation.save()
    const populated = await Quotation.findById(saved._id)
      .populate('store_id')
      .populate('customer_id')
      .populate('products.product_id')

    return { success: true, data: serializeQuotation(populated) }
  } catch (error) {
    console.error('createQuotation error:', error)
    return { success: false, message: error.message }
  }
}

// ── GET ALL QUOTATIONS ──
export const getQuotations = async (filters = {}) => {
  try {
    const query = {}

    if (filters.store_id) query.store_id = filters.store_id
    if (filters.customer_id) query.customer_id = filters.customer_id
    if (filters.search) {
      query.quotation_number = { $regex: filters.search, $options: 'i' }
    }
    if (filters.from_date || filters.to_date) {
      query.date = {}
      if (filters.from_date) query.date.$gte = new Date(filters.from_date)
      if (filters.to_date) query.date.$lte = new Date(filters.to_date)
    }

    const quotations = await Quotation.find(query)
      .populate('store_id')
      .populate('customer_id')
      .populate('products.product_id')
      .sort({ createdAt: -1 })

    return { success: true, data: quotations.map(serializeQuotation) }
  } catch (error) {
    console.error('getQuotations error:', error)
    return { success: false, message: error.message }
  }
}

// ── GET SINGLE QUOTATION ──
export const getQuotationById = async (id) => {
  try {
    if (!id) throw new Error('Quotation id is required')

    const quotation = await Quotation.findById(id)
      .populate('store_id')
      .populate('customer_id')
      .populate('products.product_id')

    if (!quotation) throw new Error('Quotation not found')

    return { success: true, data: serializeQuotation(quotation) }
  } catch (error) {
    console.error('getQuotationById error:', error)
    return { success: false, message: error.message }
  }
}

// ── UPDATE QUOTATION ──
// Full-document replace of the editable fields. Still no stock effect —
// editing quantities/prices/products here only changes what's on paper.
export const updateQuotation = async (id, data) => {
  try {
    if (!id) throw new Error('Quotation id is required')

    const existing = await Quotation.findById(id)
    if (!existing) throw new Error('Quotation not found')

    const {
      quotation_number, customer_id, date, products, grand_total,
      discount_type, discount_value, tax, shipping
    } = data

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('At least one product is required')
    }

    existing.quotation_number = quotation_number ?? existing.quotation_number
    existing.customer_id = customer_id ?? existing.customer_id
    existing.date = date ?? existing.date
    existing.products = products
    existing.discount_type = discount_type || 'none'
    existing.discount_value = discount_type && discount_type !== 'none' ? (discount_value || 0) : 0
    existing.tax = tax || 0
    existing.shipping = shipping || 0
    existing.grand_total = grand_total ?? existing.grand_total

    const saved = await existing.save()
    const populated = await Quotation.findById(saved._id)
      .populate('store_id')
      .populate('customer_id')
      .populate('products.product_id')

    return { success: true, data: serializeQuotation(populated) }
  } catch (error) {
    console.error('updateQuotation error:', error)
    return { success: false, message: error.message }
  }
}

// ── DELETE QUOTATION ──
export const deleteQuotation = async (id) => {
  try {
    if (!id) throw new Error('Quotation id is required')

    const deleted = await Quotation.findByIdAndDelete(id)
    if (!deleted) throw new Error('Quotation not found')

    return { success: true, data: { _id: deleted._id.toString() } }
  } catch (error) {
    console.error('deleteQuotation error:', error)
    return { success: false, message: error.message }
  }
}
