import mongoose from 'mongoose'
import { GRN } from '../../models/grnModel'
import { Product } from '../../models/productsModel'
import { Store } from '../../models/storeModel'
import { Supplier } from '../../models/suppliersModel'

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)
const isValidNumber = (n) => typeof n === 'number' && !isNaN(n)

// ── LINE TOTAL HELPER ──
const calcLineTotal = (cost, quantity, discount_type, discount_value) => {
  let total = (cost || 0) * (quantity || 0)
  if (discount_type === 'percent' && discount_value) {
    total -= total * (discount_value / 100)
  } else if (discount_type === 'fixed' && discount_value) {
    total -= discount_value
  }
  return Math.max(total, 0)
}

// ── SERIALIZE HELPER ──
const serializeGRN = (grn) => {
  if (!grn) return null
  try {
    const g = JSON.parse(JSON.stringify(grn))

    const ref = (v, nameField = 'name') => {
      if (!v) return null
      if (typeof v === 'object' && v._id) {
        const normalized = { ...v, _id: String(v._id) }
        if (v[nameField]) normalized.name = v[nameField]
        return normalized
      }
      return String(v)
    }

    return {
      _id: String(g._id),
      store_id: ref(g.store_id),
      supplier_id: ref(g.supplier_id),
      date: g.date,
      invoice_number: g.invoice_number,
      products: (g.products || []).map((p) => ({
        _id: String(p._id),
        product_id: ref(p.product_id, 'name'),
        product_name: p.product_name,
        structure: p.structure,
        variation_id: p.variation_id ? String(p.variation_id) : null,
        variation_name: p.variation_name || null,
        batch_tracking: p.batch_tracking,
        cost: p.cost ?? null,
        price: p.price ?? null,
        discount_type: p.discount_type || 'none',
        discount_value: p.discount_value ?? null,
        quantity: p.quantity ?? null,
        wholesale_enabled: p.wholesale_enabled ?? false,
        line_total: p.line_total ?? 0,
        batches: (p.batches || []).map((b) => ({
          _id: String(b._id),
          batch_number: b.batch_number,
          cost: b.cost,
          price: b.price,
          discount_type: b.discount_type || 'none',
          discount_value: b.discount_value ?? null,
          quantity: b.quantity,
          expiry_date: b.expiry_date || null
        }))
      })),
      payment_status: g.payment_status,
      payment_type: g.payment_type,
      cheque_details: g.cheque_details
        ? {
          cheque_number: g.cheque_details.cheque_number,
          due_date: g.cheque_details.due_date,
          holder_name: g.cheque_details.holder_name
        }
        : null,
      grand_total: g.grand_total ?? 0,
      createdAt: g.createdAt || null,
      updatedAt: g.updatedAt || null
    }
  } catch (err) {
    console.error('serializeGRN error:', err.message)
    return null
  }
}

