import mongoose from 'mongoose'

const { Schema } = mongoose

// Matches the { type, value, amount } shape produced by
// saleCalculations.js's buildAdjustment() on the frontend exactly.
// `value` is the input (currency for 'fixed', 0-100 for 'percentage');
// `amount` is always the resolved currency amount, computed once on the
// frontend and re-verified (not blindly trusted) server-side in the
// controller. No separate `percentage` field — there's a single `value`.
const AdjustmentSchema = new Schema(
  {
    type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  { _id: false }
)

const PaymentEntrySchema = new Schema(
  {
    type: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 }
  },
  { _id: false }
)

// A line is a SERVICE line if it carries `service_id`, a PRODUCT line
// otherwise (carrying `product_id`) — presence-based discriminator, no
// separate `item_type` tag. This matches buildSaleLineItems() in
// saleCalculations.js exactly, which always sets the *other* id to null.
// Product-only fields (store_id, variation_id, structure, batch_tracking,
// product_name/price/cost) are enforced via the pre-validate hook below
// rather than schema-level `required: true`, since they must NOT be
// required on service lines.
const SaleItemSchema = new Schema(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    service_id: { type: Schema.Types.ObjectId, ref: 'Service', default: null },

    // Product line fields
    product_name: { type: String, default: null, trim: true },
    product_price: { type: Number, default: null },
    product_cost: { type: Number, default: null },
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
    batch_number: { type: String, default: null, trim: true },
    variation_id: { type: Schema.Types.ObjectId, default: null },
    variation_name: { type: String, default: null, trim: true },
    structure: { type: String, enum: ['single', 'variable', null], default: null },
    batch_tracking: { type: Boolean, default: false },
    wholesale_enabled: { type: Boolean, default: false },
    wholesale_price: { type: Number, default: null },
    expire_date: { type: Date, default: null },

    // Service line fields — snapshot only, never re-fetched from the live
    // Service doc after the sale is saved (same snapshot rule as products).
    service: {
      service_name: { type: String, default: null, trim: true },
      service_price: { type: Number, default: null },
      service_cost: { type: Number, default: null }
    },

    qty: { type: Number, required: true, min: 0 },
    product_discount: { type: AdjustmentSchema, default: () => ({}) },
    special_discount: { type: AdjustmentSchema, default: () => ({}) },

    warranty: {
      warranty_type_id: { type: Schema.Types.ObjectId, ref: 'WarrantyType', default: null },
      warranty_name: { type: String, default: null, trim: true },
      coverage_type: { type: String, default: null, trim: true },
      terms: { type: String, default: null, trim: true },
      serial_number: { type: String, default: null, trim: true }
    },

    // Recomputed and overwritten server-side in the controller from
    // price/qty/discounts — never trusted as-sent from the renderer, even
    // though the renderer also computes them (defense against tampering).
    subtotal: { type: Number, required: true },
    product_profit: { type: Number, required: true }
  },
  { _id: false }
)

// NOTE — Mongoose 9 breaking change: as of Mongoose 9, pre hooks no longer
// support the callback-style `next()` parameter at all (this project is on
// mongoose@9.3.3, confirmed via `npm ls mongoose`). Previously this hook
// declared `function (next) {...}` and called `next()` at the end; under
// Mongoose 9 that `next` parameter is simply never passed in, so calling it
// throws `TypeError: next is not a function`, which Mongoose then wraps
// into a ValidationError on `items` with that exact message — this was the
// literal cause of the "next is not a function" fieldErrors bug. The fix:
// drop the `next` parameter entirely. Hooks are now purely
// synchronous-return / promise-based — return normally to proceed, or
// throw (or call `this.invalidate(...)`, as below, which doesn't itself
// abort the hook) to signal an error. No callback needed either way.
SaleItemSchema.pre('validate', function () {
  const isService = !!this.service_id

  if (isService) {
    if (!this.service || !this.service.service_name) {
      this.invalidate('service.service_name', 'Service name is required for a service line')
    }
    if (typeof this.service?.service_price !== 'number') {
      this.invalidate('service.service_price', 'Service price is required for a service line')
    }
    if (typeof this.service?.service_cost !== 'number') {
      this.invalidate('service.service_cost', 'Service cost is required for a service line')
    }
  } else {
    if (!this.product_id) this.invalidate('product_id', 'Product reference is required for a product line')
    if (!this.product_name) this.invalidate('product_name', 'Product name is required for a product line')
    if (typeof this.product_price !== 'number') this.invalidate('product_price', 'Product price is required for a product line')
    if (typeof this.product_cost !== 'number') this.invalidate('product_cost', 'Product cost is required for a product line')
    if (!this.store_id) this.invalidate('store_id', 'Store is required for a product line')
    if (!this.variation_id) this.invalidate('variation_id', 'Variation reference is required for a product line')
    if (!this.structure) this.invalidate('structure', 'Structure is required for a product line')
    if (this.batch_tracking && !this.batch_number) {
      this.invalidate('batch_number', 'Batch number is required when batch tracking is enabled')
    }
  }
})

const SaleSchema = new Schema(
  {
    invoice_number: { type: String, required: true, unique: true, trim: true },
    sale_number_of_day: { type: Number, required: true },
    sale_date: { type: Date, required: true },
    device_timestamp: { type: Date, required: true },
    time_source: { type: String, enum: ['device', 'corrected'], default: 'device' },
    store_id: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    device_id: { type: String, required: true, trim: true },
    cash_session_id: { type: Schema.Types.ObjectId, ref: 'CashSession', required: true },
    cashier_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cashier_name: { type: String, required: true, trim: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    customer_name: { type: String, default: null, trim: true },
    discount: { type: AdjustmentSchema, default: () => ({}) },
    service_charge: { type: AdjustmentSchema, default: () => ({}) },
    // Renamed from `offer` to `special_discount` to match saleCalculations.js
    // and usePosHooks.js everywhere else in the app — this was one of the
    // documented unverified field-name assumptions; confirmed/resolved here.
    special_discount: { type: AdjustmentSchema, default: () => ({}) },
    delivery_fee: { type: Number, default: 0 },
    payment_status: { type: String, enum: ['paid', 'unpaid', 'partial'], required: true },
    payments: { type: [PaymentEntrySchema], default: [] },
    credit_recovery_deadline: { type: Date, default: null },
    note: { type: String, default: '', trim: true },
    subtotal: { type: Number, required: true },
    total_amount: { type: Number, required: true },
    amount_given: { type: Number, default: 0 },
    // Renamed from `change_returned` to `change_amount` to match the
    // frontend payload field name.
    change_amount: { type: Number, default: 0 },
    due_amount: { type: Number, default: 0 },
    total_profit: { type: Number, required: true },
    items: {
      type: [SaleItemSchema],
      required: true,
      validate: { validator: (arr) => Array.isArray(arr) && arr.length > 0, message: 'A sale must contain at least one item' }
    }
  },
  { timestamps: true }
)

SaleSchema.index({ store_id: 1, sale_date: 1 })
SaleSchema.index({ cash_session_id: 1 })
SaleSchema.index({ customer_id: 1 })

// Default export, per project convention (all other models/controllers use
// `export default` + default imports — the previous named export on this
// file was the exception, not the rule).
const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema)
export default Sale
