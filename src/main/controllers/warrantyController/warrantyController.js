import WarrantyType from '../../models/warrantyTypeModel'

// ── HELPERS ──

const sessionError = () => ({
  success: false,
  error: 'Your session has expired. Please log in again.'
})

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────
const handleCreateWarrantyType = async (data) => {
  const { added_by, warranty_name, coverage_type, terms } = data || {}

  if (!added_by) {
    return sessionError()
  }

  // Input Validation ______________________________________________________________________________
  if (!warranty_name || !warranty_name.trim()) {
    return { success: false, fieldErrors: { warranty_name: 'Warranty name is required' } }
  }
  const allowedCoverageTypes = ['repair', 'replacement', 'refund', 'repair_or_replacement']
  if (!coverage_type || !allowedCoverageTypes.includes(coverage_type)) {
    return { success: false, fieldErrors: { coverage_type: 'A valid coverage type is required' } }
  }

  try {
    // Create warranty type __________________________________________________________________________
    const warrantyType = await WarrantyType.create({
      warranty_name: warranty_name.trim(),
      coverage_type,
      terms: terms?.trim() || '',
      added_by
    })

    const populated = await warrantyType.populate('added_by', 'first_name last_name email role')

    // JSON.parse(JSON.stringify(...)) forces real JSON serialization, which
    // invokes each ObjectId's own toJSON() and converts it to a plain hex
    // string. This is required before sending back over ipcRenderer.invoke —
    // Mongoose's document.toJSON() alone is NOT enough, since it leaves
    // ObjectId fields as ObjectId instances, which Electron's structured
    // clone will mangle into inert objects (causing "[object Object]" keys
    // downstream) or throw "An object could not be cloned".
    return { success: true, warrantyType: JSON.parse(JSON.stringify(populated)) }
  } catch (error) {
    console.error('Create warranty type error:', error)
    return { success: false, error: 'Failed to save the warranty type. Please try again.' }
  }
}

// ─────────────────────────────────────────────────────────────
// READ (ALL)
// ─────────────────────────────────────────────────────────────
const handleGetAllWarrantyTypes = async () => {
  try {
    const warrantyTypes = await WarrantyType.find()
      .populate('added_by', 'first_name last_name email role')
      .sort({ createdAt: -1 })

    // JSON.parse(JSON.stringify(...)) forces true JSON serialization so every
    // ObjectId (both top-level _id and populated added_by._id) becomes a
    // real string. Without this, `_id` stays a Mongoose ObjectId instance,
    // which Electron's structured clone turns into an inert plain object —
    // breaking React's `key={type._id}` (every row collapses to the same
    // "[object Object]") and IPC cloning generally.
    return { success: true, warrantyTypes: JSON.parse(JSON.stringify(warrantyTypes)) }
  } catch (error) {
    console.error('Get warranty types error:', error)
    return { success: false, error: 'Failed to load warranty types.' }
  }
}

// ─────────────────────────────────────────────────────────────
// READ (ONE)
// ─────────────────────────────────────────────────────────────
const handleGetWarrantyTypeById = async (data) => {
  const { id } = data || {}

  if (!id) {
    return { success: false, error: 'Warranty type id is required' }
  }

  try {
    const warrantyType = await WarrantyType.findById(id).populate('added_by', 'first_name last_name email role')

    if (!warrantyType) {
      return { success: false, error: 'Warranty type not found' }
    }

    return { success: true, warrantyType: JSON.parse(JSON.stringify(warrantyType)) }
  } catch (error) {
    console.error('Get warranty type by id error:', error)
    return { success: false, error: 'Failed to load this warranty type.' }
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────
const handleUpdateWarrantyType = async (data) => {
  const { _id, warranty_name, coverage_type, terms } = data || {}

  if (!_id) {
    return { success: false, error: 'Warranty type id is required' }
  }

  // Input Validation ______________________________________________________________________________
  if (!warranty_name || !warranty_name.trim()) {
    return { success: false, fieldErrors: { warranty_name: 'Warranty name is required' } }
  }
  const allowedCoverageTypes = ['repair', 'replacement', 'refund', 'repair_or_replacement']
  if (!coverage_type || !allowedCoverageTypes.includes(coverage_type)) {
    return { success: false, fieldErrors: { coverage_type: 'A valid coverage type is required' } }
  }

  try {
    const warrantyType = await WarrantyType.findById(_id)

    if (!warrantyType) {
      return { success: false, error: 'Warranty type not found' }
    }

    warrantyType.warranty_name = warranty_name.trim()
    warrantyType.coverage_type = coverage_type
    warrantyType.terms = terms?.trim() || ''

    await warrantyType.save()
    const populated = await warrantyType.populate('added_by', 'first_name last_name email role')

    return { success: true, warrantyType: JSON.parse(JSON.stringify(populated)) }
  } catch (error) {
    console.error('Update warranty type error:', error)
    return { success: false, error: 'Failed to update the warranty type. Please try again.' }
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
const handleDeleteWarrantyType = async (data) => {
  const { id } = data || {}

  if (!id) {
    return { success: false, error: 'Warranty type id is required' }
  }

  try {
    const warrantyType = await WarrantyType.findById(id)

    if (!warrantyType) {
      return { success: false, error: 'Warranty type not found' }
    }

    await WarrantyType.findByIdAndDelete(id)

    return { success: true }
  } catch (error) {
    console.error('Delete warranty type error:', error)
    return { success: false, error: 'Failed to delete the warranty type. Please try again.' }
  }
}

export {
  handleCreateWarrantyType,
  handleGetAllWarrantyTypes,
  handleGetWarrantyTypeById,
  handleUpdateWarrantyType,
  handleDeleteWarrantyType
}