// ── VALIDATE PRODUCTS (required fields + data types) ──
const validateGRNProducts = (products) => {
  const errors = {}

  if (!Array.isArray(products) || products.length === 0) {
    errors.products = 'At least one product is required'
    return errors
  }

  products.forEach((p, i) => {
    const prefix = `products[${i}]`

    if (!p.product_id) {
      errors[`${prefix}.product_id`] = `Product ${i + 1}: product is required`
    } else if (!isValidObjectId(p.product_id)) {
      errors[`${prefix}.product_id`] = `Product ${i + 1}: invalid product reference`
    }

    if (!p.product_name?.trim()) {
      errors[`${prefix}.product_name`] = `Product ${i + 1}: product name is required`
    }

    if (!p.structure) {
      errors[`${prefix}.structure`] = `Product ${i + 1}: structure is required`
    } else if (!['single', 'variable'].includes(p.structure)) {
      errors[`${prefix}.structure`] = `Product ${i + 1}: structure must be single or variable`
    } else if (p.structure === 'variable') {
      if (!p.variation_id) {
        errors[`${prefix}.variation_id`] = `Product ${i + 1}: variation is required for variable products`
      } else if (!isValidObjectId(p.variation_id)) {
        errors[`${prefix}.variation_id`] = `Product ${i + 1}: invalid variation reference`
      }
    }

    if (typeof p.batch_tracking !== 'boolean') {
      errors[`${prefix}.batch_tracking`] = `Product ${i + 1}: batch tracking must be true or false`
    }

    if (p.batch_tracking === false) {
      // cost/price are NOT collected on the GRN for non-batch lines — they are
      // sourced from the product's existing variation cost/price in cleanGRNProducts
      if (!isValidNumber(p.quantity) || p.quantity <= 0)
        errors[`${prefix}.quantity`] = `Product ${i + 1}: quantity must be a number greater than 0`
      if (p.discount_type && !['none', 'percent', 'fixed'].includes(p.discount_type)) {
        errors[`${prefix}.discount_type`] = `Product ${i + 1}: discount type must be none, percent or fixed`
      } else if (p.discount_type && p.discount_type !== 'none') {
        if (!isValidNumber(p.discount_value) || p.discount_value < 0)
          errors[`${prefix}.discount_value`] = `Product ${i + 1}: discount value is required and must be a positive number`
        if (p.discount_type === 'percent' && p.discount_value > 100)
          errors[`${prefix}.discount_value`] = `Product ${i + 1}: discount percentage cannot exceed 100`
      }
    } else if (p.batch_tracking === true) {
      if (!Array.isArray(p.batches) || p.batches.length === 0) {
        errors[`${prefix}.batches`] = `Product ${i + 1}: at least one batch is required when batch tracking is enabled`
      } else {
        const batchNumbers = []
        p.batches.forEach((b, j) => {
          const bp = `${prefix}.batches[${j}]`
          if (!b.batch_number?.trim()) {
            errors[`${bp}.batch_number`] = `Product ${i + 1}, Batch ${j + 1}: batch number is required`
          } else {
            const key = b.batch_number.trim().toLowerCase()
            if (batchNumbers.includes(key)) {
              errors[`${bp}.batch_number`] = `Product ${i + 1}, Batch ${j + 1}: batch number "${b.batch_number}" is duplicated`
            }
            batchNumbers.push(key)
          }
          if (!isValidNumber(b.cost) || b.cost < 0)
            errors[`${bp}.cost`] = `Product ${i + 1}, Batch ${j + 1}: cost must be a number and cannot be negative`
          if (!isValidNumber(b.price) || b.price < 0)
            errors[`${bp}.price`] = `Product ${i + 1}, Batch ${j + 1}: selling price must be a number and cannot be negative`
          if (!isValidNumber(b.quantity) || b.quantity <= 0)
            errors[`${bp}.quantity`] = `Product ${i + 1}, Batch ${j + 1}: quantity must be a number greater than 0`
          if (b.discount_type && !['none', 'percent', 'fixed'].includes(b.discount_type)) {
            errors[`${bp}.discount_type`] = `Product ${i + 1}, Batch ${j + 1}: discount type must be none, percent or fixed`
          } else if (b.discount_type && b.discount_type !== 'none') {
            if (!isValidNumber(b.discount_value) || b.discount_value < 0)
              errors[`${bp}.discount_value`] = `Product ${i + 1}, Batch ${j + 1}: discount value is required and must be a positive number`
            if (b.discount_type === 'percent' && b.discount_value > 100)
              errors[`${bp}.discount_value`] = `Product ${i + 1}, Batch ${j + 1}: discount percentage cannot exceed 100`
          }
          if (b.expiry_date && isNaN(Date.parse(b.expiry_date))) {
            errors[`${bp}.expiry_date`] = `Product ${i + 1}, Batch ${j + 1}: expiry date is invalid`
          }
        })
      }
    }
  })

  return errors
}

