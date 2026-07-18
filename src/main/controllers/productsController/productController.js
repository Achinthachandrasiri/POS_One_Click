import mongoose from 'mongoose'
import { Product } from '../../models/productsModel'
import { Brand } from '../../models/brandsModel'
import { Category } from '../../models/categoriesModel'
import { Supplier } from '../../models/suppliersModel'
import { Unit } from '../../models/unitsModel'
import { Store } from '../../models/storeModel'

// ── SERIALIZE HELPER ──
// Step 1: JSON.parse(JSON.stringify()) strips ALL Mongoose internals from lean() objects
// Step 2: Explicitly map every field so no surprises cross the IPC boundary
const serializeProduct = (product) => {
  if (!product) return null
  try {
    const p = JSON.parse(JSON.stringify(product))

    const ref = (v) => {
      if (!v) return null
      if (typeof v === 'object' && v._id) {
        const normalized = { ...v, _id: String(v._id) }
        if (v.brandName) normalized.name = v.brandName
        if (v.categoryName) normalized.name = v.categoryName
        // Unit: expose both display name and symbol consistently
        if (v.unitName) {
          normalized.name = v.unitName
          normalized.symbol = v.shortName || null
          normalized.unitType = v.unitType || null
          normalized.subUnit = v.subUnit || null
        }
        return normalized
      }
      return String(v)
    }

    return {
      _id: String(p._id),
      name: p.name,
      code: p.code,
      brand_id: ref(p.brand_id),
      category_id: ref(p.category_id),
      supplier_id: ref(p.supplier_id),
      store_id: ref(p.store_id),
      product_type: p.product_type,
      unit_id: ref(p.unit_id),
      structure: p.structure,
      batch_tracking: p.batch_tracking,
      tax: p.tax ?? 0,
      stock_alert: p.stock_alert ?? 5,
      wholesale_enabled: p.wholesale_enabled ?? false,
      wholesale_price: p.wholesale_price ?? null,
      wholesale_min_qty: p.wholesale_min_qty ?? null,
      status: p.status,
      image: p.image || null,
      variations: (p.variations || []).map((v) => ({
        _id: String(v._id),
        name: v.name,
        price: v.price ?? null,
        cost: v.cost ?? null,
        stock: v.stock ?? null,
        discount_type: v.discount_type || 'none',
        discount_value: v.discount_value ?? null,
        // ── Variation-level wholesale (batch_tracking = false) ──
        wholesale_price: v.wholesale_price ?? null,
        wholesale_min_qty: v.wholesale_min_qty ?? null,
        // NOTE: variation status intentionally omitted – field removed from schema
        batches: (v.batches || []).map((b) => ({
          _id: String(b._id),
          batch_number: b.batch_number,
          price: b.price ?? null,
          cost: b.cost ?? null,
          stock: b.stock ?? null,
          discount_type: b.discount_type || 'none',
          discount_value: b.discount_value ?? null,
          // ── Batch-level wholesale ──
          wholesale_price: b.wholesale_price ?? null,
          wholesale_min_qty: b.wholesale_min_qty ?? null,
          expiry_date: b.expiry_date || null,
          grn_id: b.grn_id ? String(b.grn_id) : null,
          status: b.status
        }))
      })),
      createdAt: p.createdAt || null,
      updatedAt: p.updatedAt || null
    }
  } catch (err) {
    console.error('serializeProduct error:', err.message)
    return null
  }
}

