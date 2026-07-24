import mongoose from 'mongoose'
import { GRNReturn } from '../../models/grnReturnModel'
import { GRN } from '../../models/grnModel'
import { Product } from '../../models/productsModel'

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)
const isValidNumber = (n) => typeof n === 'number' && !isNaN(n)

// Human-readable labels for the fields most likely to collide on a unique index / fail validation,
// so an error reads naturally regardless of which field triggered it.
const FRIENDLY_FIELD_NAMES = {
  invoice_number: 'Invoice number',
  store_id: 'Store',
  supplier_id: 'Supplier',
  grn_id: 'GRN',
  batch_number: 'Batch number'
}

// ── TRANSLATE A THROWN/CAUGHT ERROR INTO A USER-FACING RESPONSE ──
const translateGRNReturnError = (error, fallbackMessage) => {
  // Mongoose schema validation errors
  if (error.name === 'ValidationError') {
    const fieldErrors = {}
    Object.keys(error.errors).forEach((key) => {
      const sub = error.errors[key]
      fieldErrors[key] = sub.kind === 'required'
        ? `${FRIENDLY_FIELD_NAMES[key] || key} is required`
        : sub.message
    })
    return { success: false, fieldErrors }
  }

  // Duplicate key (unique index) violation
  if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
    const dupField = error.keyPattern ? Object.keys(error.keyPattern)[0] : null
    const label = FRIENDLY_FIELD_NAMES[dupField] || 'This record'
    return {
      success: false,
      fieldErrors: dupField ? { [dupField]: `${label} already exists. Please use a different value.` } : undefined,
      error: `${label} already exists. Please use a different value.`
    }
  }

  // Malformed ObjectId reaching the DB layer
  if (error.name === 'CastError') {
    return { success: false, error: 'One of the values sent was in an invalid format. Please refresh and try again.' }
  }

  // MongoDB connectivity/timeouts
  if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
    return { success: false, error: 'Could not reach the database. Please check your connection and try again.' }
  }

  // Errors thrown deliberately in cleanGRNReturnProducts/applyStockOut/reverseStockOut
  // already carry a clear, user-facing message — surface it instead of the generic fallback.
  if (error.message && (error.message.includes('no longer exists') || error.message.includes('Insufficient stock') || error.message.includes('exceed'))) {
    return { success: false, error: error.message }
  }

  return { success: false, error: fallbackMessage }
}

// ── LINE TOTAL HELPER — cost × return_quantity only, no discount ──
const calcLineTotal = (cost, quantity) => {
  return (cost || 0) * (quantity || 0)
}

// ── BATCH NUMBER MATCH HELPER ──
const sameBatchNumber = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()

// ── SERIALIZE HELPER ──
const serializeGRNReturn = (ret) => {
  if (!ret) return null
  try {
    const g = JSON.parse(JSON.stringify(ret))

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
      grn_id: ref(g.grn_id, 'invoice_number'),
      store_id: ref(g.store_id),
      supplier_id: ref(g.supplier_id),
      grn_date: g.grn_date,
      return_date: g.return_date,
      invoice_number: g.invoice_number,
      payment_type: g.payment_type,
      payment_status: g.payment_status,
      return_reason: g.return_reason,
      note: g.note || null,
      cheque_details: g.cheque_details
        ? {
          cheque_number: g.cheque_details.cheque_number,
          due_date: g.cheque_details.due_date,
          holder_name: g.cheque_details.holder_name
        }
        : null,
      products: (g.products || []).map((p) => ({
        _id: String(p._id),
        product_id: ref(p.product_id, 'name'),
        product_name: p.product_name,
        structure: p.structure,
        variation_id: p.variation_id ? String(p.variation_id) : null,
        variation_name: p.variation_name || null,
        batch_tracking: p.batch_tracking,
        batch_number: p.batch_number || null,
        cost: p.cost,
        price: p.price,
        discount_type: p.discount_type || 'none',
        discount_value: p.discount_value ?? null,
        quantity: p.quantity,
        return_quantity: p.return_quantity,
        expiry_date: p.expiry_date || null,
        return_total: p.return_total ?? 0
      })),
      grand_total: g.grand_total ?? 0,
      createdAt: g.createdAt || null,
      updatedAt: g.updatedAt || null
    }
  } catch (err) {
    console.error('serializeGRNReturn error:', err.message)
    return null
  }
}