// ── VALIDATE GRN FIELDS (required fields + data types) ──
const validateGRNFields = (data) => {
  const errors = {}
  const { store_id, supplier_id, date, invoice_number, products, payment_status, payment_type, cheque_details } = data || {}

  if (!store_id) {
    errors.store_id = 'Store is required'
  } else if (!isValidObjectId(store_id)) {
    errors.store_id = 'Invalid store reference'
  }

  if (!supplier_id) {
    errors.supplier_id = 'Supplier is required'
  } else if (!isValidObjectId(supplier_id)) {
    errors.supplier_id = 'Invalid supplier reference'
  }

  if (!date) {
    errors.date = 'GRN date is required'
  } else if (isNaN(Date.parse(date))) {
    errors.date = 'GRN date is invalid'
  }

  if (!invoice_number?.trim()) {
    errors.invoice_number = 'Invoice number is required'
  }

  if (!payment_status) {
    errors.payment_status = 'Payment status is required'
  } else if (!['paid', 'unpaid', 'partial'].includes(payment_status)) {
    errors.payment_status = 'Payment status must be paid, unpaid or partial'
  }

  if (!payment_type) {
    errors.payment_type = 'Payment type is required'
  } else if (!['cash', 'card', 'cheque'].includes(payment_type)) {
    errors.payment_type = 'Payment type must be cash, card or cheque'
  } else if (payment_type === 'cheque') {
    if (!cheque_details?.cheque_number?.trim()) errors['cheque_details.cheque_number'] = 'Cheque number is required'
    if (!cheque_details?.due_date) {
      errors['cheque_details.due_date'] = 'Cheque due date is required'
    } else if (isNaN(Date.parse(cheque_details.due_date))) {
      errors['cheque_details.due_date'] = 'Cheque due date is invalid'
    }
    if (!cheque_details?.holder_name?.trim()) errors['cheque_details.holder_name'] = 'Cheque holder name is required'
  }

  const productErrors = validateGRNProducts(products)
  Object.assign(errors, productErrors)

  return errors
}

// ── CLEAN PRODUCTS + COMPUTE TOTALS FOR SAVE ──
const cleanGRNProducts = (products, productsMap) => {
  return products.map((p) => {
    const base = {
      product_id: p.product_id,
      product_name: p.product_name.trim(),
      structure: p.structure,
      variation_id: p.structure === 'variable' ? p.variation_id : null,
      variation_name: p.structure === 'variable' ? p.variation_name?.trim() || null : null,
      batch_tracking: p.batch_tracking,
      wholesale_enabled: p.wholesale_enabled || false
    }

    if (!p.batch_tracking) {
      const product = productsMap.get(String(p.product_id))
      if (!product) {
        throw new Error(`Product "${p.product_name}" no longer exists. Stock was not updated.`)
      }
      const variation = p.structure === 'variable'
        ? product.variations.id(p.variation_id)
        : product.variations[0]
      if (!variation) {
        throw new Error(`Variation "${p.variation_name || p.product_name}" no longer exists. Stock was not updated.`)
      }

      const cost = variation.cost
      const price = variation.price
      const line_total = calcLineTotal(cost, p.quantity, p.discount_type, p.discount_value)
      return {
        ...base,
        cost,
        price,
        discount_type: p.discount_type || 'none',
        discount_value: p.discount_type && p.discount_type !== 'none' ? p.discount_value : null,
        quantity: p.quantity,
        batches: [],
        line_total
      }
    } else {
      const batches = p.batches.map((b) => ({
        batch_number: b.batch_number.trim(),
        cost: b.cost,
        price: b.price,
        discount_type: b.discount_type || 'none',
        discount_value: b.discount_type && b.discount_type !== 'none' ? b.discount_value : null,
        quantity: b.quantity,
        expiry_date: b.expiry_date || null
      }))
      const line_total = batches.reduce(
        (sum, b) => sum + calcLineTotal(b.cost, b.quantity, b.discount_type, b.discount_value),
        0
      )
      return {
        ...base,
        cost: null,
        price: null,
        discount_type: 'none',
        discount_value: null,
        quantity: null,
        batches,
        line_total
      }
    }
  })
}

// ── BATCH NUMBER MATCH HELPER ──
const sameBatchNumber = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()

