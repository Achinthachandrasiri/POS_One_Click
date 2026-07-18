import mongoose from 'mongoose'

// ── TRANSFER BATCH SUB-SCHEMA ──
// One entry per batch moved (used when batch_tracking = true).
// batch_number/cost/expiry_date are carried silently from the
// real batch at transfer time — never user-edited on the transfer itself.
const transferBatchSchema = new mongoose.Schema(
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

// ── TRANSFER PRODUCT SUB-SCHEMA ──
// One entry per product line. For structure = 'variable', one entry per variation moved.
const transferProductSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },

    // snapshot so a transfer stays readable even if the product is later renamed/deleted
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

    unit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: [true, 'Unit is required']
    },

    unit_name: {
      type: String,
      required: [true, 'Unit name is required'],
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

    quantity: {
      type: Number,
      min: [0, 'Quantity cannot be negative'],
      default: null
    },

    // ── Used when batch_tracking = true ──
    batches: {
      type: [transferBatchSchema],
      default: []
    },

    // line total for this product (quantity*cost, or sum across batches)
    line_total: {
      type: Number,
      min: [0, 'Line total cannot be negative'],
      default: 0
    }
  },
  { _id: true }
)

// ── STOCK TRANSFER SCHEMA ──
const stockTransferSchema = new mongoose.Schema(
  {
    from_store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'From store is required']
    },

    to_store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'To store is required']
    },

    switch_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Switch by (user) is required']
    },

    date: {
      type: Date,
      required: [true, 'Transfer date is required'],
      default: Date.now
    },

    products: {
      type: [transferProductSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one product is required'
      }
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

export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema)