// ── VALIDATE PRODUCTS (required fields + data types) ──
const validateGRNReturnProducts = (products) => {
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
    } else if (p.batch_tracking === true && !p.batch_number?.trim()) {
      errors[`${prefix}.batch_number`] = `Product ${i + 1}: batch number is required when batch tracking is enabled`
    }

    if (!isValidNumber(p.cost) || p.cost < 0)
      errors[`${prefix}.cost`] = `Product ${i + 1}: cost must be a number and cannot be negative`
    if (!isValidNumber(p.price) || p.price < 0)
      errors[`${prefix}.price`] = `Product ${i + 1}: price must be a number and cannot be negative`

    if (!isValidNumber(p.quantity) || p.quantity <= 0)
      errors[`${prefix}.quantity`] = `Product ${i + 1}: original quantity must be a number greater than 0`

    if (!isValidNumber(p.return_quantity) || p.return_quantity <= 0) {
      errors[`${prefix}.return_quantity`] = `Product ${i + 1}: return quantity must be a number greater than 0`
    } else if (isValidNumber(p.quantity) && p.return_quantity > p.quantity) {
      errors[`${prefix}.return_quantity`] = `Product ${i + 1}: return quantity cannot exceed the received quantity (${p.quantity})`
    }

    if (p.discount_type && !['none', 'percent', 'fixed'].includes(p.discount_type)) {
      errors[`${prefix}.discount_type`] = `Product ${i + 1}: discount type must be none, percent or fixed`
    } else if (p.discount_type && p.discount_type !== 'none') {
      if (!isValidNumber(p.discount_value) || p.discount_value < 0)
        errors[`${prefix}.discount_value`] = `Product ${i + 1}: discount value is required and must be a positive number`
      if (p.discount_type === 'percent' && p.discount_value > 100)
        errors[`${prefix}.discount_value`] = `Product ${i + 1}: discount percentage cannot exceed 100`
    }

    if (p.expiry_date && isNaN(Date.parse(p.expiry_date))) {
      errors[`${prefix}.expiry_date`] = `Product ${i + 1}: expiry date is invalid`
    }
  })

  return errors
}