// ── APPLY STOCK IN ──
const applyStockIn = async (cleanedProducts, grnId) => {
  for (const line of cleanedProducts) {
    const product = await Product.findById(line.product_id)
    if (!product) {
      throw new Error(`Product "${line.product_name}" no longer exists. Stock was not updated.`)
    }

    let variation
    if (line.structure === 'variable') {
      variation = product.variations.id(line.variation_id)
      if (!variation) {
        throw new Error(`Variation "${line.variation_name}" on product "${line.product_name}" no longer exists. Stock was not updated.`)
      }
    } else {
      variation = product.variations[0]
      if (!variation) {
        throw new Error(`Product "${line.product_name}" has no variation to receive stock into.`)
      }
    }

    if (!line.batch_tracking) {
      variation.stock = (variation.stock || 0) + line.quantity
    } else {
      line.batches.forEach((b) => {
        const existing = variation.batches.find((eb) => sameBatchNumber(eb.batch_number, b.batch_number))

        if (existing) {
          // Same batch number already exists — top up its quantity only.
          existing.stock = (existing.stock || 0) + b.quantity
        } else {
          variation.batches.push({
            batch_number: b.batch_number,
            price: b.price,
            cost: b.cost,
            stock: b.quantity,
            discount_type: b.discount_type,
            discount_value: b.discount_value,
            expiry_date: b.expiry_date,
            grn_id: grnId,
            status: 'active'
          })
        }
      })
    }

    await product.save()
  }
}

// ── REVERSE STOCK IN ──s.
const reverseStockIn = async (products, grnId) => {
  for (const line of products) {
    const product = await Product.findById(line.product_id)
    if (!product) continue // product deleted since — nothing to reverse

    const variation = line.structure === 'variable'
      ? product.variations.id(line.variation_id)
      : product.variations[0]
    if (!variation) continue

    if (!line.batch_tracking) {
      variation.stock = Math.max((variation.stock || 0) - (line.quantity || 0), 0)
    } else {
      variation.batches = variation.batches.filter(
        (b) => String(b.grn_id) !== String(grnId)
      )
    }

    await product.save()
  }
}

// ── POPULATE OPTIONS ──
const populateOptions = [
  { path: 'store_id', select: 'name' },
  { path: 'supplier_id', select: 'name' },
  { path: 'products.product_id', select: 'name code' }
]