// ── VALIDATE VARIATIONS ──
const validateVariations = (variations, batch_tracking) => {
  const errors = {}

  if (!Array.isArray(variations) || variations.length === 0) {
    errors.variations = 'At least one variation is required'
    return errors
  }

  variations.forEach((v, i) => {
    const prefix = `variations[${i}]`

    if (!v.name?.trim()) {
      errors[`${prefix}.name`] = `Variation ${i + 1}: name is required`
    }

    if (!batch_tracking) {
      if (v.price == null || isNaN(v.price) || v.price < 0)
        errors[`${prefix}.price`] = `Variation ${i + 1}: selling price is required and cannot be negative`
      if (v.cost == null || isNaN(v.cost) || v.cost < 0)
        errors[`${prefix}.cost`] = `Variation ${i + 1}: cost price is required and cannot be negative`
      if (v.stock == null || isNaN(v.stock) || v.stock < 0)
        errors[`${prefix}.stock`] = `Variation ${i + 1}: stock is required and cannot be negative`
      if (v.discount_type && v.discount_type !== 'none') {
        if (v.discount_value == null || isNaN(v.discount_value) || v.discount_value < 0)
          errors[`${prefix}.discount_value`] = `Variation ${i + 1}: discount value is required when discount type is set`
        if (v.discount_type === 'percent' && v.discount_value > 100)
          errors[`${prefix}.discount_value`] = `Variation ${i + 1}: discount percentage cannot exceed 100`
      }
      // ── Wholesale validation per variation ──
      if (v.wholesale_price != null && (isNaN(v.wholesale_price) || v.wholesale_price < 0))
        errors[`${prefix}.wholesale_price`] = `Variation ${i + 1}: wholesale price cannot be negative`
      if (v.wholesale_min_qty != null && (isNaN(v.wholesale_min_qty) || v.wholesale_min_qty < 1))
        errors[`${prefix}.wholesale_min_qty`] = `Variation ${i + 1}: wholesale minimum quantity must be at least 1`
      // Both wholesale fields must be set together
      if ((v.wholesale_price != null) !== (v.wholesale_min_qty != null)) {
        const missingField = v.wholesale_price == null ? `${prefix}.wholesale_price` : `${prefix}.wholesale_min_qty`
        errors[missingField] = `Variation ${i + 1}: wholesale price and minimum quantity must both be set together`
      }
    } else {
      if (!Array.isArray(v.batches) || v.batches.length === 0) {
        errors[`${prefix}.batches`] = `Variation ${i + 1}: at least one batch is required when batch tracking is enabled`
      } else {
        const batchNumbers = []
        v.batches.forEach((b, j) => {
          const bp = `${prefix}.batches[${j}]`
          if (!b.batch_number?.trim()) {
            errors[`${bp}.batch_number`] = `Variation ${i + 1}, Batch ${j + 1}: batch number is required`
          } else {
            if (batchNumbers.includes(b.batch_number.trim().toLowerCase())) {
              errors[`${bp}.batch_number`] = `Variation ${i + 1}, Batch ${j + 1}: batch number "${b.batch_number}" is duplicated`
            }
            batchNumbers.push(b.batch_number.trim().toLowerCase())
          }
          if (b.price == null || isNaN(b.price) || b.price < 0)
            errors[`${bp}.price`] = `Variation ${i + 1}, Batch ${j + 1}: selling price is required and cannot be negative`
          if (b.cost == null || isNaN(b.cost) || b.cost < 0)
            errors[`${bp}.cost`] = `Variation ${i + 1}, Batch ${j + 1}: cost price is required and cannot be negative`
          if (b.stock == null || isNaN(b.stock) || b.stock < 0)
            errors[`${bp}.stock`] = `Variation ${i + 1}, Batch ${j + 1}: stock is required and cannot be negative`
          if (b.discount_type && b.discount_type !== 'none') {
            if (b.discount_value == null || isNaN(b.discount_value) || b.discount_value < 0)
              errors[`${bp}.discount_value`] = `Variation ${i + 1}, Batch ${j + 1}: discount value is required when discount type is set`
            if (b.discount_type === 'percent' && b.discount_value > 100)
              errors[`${bp}.discount_value`] = `Variation ${i + 1}, Batch ${j + 1}: discount percentage cannot exceed 100`
          }
          // ── Wholesale validation per batch ──
          if (b.wholesale_price != null && (isNaN(b.wholesale_price) || b.wholesale_price < 0))
            errors[`${bp}.wholesale_price`] = `Variation ${i + 1}, Batch ${j + 1}: wholesale price cannot be negative`
          if (b.wholesale_min_qty != null && (isNaN(b.wholesale_min_qty) || b.wholesale_min_qty < 1))
            errors[`${bp}.wholesale_min_qty`] = `Variation ${i + 1}, Batch ${j + 1}: wholesale minimum quantity must be at least 1`
          if ((b.wholesale_price != null) !== (b.wholesale_min_qty != null)) {
            const missingField = b.wholesale_price == null ? `${bp}.wholesale_price` : `${bp}.wholesale_min_qty`
            errors[missingField] = `Variation ${i + 1}, Batch ${j + 1}: wholesale price and minimum quantity must both be set together`
          }
        })
      }
    }
  })

  return errors
}

