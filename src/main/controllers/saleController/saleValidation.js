import mongoose from 'mongoose'

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)
const isValidNumber = (n) => typeof n === 'number' && !isNaN(n)

// Validates the { type, value, amount } Adjustment shape used by discount /
// service_charge / special_discount / per-line product_discount &
// special_discount. `value` covers both fixed-currency and percentage
// inputs (0-100 when type is 'percentage') — there's no separate
// `percentage` field.
const validateAdjustment = (adj, label) => {
  const errors = {}
  if (!adj) return errors
  if (adj.type && !['fixed', 'percentage'].includes(adj.type)) {
    errors[label] = `${label} type must be fixed or percentage`
  }
  if (adj.type === 'percentage' && (adj.value == null || isNaN(adj.value) || adj.value < 0 || adj.value > 100)) {
    errors[label] = `${label} value must be between 0 and 100 when type is percentage`
  }
  if (adj.value != null && (isNaN(adj.value) || adj.value < 0)) {
    errors[label] = `${label} value cannot be negative`
  }
  return errors
}

// A line item is a SERVICE line if it carries `service_id`, a PRODUCT line
// otherwise — same presence-based distinction as the Sale schema and
// saleCalculations.js's buildSaleLineItems().
export const validateSaleItems = (items) => {
  const errors = {}
  if (!Array.isArray(items) || items.length === 0) {
    errors.items = 'A sale must contain at least one item'
    return errors
  }

  items.forEach((item, i) => {
    const prefix = `items[${i}]`
    const isService = !!item.service_id

    if (!isValidNumber(item.qty) || item.qty <= 0) {
      errors[`${prefix}.qty`] = `Item ${i + 1}: quantity must be greater than 0`
    }

    if (isService) {
      if (!isValidObjectId(item.service_id)) {
        errors[`${prefix}.service_id`] = `Item ${i + 1}: invalid service reference`
      }
      if (!item.service?.service_name?.trim()) {
        errors[`${prefix}.service.service_name`] = `Item ${i + 1}: service name is required`
      }
      if (!isValidNumber(item.service?.service_price) || item.service.service_price < 0) {
        errors[`${prefix}.service.service_price`] = `Item ${i + 1}: service price is required and cannot be negative`
      }
      if (!isValidNumber(item.service?.service_cost) || item.service.service_cost < 0) {
        errors[`${prefix}.service.service_cost`] = `Item ${i + 1}: service cost is required and cannot be negative`
      }
    } else {
      if (!item.product_id || !isValidObjectId(item.product_id)) {
        errors[`${prefix}.product_id`] = `Item ${i + 1}: invalid product reference`
      }
      if (!item.product_name?.trim()) {
        errors[`${prefix}.product_name`] = `Item ${i + 1}: product name is required`
      }
      if (!isValidNumber(item.product_price) || item.product_price < 0) {
        errors[`${prefix}.product_price`] = `Item ${i + 1}: product price is required and cannot be negative`
      }
      if (!isValidNumber(item.product_cost) || item.product_cost < 0) {
        errors[`${prefix}.product_cost`] = `Item ${i + 1}: product cost is required and cannot be negative`
      }
      if (!item.structure || !['single', 'variable'].includes(item.structure)) {
        errors[`${prefix}.structure`] = `Item ${i + 1}: structure must be single or variable`
      }
      if (!item.variation_id || !isValidObjectId(item.variation_id)) {
        errors[`${prefix}.variation_id`] = `Item ${i + 1}: variation reference is required`
      }
      if (item.batch_tracking && !item.batch_number?.trim()) {
        errors[`${prefix}.batch_number`] = `Item ${i + 1}: batch number is required when batch tracking is enabled`
      }
      // store_id is intentionally NOT validated here — the controller
      // injects it from data.store_id (the sale's single store dropdown
      // selection) before persistence, since the cart never carries a
      // per-line store_id today.
    }

    Object.assign(errors, validateAdjustment(item.product_discount, `${prefix}.product_discount`))
    Object.assign(errors, validateAdjustment(item.special_discount, `${prefix}.special_discount`))
  })

  return errors
}

export const validateSaleFields = (data) => {
  const errors = {}
  const { store_id, device_id, cash_session_id, payment_status, payments, items } = data || {}

  if (!store_id || !isValidObjectId(store_id)) errors.store_id = 'Store is required'
  if (!device_id) errors.device_id = 'Device ID is required'
  if (!cash_session_id || !isValidObjectId(cash_session_id)) errors.cash_session_id = 'Cash session is required'

  if (!payment_status || !['paid', 'unpaid', 'partial'].includes(payment_status)) {
    errors.payment_status = 'Payment status must be paid, unpaid or partial'
  }
  // NOTE: this requires credit_recovery_deadline for unpaid/partial sales,
  // but there's no UI input for it yet (documented blocker) — unpaid/
  // partial sales will fail validation until that UI exists. Left as-is
  // rather than silently relaxed, per your "don't silently patch documented
  // blockers" convention.
  if ((payment_status === 'unpaid' || payment_status === 'partial') && !data.credit_recovery_deadline) {
    errors.credit_recovery_deadline = 'Recovery deadline is required for unpaid or partial sales'
  }
  if (payment_status !== 'unpaid' && (!Array.isArray(payments) || payments.length === 0)) {
    errors.payments = 'At least one payment entry is required'
  }

  Object.assign(errors, validateAdjustment(data.discount, 'discount'))
  Object.assign(errors, validateAdjustment(data.service_charge, 'service_charge'))
  // Renamed from `offer` to `special_discount` to match the frontend payload.
  Object.assign(errors, validateAdjustment(data.special_discount, 'special_discount'))
  Object.assign(errors, validateSaleItems(items))

  return errors
}