// ── CREATE GRN ──
export const handleCreateGRN = async (data) => {
  const errors = validateGRNFields(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  let newGRN = null

  try {
    // Pre-fetch every referenced product once so cleanGRNProducts can read
    // non-batch cost/price straight off the matching variation.
    const productIds = [...new Set(data.products.map((p) => String(p.product_id)))]
    const productDocs = await Product.find({ _id: { $in: productIds } })
    const productsMap = new Map(productDocs.map((doc) => [String(doc._id), doc]))

    const cleanedProducts = cleanGRNProducts(data.products, productsMap)
    const grand_total = cleanedProducts.reduce((sum, p) => sum + p.line_total, 0)

    newGRN = await GRN.create({
      store_id: data.store_id,
      supplier_id: data.supplier_id,
      date: data.date,
      invoice_number: data.invoice_number.trim(),
      products: cleanedProducts,
      payment_status: data.payment_status,
      payment_type: data.payment_type,
      cheque_details: data.payment_type === 'cheque' ? data.cheque_details : null,
      grand_total
    })

    // ── Stock-in workflow: push purchased quantity onto the actual products ──
    try {
      await applyStockIn(cleanedProducts, newGRN._id)
    } catch (stockError) {
      // Compensating rollback — no DB transaction available, so undo manually
      await GRN.findByIdAndDelete(newGRN._id)
      console.error('Stock-in error, GRN rolled back:', stockError.message)
      return { success: false, error: stockError.message }
    }

    const populated = await GRN.findById(newGRN._id).populate(populateOptions).lean()

    return {
      success: true,
      message: 'Stock in (GRN) created and product stock updated successfully',
      grn: serializeGRN(populated)
    }
  } catch (error) {
    console.error('Create GRN error:', error)
    if (newGRN) await GRN.findByIdAndDelete(newGRN._id).catch(() => { })
    if (error.name === 'ValidationError') {
      const fieldErrors = {}
      Object.keys(error.errors).forEach((key) => {
        fieldErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors }
    }
    // Errors thrown deliberately in cleanGRNProducts (missing product/variation)
    // have a clear, user-facing message — surface it instead of the generic fallback.
    if (error.message && error.message.includes('no longer exists')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Something went wrong while creating the GRN. Please try again.' }
  }
}

// ── GET ALL GRNs ──
export const handleGetAllGRNs = async () => {
  try {
    const grns = await GRN.find()
      .populate(populateOptions)
      .lean()
      .sort({ createdAt: -1 })

    return {
      success: true,
      grns: grns.map(serializeGRN)
    }
  } catch (error) {
    console.error('Get all GRNs error:', error)
    return { success: false, error: 'Failed to load GRNs. Please try again.' }
  }
}

// ── GET GRN BY ID ──
export const handleGetGRNById = async (id) => {
  if (!id) return { success: false, error: 'GRN ID is required' }
  if (!isValidObjectId(id)) return { success: false, error: 'Invalid GRN ID format.' }

  try {
    const grn = await GRN.findById(id).populate(populateOptions).lean()

    if (!grn) {
      return { success: false, error: 'GRN not found. It may have been deleted.' }
    }

    return { success: true, grn: serializeGRN(grn) }
  } catch (error) {
    console.error('Get GRN by id error:', error)
    return { success: false, error: 'Failed to load GRN. Please try again.' }
  }
}

// ── DELETE GRN ──
export const handleDeleteGRN = async (id) => {
  if (!id) return { success: false, error: 'GRN ID is required' }
  if (!isValidObjectId(id)) return { success: false, error: 'Invalid GRN ID format.' }

  try {
    const grn = await GRN.findByIdAndDelete(id)

    if (!grn) {
      return { success: false, error: 'GRN not found. It may have already been deleted.' }
    }

    return { success: true, message: 'Stock record deleted.' }
  } catch (error) {
    console.error('Delete GRN error:', error)
    return { success: false, error: 'Failed to delete GRN. Please try again.' }
  }
}

// ── UPDATE GRN ──
export const handleUpdateGRN = async (id, data) => {
  if (!id) return { success: false, error: 'GRN ID is required' }
  if (!isValidObjectId(id)) return { success: false, error: 'Invalid GRN ID format.' }

  const errors = validateGRNFields(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  try {
    const oldGRN = await GRN.findById(id).lean()
    if (!oldGRN) {
      return { success: false, error: 'GRN not found. It may have been deleted.' }
    }

    // Build the NEW lines first — fails loudly on missing product/variation
    // before any stock is touched.
    const productIds = [...new Set(data.products.map((p) => String(p.product_id)))]
    const productDocs = await Product.find({ _id: { $in: productIds } })
    const productsMap = new Map(productDocs.map((doc) => [String(doc._id), doc]))

    const cleanedProducts = cleanGRNProducts(data.products, productsMap)
    const grand_total = cleanedProducts.reduce((sum, p) => sum + p.line_total, 0)

    // ── Undo OLD lines, then apply NEW lines ──
    await reverseStockIn(oldGRN.products, oldGRN._id)

    try {
      await applyStockIn(cleanedProducts, oldGRN._id)
    } catch (stockError) {
      // Compensating rollback — best-effort restore of the old stock state
      await applyStockIn(oldGRN.products, oldGRN._id).catch((rollbackErr) =>
        console.error('Rollback after failed GRN update also failed:', rollbackErr.message)
      )
      console.error('Stock-in error during GRN update, old stock restored:', stockError.message)
      return { success: false, error: stockError.message }
    }

    const updatedGRN = await GRN.findByIdAndUpdate(
      id,
      {
        store_id: data.store_id,
        supplier_id: data.supplier_id,
        date: data.date,
        invoice_number: data.invoice_number.trim(),
        products: cleanedProducts,
        payment_status: data.payment_status,
        payment_type: data.payment_type,
        cheque_details: data.payment_type === 'cheque' ? data.cheque_details : null,
        grand_total
      },
      { new: true, runValidators: true }
    )

    const populated = await GRN.findById(updatedGRN._id).populate(populateOptions).lean()

    return {
      success: true,
      message: 'Stock in (GRN) updated and product stock adjusted successfully',
      grn: serializeGRN(populated)
    }
  } catch (error) {
    console.error('Update GRN error:', error)
    if (error.name === 'ValidationError') {
      const fieldErrors = {}
      Object.keys(error.errors).forEach((key) => {
        fieldErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors }
    }
    if (error.message && error.message.includes('no longer exists')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Something went wrong while updating the GRN. Please try again.' }
  }
}