// ── VALIDATE PRODUCT FIELDS ──
const validateProductFields = (data) => {
  const errors = {}
  const {
    name, code, brand_id, category_id, supplier_id, store_id,
    product_type, unit_id, structure, batch_tracking,
    variations, tax, stock_alert,
    wholesale_enabled, wholesale_price, wholesale_min_qty
  } = data || {}

  if (!name?.trim()) errors.name = 'Product name is required'
  if (!code?.trim()) errors.code = 'Product code is required'
  if (!brand_id) errors.brand_id = 'Brand is required'
  if (!category_id) errors.category_id = 'Category is required'
  if (!supplier_id) errors.supplier_id = 'Supplier is required'
  if (!store_id) errors.store_id = 'Store is required'

  if (!product_type) {
    errors.product_type = 'Product type is required'
  } else if (!['quantity', 'measurable'].includes(product_type)) {
    errors.product_type = 'Product type must be either "quantity" or "measurable"'
  } else if (!unit_id) {
    errors.unit_id = 'Unit is required'
  }

  if (!structure) {
    errors.structure = 'Product structure is required'
  } else if (!['single', 'variable'].includes(structure)) {
    errors.structure = 'Product structure must be either "single" or "variable"'
  }

  if (batch_tracking == null) {
    errors.batch_tracking = 'Batch tracking option is required'
  }

  if (tax != null && (isNaN(tax) || tax < 0)) errors.tax = 'Tax must be a positive number'
  if (stock_alert != null && (isNaN(stock_alert) || stock_alert < 0)) errors.stock_alert = 'Stock alert must be a positive number'

  // Product-level wholesale (global fallback)
  if (wholesale_enabled) {
    if (wholesale_price == null || isNaN(wholesale_price) || wholesale_price < 0)
      errors.wholesale_price = 'Wholesale price is required and cannot be negative'
    if (!wholesale_min_qty || isNaN(wholesale_min_qty) || wholesale_min_qty < 1)
      errors.wholesale_min_qty = 'Wholesale minimum quantity must be at least 1'
  }

  const variationErrors = validateVariations(variations, batch_tracking)
  Object.assign(errors, variationErrors)

  return errors
}

// ── CLEAN VARIATIONS FOR SAVE ──
const cleanVariations = (variations, batch_tracking) => {
  return variations.map((v) => {
    const base = {
      name: v.name.trim()
      // NOTE: status field intentionally excluded – removed from variation schema
    }
    if (!batch_tracking) {
      return {
        ...base,
        price: v.price,
        cost: v.cost,
        stock: v.stock,
        discount_type: v.discount_type || 'none',
        discount_value: v.discount_type && v.discount_type !== 'none' ? v.discount_value : null,
        // ── Variation-level wholesale ──
        wholesale_price: v.wholesale_price != null ? v.wholesale_price : null,
        wholesale_min_qty: v.wholesale_min_qty != null ? v.wholesale_min_qty : null,
        batches: []
      }
    } else {
      return {
        ...base,
        price: null,
        cost: null,
        stock: null,
        discount_type: 'none',
        discount_value: null,
        wholesale_price: null,
        wholesale_min_qty: null,
        batches: v.batches.map((b) => ({
          batch_number: b.batch_number.trim(),
          price: b.price,
          cost: b.cost,
          stock: b.stock,
          discount_type: b.discount_type || 'none',
          discount_value: b.discount_type && b.discount_type !== 'none' ? b.discount_value : null,
          // ── Batch-level wholesale ──
          wholesale_price: b.wholesale_price != null ? b.wholesale_price : null,
          wholesale_min_qty: b.wholesale_min_qty != null ? b.wholesale_min_qty : null,
          expiry_date: b.expiry_date || null,
          grn_id: b.grn_id || null,
          status: b.status || 'active'
        }))
      }
    }
  })
}

