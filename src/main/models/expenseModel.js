import mongoose from 'mongoose'

// ─────────────────────────────────────────────────────────────
// Suggested expense reasons — used only to populate a UI
// dropdown/datalist. Not enforced by the schema: the user can
// always type a reason that isn't in this list.
// ─────────────────────────────────────────────────────────────
const EXPENSE_REASONS = [
  'Rent',
  'Utilities',
  'Salaries',
  'Transport',
  'Maintenance',
  'Stationery',
  'Marketing',
  'Miscellaneous'
]

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },

    // Auto-populated from the currently logged-in user (decoded JWT) on the
    // controller layer — never accept this from client input.
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    reason: {
      type: String,
      required: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // Optional free-text note
    note: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
)

expenseSchema.index({ date: -1 })
expenseSchema.index({ added_by: 1 })

const Expense = mongoose.model('Expense', expenseSchema)

export { Expense, EXPENSE_REASONS }
