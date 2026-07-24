import { Expense } from '../../models/expenseModel'

// ── HELPERS ──

const sessionError = () => ({
  success: false,
  error: 'Your session has expired. Please log in again.'
})

const canManage = (expense, userId, userRole) => {
  const isOwner = expense.added_by?.toString() === userId
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  return isOwner || isAdmin
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────
const handleCreateExpense = async (data) => {
  const { added_by, date, reason, amount, note } = data || {}

  if (!added_by) {
    return sessionError()
  }

  // Input Validation ______________________________________________________________________________
  if (!date) {
    return { success: false, fieldErrors: { date: 'Date is required' } }
  }
  if (!reason || !reason.trim()) {
    return { success: false, fieldErrors: { reason: 'Reason is required' } }
  }
  if (amount === undefined || amount === null || amount === '') {
    return { success: false, fieldErrors: { amount: 'Amount is required' } }
  }
  const parsedAmount = Number(amount)
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return { success: false, fieldErrors: { amount: 'Amount must be a positive number' } }
  }

  try {
    // Create expense ______________________________________________________________________________
    const expense = await Expense.create({
      date,
      reason: reason.trim(),
      amount: parsedAmount,
      note: note?.trim() || '',
      added_by
    })

    const populated = await expense.populate('added_by', 'first_name last_name email role')

    // JSON.parse(JSON.stringify(...)) forces real JSON serialization, which
    // invokes each ObjectId's own toJSON() and converts it to a plain hex
    // string. This is required before sending back over ipcRenderer.invoke —
    // Mongoose's document.toJSON() alone is NOT enough, since it leaves
    // ObjectId fields as ObjectId instances, which Electron's structured
    // clone will mangle into inert objects (causing "[object Object]" keys
    // downstream) or throw "An object could not be cloned".
    return { success: true, expense: JSON.parse(JSON.stringify(populated)) }
  } catch (error) {
    console.error('Create expense error:', error)
    return { success: false, error: 'Failed to save the expense. Please try again.' }
  }
}

// ─────────────────────────────────────────────────────────────
// READ (ALL)
// ─────────────────────────────────────────────────────────────
const handleGetAllExpenses = async () => {
  try {
    const expenses = await Expense.find()
      .populate('added_by', 'first_name last_name email role')
      .sort({ date: -1, createdAt: -1 })

    // JSON.parse(JSON.stringify(...)) forces true JSON serialization so every
    // ObjectId (both top-level _id and populated added_by._id) becomes a
    // real string. Without this, `_id` stays a Mongoose ObjectId instance,
    // which Electron's structured clone turns into an inert plain object —
    // breaking React's `key={exp._id}` (every row collapses to the same
    // "[object Object]") and IPC cloning generally.
    return { success: true, expenses: JSON.parse(JSON.stringify(expenses)) }
  } catch (error) {
    console.error('Get expenses error:', error)
    return { success: false, error: 'Failed to load expenses.' }
  }
}

// ─────────────────────────────────────────────────────────────
// READ (ONE)
// ─────────────────────────────────────────────────────────────
const handleGetExpenseById = async (data) => {
  const { id } = data || {}

  if (!id) {
    return { success: false, error: 'Expense id is required' }
  }

  try {
    const expense = await Expense.findById(id).populate('added_by', 'first_name last_name email role')

    if (!expense) {
      return { success: false, error: 'Expense not found' }
    }

    return { success: true, expense: JSON.parse(JSON.stringify(expense)) }
  } catch (error) {
    console.error('Get expense by id error:', error)
    return { success: false, error: 'Failed to load this expense.' }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────
const handleUpdateExpense = async (data) => {
  const { id, date, reason, amount, note, userId, userRole } = data || {}

  if (!userId) {
    return sessionError()
  }

  if (!id) {
    return { success: false, error: 'Expense id is required' }
  }

  // Input Validation ______________________________________________________________________________
  if (!date) {
    return { success: false, fieldErrors: { date: 'Date is required' } }
  }
  if (!reason || !reason.trim()) {
    return { success: false, fieldErrors: { reason: 'Reason is required' } }
  }
  const parsedAmount = Number(amount)
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return { success: false, fieldErrors: { amount: 'Amount must be a positive number' } }
  }

  try {
    const expense = await Expense.findById(id)

    if (!expense) {
      return { success: false, error: 'Expense not found' }
    }

    // Permission check — only the person who logged it or an admin may edit ________________________
    if (!canManage(expense, userId, userRole)) {
      return { success: false, error: 'You do not have permission to edit this expense.' }
    }

    expense.date = date
    expense.reason = reason.trim()
    expense.amount = parsedAmount
    expense.note = note?.trim() || ''

    await expense.save()
    const populated = await expense.populate('added_by', 'first_name last_name email role')

    return { success: true, expense: JSON.parse(JSON.stringify(populated)) }
  } catch (error) {
    console.error('Update expense error:', error)
    return { success: false, error: 'Failed to update the expense. Please try again.' }
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
const handleDeleteExpense = async (data) => {
  const { id, userId, userRole } = data || {}

  if (!userId) {
    return sessionError()
  }

  if (!id) {
    return { success: false, error: 'Expense id is required' }
  }

  try {
    const expense = await Expense.findById(id)

    if (!expense) {
      return { success: false, error: 'Expense not found' }
    }

    // Permission check — only the person who logged it or an admin may delete ______________________
    if (!canManage(expense, userId, userRole)) {
      return { success: false, error: 'You do not have permission to delete this expense.' }
    }

    await Expense.findByIdAndDelete(id)

    return { success: true }
  } catch (error) {
    console.error('Delete expense error:', error)
    return { success: false, error: 'Failed to delete the expense. Please try again.' }
  }
}

export {
  handleCreateExpense,
  handleGetAllExpenses,
  handleGetExpenseById,
  handleUpdateExpense,
  handleDeleteExpense
}