// ── POPULATE OPTIONS ──
const populateOptions = [
  { path: 'brand_id', select: 'brandName image' },
  { path: 'category_id', select: 'categoryName image' },
  { path: 'supplier_id', select: 'name' },
  { path: 'store_id', select: 'name' },
  { path: 'unit_id', select: 'unitName shortName unitType subUnit' }
]

// ── CREATE PRODUCT ──
export const handleCreateProduct = async (data) => {
  const errors = validateProductFields(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  try {
    const existingName = await Product.findOne({ name: { $regex: `^${data.name.trim()}$`, $options: 'i' } })
    if (existingName) {
      return { success: false, fieldErrors: { name: `Product name "${data.name.trim()}" is already in use. Please use a unique name.` } }
    }

    const existing = await Product.findOne({ code: data.code.trim() })
    if (existing) {
      return { success: false, fieldErrors: { code: `Product code "${data.code.trim()}" is already in use. Please use a unique code.` } }
    }

    const newProduct = await Product.create({
      name: data.name.trim(),
      code: data.code.trim(),
      brand_id: data.brand_id,
      category_id: data.category_id,
      supplier_id: data.supplier_id,
      store_id: data.store_id,
      product_type: data.product_type,
      unit_id: data.unit_id,
      structure: data.structure,
      batch_tracking: data.batch_tracking,
      variations: cleanVariations(data.variations, data.batch_tracking),
      tax: data.tax ?? 0,
      stock_alert: data.stock_alert ?? 5,
      wholesale_enabled: data.wholesale_enabled || false,
      wholesale_price: data.wholesale_enabled ? data.wholesale_price : null,
      wholesale_min_qty: data.wholesale_enabled ? data.wholesale_min_qty : null,
      status: data.status || 'active',
      image: data.image || null
    })

    const populated = await Product.findById(newProduct._id).populate(populateOptions).lean()

    return {
      success: true,
      message: 'Product created successfully',
      product: serializeProduct(populated)
    }
  } catch (error) {
    console.error('Create product error:', error)
    if (error.name === 'ValidationError') {
      const fieldErrors = {}
      Object.keys(error.errors).forEach((key) => {
        fieldErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors }
    }
    if (error.code === 11000) {
      const field = error.keyPattern?.name ? 'name' : 'code'
      const value = field === 'name' ? data.name?.trim() : data.code?.trim()
      return { success: false, fieldErrors: { [field]: `Product ${field} "${value}" already exists. Please use a unique ${field}.` } }
    }
    return { success: false, error: 'Something went wrong while creating the product. Please try again.' }
  }
}

// ── GET ALL PRODUCTS ──
export const handleGetAllProducts = async () => {
  try {
    const products = await Product.find()
      .populate(populateOptions)
      .lean()
      .sort({ createdAt: -1 })

    console.log('>>> products found:', products.length)

    return {
      success: true,
      products: products.map(serializeProduct)
    }
  } catch (error) {
    console.error('Get all products error:', error)
    return { success: false, error: 'Failed to load products. Please try again.' }
  }
}

// ── GET PRODUCT BY ID ──
export const handleGetProductById = async (id) => {
  if (!id) return { success: false, error: 'Product ID is required' }

  try {
    const product = await Product.findById(id).populate(populateOptions).lean()

    if (!product) {
      return { success: false, error: 'Product not found. It may have been deleted.' }
    }

    return { success: true, product: serializeProduct(product) }
  } catch (error) {
    console.error('Get product by id error:', error)
    if (error.name === 'CastError') {
      return { success: false, error: 'Invalid product ID format.' }
    }
    return { success: false, error: 'Failed to load product. Please try again.' }
  }
}

// ── UPDATE PRODUCT ──
export const handleUpdateProduct = async (data) => {
  const { id } = data || {}

  if (!id) return { success: false, error: 'Product ID is required to update' }

  const errors = validateProductFields(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  try {
    const existingName = await Product.findOne({ name: { $regex: `^${data.name.trim()}$`, $options: 'i' }, _id: { $ne: id } })
    if (existingName) {
      return { success: false, fieldErrors: { name: `Product name "${data.name.trim()}" is already used by another product.` } }
    }

    const existingCode = await Product.findOne({ code: data.code.trim(), _id: { $ne: id } })
    if (existingCode) {
      return { success: false, fieldErrors: { code: `Product code "${data.code.trim()}" is already used by another product.` } }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: data.name.trim(),
        code: data.code.trim(),
        brand_id: data.brand_id,
        category_id: data.category_id,
        supplier_id: data.supplier_id,
        store_id: data.store_id,
        product_type: data.product_type,
        unit_id: data.unit_id,
        structure: data.structure,
        batch_tracking: data.batch_tracking,
        variations: cleanVariations(data.variations, data.batch_tracking),
        tax: data.tax ?? 0,
        stock_alert: data.stock_alert ?? 5,
        wholesale_enabled: data.wholesale_enabled || false,
        wholesale_price: data.wholesale_enabled ? data.wholesale_price : null,
        wholesale_min_qty: data.wholesale_enabled ? data.wholesale_min_qty : null,
        status: data.status || 'active',
        image: data.image || null
      },
      { new: true, runValidators: true }
    ).populate(populateOptions).lean()

    if (!updatedProduct) {
      return { success: false, error: 'Product not found. It may have been deleted.' }
    }

    return {
      success: true,
      message: 'Product updated successfully',
      product: serializeProduct(updatedProduct)
    }
  } catch (error) {
    console.error('Update product error:', error)
    if (error.name === 'ValidationError') {
      const fieldErrors = {}
      Object.keys(error.errors).forEach((key) => {
        fieldErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors }
    }
    if (error.name === 'CastError') {
      return { success: false, error: 'Invalid product ID format.' }
    }
    if (error.code === 11000) {
      const field = error.keyPattern?.name ? 'name' : 'code'
      const value = field === 'name' ? data.name?.trim() : data.code?.trim()
      return { success: false, fieldErrors: { [field]: `Product ${field} "${value}" already exists. Please use a unique ${field}.` } }
    }
    return { success: false, error: 'Something went wrong while updating the product. Please try again.' }
  }
}

// ── DELETE PRODUCT ──
export const handleDeleteProduct = async (id) => {
  if (!id) return { success: false, error: 'Product ID is required to delete' }

  try {
    const deleted = await Product.findByIdAndDelete(id)

    if (!deleted) {
      return { success: false, error: 'Product not found. It may have already been deleted.' }
    }

    return {
      success: true,
      message: `Product "${deleted.name}" has been deleted successfully`
    }
  } catch (error) {
    console.error('Delete product error:', error)
    if (error.name === 'CastError') {
      return { success: false, error: 'Invalid product ID format.' }
    }
    return { success: false, error: 'Something went wrong while deleting the product. Please try again.' }
  }
}

// ── UPDATE PRODUCT STATUS ──
export const handleUpdateProductStatus = async ({ id, status }) => {
  if (!id) return { success: false, error: 'Product ID is required' }
  if (!status || !['active', 'inactive'].includes(status)) {
    return { success: false, error: 'Status must be either "active" or "inactive"' }
  }

  try {
    const updated = await Product.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean()

    if (!updated) {
      return { success: false, error: 'Product not found. It may have been deleted.' }
    }

    const label = status === 'active' ? 'activated' : 'deactivated'
    return {
      success: true,
      message: `Product "${updated.name}" has been ${label} successfully`,
      product: serializeProduct(updated)
    }
  } catch (error) {
    console.error('Update product status error:', error)
    if (error.name === 'CastError') {
      return { success: false, error: 'Invalid product ID format.' }
    }
    return { success: false, error: 'Failed to update product status. Please try again.' }
  }
}

// ── GET PRODUCTS BY STORE ──
export const handleGetProductsByStore = async (storeId) => {
  try {
    if (!storeId) return { success: false, error: 'Store ID is required' }

    const products = await Product.find({ store_id: storeId })
      .populate(populateOptions)
      .lean()
      .sort({ createdAt: -1 })

    return {
      success: true,
      products: products.map(serializeProduct)
    }
  } catch (error) {
    console.error('Get products by store error:', error)
    return { success: false, error: 'Failed to load products for store.' }
  }
}
