import mongoose from 'mongoose'

// ── GRN RETURN PRODUCT SUB-SCHEMA ──
// One entry per product (or per product+batch, when batch_tracking = true) being returned.
const grnReturnProductSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },

    // snapshot so a return stays readable even if the product is later renamed/deleted
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

    // present only when batch_tracking = true
    batch_number: {
      type: String,
      default: null,
      trim: true
    },

    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative']
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
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

    // quantity originally received on the GRN for this product/batch line
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },

    // quantity actually being returned in this line — must be <= quantity, enforced in controller
    return_quantity: {
      type: Number,
      required: [true, 'Return quantity is required'],
      min: [1, 'Return quantity must be at least 1']
    },

    expiry_date: {
      type: Date,
      default: null
    },

    // line total for this returned product (return_quantity * cost ± discount)
    return_total: {
      type: Number,
      min: [0, 'Return total cannot be negative'],
      default: 0
    }
  },
  { _id: true }
)

// ── CHEQUE SUB-SCHEMA ──
// snapshot of the original GRN's cheque details, present only when payment_type = 'cheque'
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

// ── GRN RETURN SCHEMA ──
const grnReturnSchema = new mongoose.Schema(
  {
    // the original GRN this return is reversing stock against
    grn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GRN',
      required: [true, 'Original GRN reference is required']
    },

    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store is required']
    },

    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required']
    },

    // snapshot of the original GRN's date
    grn_date: {
      type: Date,
      required: [true, 'GRN date is required']
    },

    // date this return was made
    return_date: {
      type: Date,
      required: [true, 'Return date is required'],
      default: Date.now
    },

    // snapshot of the original GRN's invoice number
    invoice_number: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true
    },

    payment_type: {
      type: String,
      required: [true, 'Payment type is required'],
      enum: {
        values: ['cash', 'card', 'cheque'],
        message: 'Payment type must be cash, card or cheque'
      }
    },

    payment_status: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: {
        values: ['paid', 'unpaid', 'partial'],
        message: 'Payment status must be paid, unpaid or partial'
      }
    },

    cheque_details: {
      type: chequeSchema,
      default: null
    },

    products: {
      type: [grnReturnProductSchema],
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
    },

    return_reason: {
      type: String,
      required: [true, 'Return reason is required'],
      enum: {
        values: ['damaged', 'expired', 'wrong_item', 'overstock', 'quality_issue', 'other'],
        message: 'Invalid return reason'
      }
    },

    note: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

export const GRNReturn = mongoose.model('GRNReturn', grnReturnSchema)
