import mongoose from 'mongoose'

// ── BATCH SUB-SCHEMA ──
const batchSchema = new mongoose.Schema(
  {
    batch_number: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true
    },

    price: {
      type: Number,
      required: [true, 'Batch selling price is required'],
      min: [0, 'Price cannot be negative']
    },

    cost: {
      type: Number,
      required: [true, 'Batch cost price is required'],
      min: [0, 'Cost cannot be negative']
    },

    stock: {
      type: Number,
      required: [true, 'Batch stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
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

    // ── Batch-level wholesale pricing ──
    wholesale_price: {
      type: Number,
      min: [0, 'Wholesale price cannot be negative'],
      default: null
    },

    wholesale_min_qty: {
      type: Number,
      min: [1, 'Minimum quantity must be at least 1'],
      default: null
    },

    expiry_date: {
      type: Date,
      default: null
    },

    // linked when batch is created from a GRN
    grn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GRN',
      default: null
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  { _id: true }
)

// ── VARIATION SUB-SCHEMA ──
// NOTE: variation-level active/inactive status has been removed.
const variationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Variation name is required'],
      trim: true,
      default: 'Default'
    },

    // ── Used when batch_tracking = false ──
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: null
    },

    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
      default: null
    },

    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: null
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

    // ── Variation-level wholesale pricing (used when batch_tracking = false) ──
    wholesale_price: {
      type: Number,
      min: [0, 'Wholesale price cannot be negative'],
      default: null
    },

    wholesale_min_qty: {
      type: Number,
      min: [1, 'Minimum quantity must be at least 1'],
      default: null
    },

    // ── Used when batch_tracking = true ──
    batches: {
      type: [batchSchema],
      default: []
    }
  },
  { _id: true }
  // ── No status field on variations – removed intentionally ──
)

// ── PRODUCT SCHEMA ──
const productSchema = new mongoose.Schema(
  {
    // ── General Details ──
    name: {
      type: String,
      required: [true, 'Product name is required'],
      unique: true,
      trim: true
    },

    code: {
      type: String,
      required: [true, 'Product code is required'],
      unique: true,
      trim: true
    },

    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brands',
      required: [true, 'Brand is required']
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categories',
      required: [true, 'Category is required']
    },

    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required']
    },

    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store is required']
    },

    // ── Product Type ──
    product_type: {
      type: String,
      required: [true, 'Product type is required'],
      enum: {
        values: ['quantity', 'measurable'],
        message: 'Product type must be quantity or measurable'
      }
    },

    unit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Units',
      default: null // required conditionally in controller when product_type = measurable
    },

    // ── Product Structure ──
    structure: {
      type: String,
      required: [true, 'Product structure is required'],
      enum: {
        values: ['single', 'variable'],
        message: 'Structure must be single or variable'
      }
    },

    // ── Batch Tracking ──
    batch_tracking: {
      type: Boolean,
      required: true,
      default: false
    },

    // ── Variations (min 1 always) ──
    variations: {
      type: [variationSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one variation is required'
      }
    },

    // ── Shared Settings ──
    tax: {
      type: Number,
      min: [0, 'Tax cannot be negative'],
      default: 0
    },

    stock_alert: {
      type: Number,
      min: [0, 'Stock alert cannot be negative'],
      default: 5
    },

    // ── Status ──
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },

    image: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
)

export const Product = mongoose.model('Product', productSchema)