// ── VALIDATE GRN RETURN FIELDS (required fields + data types) ──
const validateGRNReturnFields = (data) => {
  const errors = {}
  const {
    grn_id, store_id, supplier_id, grn_date, return_date, invoice_number,
    payment_type, payment_status, cheque_details, products
  } = data || {}

  if (!grn_id) {
    errors.grn_id = 'Original GRN reference is required'
  } else if (!isValidObjectId(grn_id)) {
    errors.grn_id = 'Invalid GRN reference'
  }

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

  if (!grn_date) {
    errors.grn_date = 'GRN date is required'
  } else if (isNaN(Date.parse(grn_date))) {
    errors.grn_date = 'GRN date is invalid'
  }

  if (!return_date) {
    errors.return_date = 'Return date is required'
  } else if (isNaN(Date.parse(return_date))) {
    errors.return_date = 'Return date is invalid'
  }

  if (!invoice_number?.trim()) {
    errors.invoice_number = 'Invoice number is required'
  }

  if (!payment_status) {
    errors.payment_status = 'Payment status is required'
  } else if (!['paid', 'unpaid', 'partial'].includes(payment_status)) {
    errors.payment_status = 'Payment status must be paid, unpaid or partial'
  }

  const { return_reason, note } = data || {}
  if (!return_reason) {
    errors.return_reason = 'Return reason is required'
  } else if (!['damaged', 'expired', 'wrong_item', 'overstock', 'quality_issue', 'other'].includes(return_reason)) {
    errors.return_reason = 'Invalid return reason'
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

  const productErrors = validateGRNReturnProducts(products)
  Object.assign(errors, productErrors)

  return errors
}

// ── CLEAN PRODUCTS + COMPUTE TOTALS FOR SAVE ──
const cleanGRNReturnProducts = (products) => {
  return products.map((p) => {
    const return_total = calcLineTotal(p.cost, p.return_quantity)

    return {
      product_id: p.product_id,
      product_name: p.product_name.trim(),
      structure: p.structure,
      variation_id: p.structure === 'variable' ? p.variation_id : null,
      variation_name: p.structure === 'variable' ? p.variation_name?.trim() || null : null,
      batch_tracking: p.batch_tracking,
      batch_number: p.batch_tracking ? p.batch_number.trim() : null,
      cost: p.cost,
      price: p.price,
      discount_type: 'none',
      discount_value: null,
      quantity: p.quantity,
      return_quantity: p.return_quantity,
      expiry_date: p.expiry_date || null,
      return_total
    }
  })
}

// ── APPLY STOCK OUT (decrement stock for a return) ──
const applyStockOut = async (cleanedProducts) => {
  for (const line of cleanedProducts) {
    const product = await Product.findById(line.product_id)
    if (!product) {
      throw new Error(`Product "${line.product_name}" no longer exists. Stock was not adjusted.`)
    }

    let variation
    if (line.structure === 'variable') {
      variation = product.variations.id(line.variation_id)
      if (!variation) {
        throw new Error(`Variation "${line.variation_name}" on product "${line.product_name}" no longer exists. Stock was not adjusted.`)
      }
    } else {
      variation = product.variations[0]
      if (!variation) {
        throw new Error(`Product "${line.product_name}" has no variation to return stock from.`)
      }
    }

    if (!line.batch_tracking) {
      const currentStock = variation.stock || 0
      if (currentStock < line.return_quantity) {
        throw new Error(
          `Insufficient stock to return for "${line.product_name}". Available: ${currentStock}, return requested: ${line.return_quantity}.`
        )
      }
      variation.stock = currentStock - line.return_quantity
    } else {
      const batch = variation.batches.find((eb) => sameBatchNumber(eb.batch_number, line.batch_number))
      if (!batch) {
        throw new Error(
          `Batch "${line.batch_number}" for "${line.product_name}" no longer exists on this variation. Stock was not adjusted.`
        )
      }
      const currentStock = batch.stock || 0
      if (currentStock < line.return_quantity) {
        throw new Error(
          `Insufficient stock to return for "${line.product_name}" (batch "${line.batch_number}"). Available: ${currentStock}, return requested: ${line.return_quantity}.`
        )
      }
      batch.stock = currentStock - line.return_quantity
    }

    await product.save()
  }
}

// ── REVERSE STOCK OUT (restore stock — used when a return is deleted/cancelled) ──
const reverseStockOut = async (products) => {
  for (const line of products) {
    const product = await Product.findById(line.product_id)
    if (!product) continue

    const variation = line.structure === 'variable'
      ? product.variations.id(line.variation_id)
      : product.variations[0]
    if (!variation) continue

    if (!line.batch_tracking) {
      variation.stock = (variation.stock || 0) + (line.return_quantity || 0)
    } else {
      const batch = variation.batches.find((eb) => sameBatchNumber(eb.batch_number, line.batch_number))
      if (batch) {
        batch.stock = (batch.stock || 0) + (line.return_quantity || 0)
      }
      else {
        console.error(
          `reverseStockOut: batch "${line.batch_number}" for "${line.product_name}" no longer exists — stock could not be restored.`
        )
      }
    }

    await product.save()
  }
}

// ── POPULATE OPTIONS ──
const populateOptions = [
  { path: 'grn_id', select: 'invoice_number' },
  { path: 'store_id', select: 'name' },
  { path: 'supplier_id', select: 'name' },
  { path: 'products.product_id', select: 'name code' }
]

// ── CREATE GRN RETURN ──
export const handleCreateGRNReturn = async (data) => {
  const errors = validateGRNReturnFields(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  let newReturn = null

  try {
    // Confirm the referenced GRN actually exists before doing anything else
    const grn = await GRN.findById(data.grn_id).lean()
    if (!grn) {
      return { success: false, fieldErrors: { grn_id: 'The original GRN could not be found.' } }
    }

    // A GRN can only be returned once — block re-returning it
    const existingReturn = await GRNReturn.findOne({ grn_id: data.grn_id }).lean()
    if (existingReturn) {
      return { success: false, error: 'This stock record has already been returned and cannot be returned again.' }
    }

    const cleanedProducts = cleanGRNReturnProducts(data.products)
    const grand_total = cleanedProducts.reduce((sum, p) => sum + p.return_total, 0)

    newReturn = await GRNReturn.create({
      grn_id: data.grn_id,
      store_id: data.store_id,
      supplier_id: data.supplier_id,
      grn_date: data.grn_date,
      return_date: data.return_date,
      invoice_number: data.invoice_number.trim(),
      payment_type: data.payment_type,
      payment_status: data.payment_status,
      return_reason: data.return_reason,
      note: data.note || null,
      cheque_details: data.payment_type === 'cheque' ? data.cheque_details : null,
      products: cleanedProducts,
      grand_total
    })

    // ── Stock-out workflow: pull the returned quantity back off the actual products ──
    try {
      await applyStockOut(cleanedProducts)
    } catch (stockError) {
      await GRNReturn.findByIdAndDelete(newReturn._id)
      console.error('Stock-out error, GRN return rolled back:', stockError.message)
      return translateGRNReturnError(stockError, 'The return could not be saved because stock could not be adjusted. Please try again.')
    }

    const populated = await GRNReturn.findById(newReturn._id).populate(populateOptions).lean()

    return {
      success: true,
      message: 'GRN return created and product stock adjusted successfully',
      grnReturn: serializeGRNReturn(populated)
    }
  } catch (error) {
    console.error('Create GRN return error:', error)
    if (newReturn) await GRNReturn.findByIdAndDelete(newReturn._id).catch(() => { })
    return translateGRNReturnError(error, 'Something went wrong while creating the return. Please try again.')
  }
}

// ── GET ALL GRN RETURNS ──
export const handleGetAllGRNReturns = async () => {
  try {
    const returns = await GRNReturn.find()
      .populate(populateOptions)
      .lean()
      .sort({ createdAt: -1 })

    return {
      success: true,
      grnReturns: returns.map(serializeGRNReturn)
    }
  } catch (error) {
    console.error('Get all GRN returns error:', error)
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      return { success: false, error: 'Could not reach the database. Please check your connection and try again.' }
    }
    return { success: false, error: 'Failed to load returns. Please try again.' }
  }
}

// ── GET GRN RETURN BY ID ──
export const handleGetGRNReturnById = async (id) => {
  if (!id) return { success: false, error: 'Return ID is required' }
  if (!isValidObjectId(id)) return { success: false, error: 'Invalid return ID format.' }

  try {
    const ret = await GRNReturn.findById(id).populate(populateOptions).lean()

    if (!ret) {
      return { success: false, error: 'Return not found. It may have been deleted.' }
    }

    return { success: true, grnReturn: serializeGRNReturn(ret) }
  } catch (error) {
    console.error('Get GRN return by id error:', error)
    return { success: false, error: 'Failed to load return. Please try again.' }
  }
}

// ── DELETE GRN RETURN ──
export const handleDeleteGRNReturn = async (id) => {
  if (!id) return { success: false, error: 'Return ID is required' }
  if (!isValidObjectId(id)) return { success: false, error: 'Invalid return ID format.' }

  try {
    const ret = await GRNReturn.findById(id).lean()
    if (!ret) {
      return { success: false, error: 'Return not found. It may have already been deleted.' }
    }

    await reverseStockOut(ret.products)
    await GRNReturn.findByIdAndDelete(id)

    return { success: true, message: 'Return deleted and product stock restored.' }
  } catch (error) {
    console.error('Delete GRN return error:', error)
    return translateGRNReturnError(error, 'Failed to delete return. Please try again.')
  }
}
