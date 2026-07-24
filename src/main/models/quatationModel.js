import mongoose from 'mongoose'

// ── QUOTATION BATCH SUB-SCHEMA ──
// One entry per batch quoted (used when batch_tracking = true).
// cost/discount_type/discount_value are carried silently from the
// real batch at quote time — never user-edited on the quotation itself.
const quotationBatchSchema = new mongoose.Schema(
  {
    batch_number: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true
    },

    cost: {
      type: Number,
      required: [true, 'Batch cost is required'],
      min: [0, 'Cost cannot be negative']
    },

    price: {
      type: Number,
      required: [true, 'Batch selling price is required'],
      min: [0, 'Price cannot be negative']
    },

    discount_type: {
      type: String,
      enum: ['none', 'percent', 'fixed'],
      default: 'none'
    },

    discount_value: {
      type: Number,
      min: [0, 'Discount value cannot be negative'],
      default: null
    },

    quantity: {
      type: Number,
      required: [true, 'Batch quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },

    expiry_date: {
      type: Date,
      default: null
    }
  },
  { _id: true }
)

// ── QUOTATION PRODUCT SUB-SCHEMA ──
// One entry per product line. For structure = 'variable', one entry per variation quoted.
// discount_type/discount_value are the product's OWN discount (copied from the
// variation, or from each batch for batch-tracked lines) at the time of quoting —
// these are never set by the user on the quotation form.
const quotationProductSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },

    // snapshot so a quotation stays readable even if the product is later renamed/deleted
    product_name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },

    structure: {
      type: String,
      required: [true, 'Product structure is required'],
      enum: {
        values: ['single', 'variable'],
        message: 'Structure must be single or variable'
      }
    },

    // present only when structure = 'variable'
    variation_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    variation_name: {
      type: String,
      default: null,
      trim: true
    },

    batch_tracking: {
      type: Boolean,
      required: true,
      default: false
    },

    // ── Used when batch_tracking = false ──
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
      default: null
    },

    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: null
    },

    // carried from the product/variation's own discount — read-only from the quotation's perspective
    discount_type: {
      type: String,
      enum: ['none', 'percent', 'fixed'],
      default: 'none'
    },

    discount_value: {
      type: Number,
      min: [0, 'Discount value cannot be negative'],
      default: null
    },

    quantity: {
      type: Number,
      min: [0, 'Quantity cannot be negative'],
      default: null
    },

    // ── Used when batch_tracking = true ──
    batches: {
      type: [quotationBatchSchema],
      default: []
    },

    // whether this line is being quoted under wholesale pricing
    wholesale_enabled: {
      type: Boolean,
      default: false
    },

    // line total for this product (sum of qty*price ± discount, or sum across batches)
    line_total: {
      type: Number,
      min: [0, 'Line total cannot be negative'],
      default: 0
    }
  },
  { _id: true }
)

// ── QUOTATION SCHEMA ──
const quotationSchema = new mongoose.Schema(
  {
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store is required']
    },

    quotation_number: {
      type: String,
      required: [true, 'Quotation number is required'],
      trim: true
    },

    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required']
    },

    date: {
      type: Date,
      required: [true, 'Quotation date is required'],
      default: Date.now
    },

    products: {
      type: [quotationProductSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one product is required'
      }
    },

    // ── Whole-bill adjustments — entered on the quotation itself, applied on top of the products subtotal ──
    discount_type: {
      type: String,
      enum: ['none', 'percent', 'fixed'],
      default: 'none'
    },

    discount_value: {
      type: Number,
      min: [0, 'Discount value cannot be negative'],
      default: 0
    },

    // percentage applied after the whole-bill discount
    tax: {
      type: Number,
      min: [0, 'Tax cannot be negative'],
      default: 0
    },

    // flat amount added last
    shipping: {
      type: Number,
      min: [0, 'Shipping cannot be negative'],
      default: 0
    },

    grand_total: {
      type: Number,
      required: [true, 'Grand total is required'],
      min: [0, 'Grand total cannot be negative'],
      default: 0
    }
  },
  {
    timestamps: true
  }
)

export const Quotation = mongoose.model('Quotation', quotationSchema)
