import mongoose from 'mongoose'

// ── GRN BATCH SUB-SCHEMA ──
// One entry per batch received in this GRN (used when batch_tracking = true)
const grnBatchSchema = new mongoose.Schema(
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

// ── GRN PRODUCT SUB-SCHEMA ──
// One entry per product line. For structure = 'variable', one entry per variation received.
const grnProductSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },

    // snapshot so a GRN stays readable even if the product is later renamed/deleted
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
      type: [grnBatchSchema],
      default: []
    },

    // whether this stock-in line is being sold under wholesale pricing
    wholesale_enabled: {
      type: Boolean,
      default: false
    },

    // line total for this product (sum of qty*cost ± discount, or sum across batches)
    line_total: {
      type: Number,
      min: [0, 'Line total cannot be negative'],
      default: 0
    }
  },
  { _id: true }
)

// ── CHEQUE SUB-SCHEMA ──
// present only when payment_type = 'cheque'
const chequeSchema = new mongoose.Schema(
  {
    cheque_number: {
      type: String,
      required: [true, 'Cheque number is required'],
      trim: true
    },

    due_date: {
      type: Date,
      required: [true, 'Cheque due date is required']
    },

    holder_name: {
      type: String,
      required: [true, 'Cheque holder name is required'],
      trim: true
    }
  },
  { _id: false }
)

// ── GRN SCHEMA ──
const grnSchema = new mongoose.Schema(
  {
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store is required']
    },

    invoice_number: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true
    },

    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required']
    },

    date: {
      type: Date,
      required: [true, 'GRN date is required'],
      default: Date.now
    },

    products: {
      type: [grnProductSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one product is required'
      }
    },

    payment_status: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: {
        values: ['paid', 'unpaid', 'partial'],
        message: 'Payment status must be paid, unpaid or partial'
      },
      default: 'unpaid'
    },

    payment_type: {
      type: String,
      required: [true, 'Payment type is required'],
      enum: {
        values: ['cash', 'card', 'cheque'],
        message: 'Payment type must be cash, card or cheque'
      }
    },

    // required only when payment_type = 'cheque' — enforce in controller, same pattern as unit_id on Product
    cheque_details: {
      type: chequeSchema,
      default: null
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

export const GRN = mongoose.model('GRN', grnSchema)
