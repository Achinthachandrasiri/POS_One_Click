import { Supplier } from '../../models/suppliersModel'

const normalizeNic = (nic) => nic.trim().toUpperCase()

const serializeSupplier = (supplier) => {
  if (!supplier) return null

  const plain = typeof supplier.toObject === 'function' ? supplier.toObject() : supplier
  return {
    ...plain,
    _id: plain?._id?.toString ? plain._id.toString() : plain?._id
  }
}

const validateSupplierFields = ({ name, mobileNumber, nicNumber, address }) => {
  const errors = {}

  if (!name?.trim()) {
    errors.name = 'Name is required'
  }

  if (!mobileNumber?.trim()) {
    errors.mobileNumber = 'Mobile number is required'
  } else if (!/^\d+$/.test(mobileNumber.trim())) {
    errors.mobileNumber = 'Mobile number must be integers only'
  } else if (!/^0\d{9}$/.test(mobileNumber.trim())) {
    errors.mobileNumber = 'Mobile number must be 10 digits and start with 0'
  }

  if (!nicNumber?.trim()) {
    errors.nicNumber = 'NIC number is required'
  } else {
    const nic = normalizeNic(nicNumber)
    if (!(/^\d{12}$/.test(nic) || /^\d{9}V$/.test(nic))) {
      errors.nicNumber = 'NIC must be 12 digits or 10 characters with ending V'
    }
  }

  if (!address?.trim()) {
    errors.address = 'Address is required'
  }

  return errors
}

const mapDuplicateError = (error) => {
  if (error.code !== 11000) return null

  const duplicateField = Object.keys(error.keyPattern || {})[0]
  if (duplicateField === 'mobileNumber') {
    return { success: false, fieldErrors: { mobileNumber: 'Mobile number already exists' } }
  }
  if (duplicateField === 'nicNumber') {
    return { success: false, fieldErrors: { nicNumber: 'NIC number already exists' } }
  }

  return { success: false, fieldErrors: { error: 'Duplicate entry' } }
}

const mapValidationError = (error) => {
  if (error.name !== 'ValidationError') return null

  const validationErrors = {}
  Object.keys(error.errors).forEach((key) => {
    validationErrors[key] = error.errors[key].message
  })

  return { success: false, fieldErrors: validationErrors }
}

export const handleCreateSupplier = async (data) => {
  const { name, mobileNumber, nicNumber, address } = data || {}

  const fieldErrors = validateSupplierFields({ name, mobileNumber, nicNumber, address })
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors }
  }

  try {
    const trimmedMobile = mobileNumber.trim()
    const normalizedNic = normalizeNic(nicNumber)

    const existingMobile = await Supplier.findOne({ mobileNumber: trimmedMobile })
    if (existingMobile) {
      return { success: false, fieldErrors: { mobileNumber: 'Mobile number already exists' } }
    }

    const existingNic = await Supplier.findOne({ nicNumber: normalizedNic })
    if (existingNic) {
      return { success: false, fieldErrors: { nicNumber: 'NIC number already exists' } }
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      mobileNumber: trimmedMobile,
      nicNumber: normalizedNic,
      address: address.trim()
    })

    return {
      success: true,
      message: 'Supplier created successfully',
      supplier: serializeSupplier(supplier)
    }
  } catch (error) {
    console.error('Create supplier error:', error.message, error.code)

    const duplicateError = mapDuplicateError(error)
    if (duplicateError) return duplicateError

    const validationError = mapValidationError(error)
    if (validationError) return validationError

    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export const handleGetAllSuppliers = async () => {
  try {
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 }).lean()
    return { success: true, suppliers: suppliers.map(serializeSupplier) }
  } catch (error) {
    console.error('Get all suppliers error:', error)
    return { success: false, error: 'Failed to fetch suppliers' }
  }
}

export const handleGetSupplierById = async (id) => {
  if (!id) {
    return { success: false, error: 'Supplier ID is required' }
  }

  try {
    const supplier = await Supplier.findById(id).lean()
    if (!supplier) {
      return { success: false, error: 'Supplier not found' }
    }

    return { success: true, supplier: serializeSupplier(supplier) }
  } catch (error) {
    console.error('Get supplier by id error:', error)
    return { success: false, error: 'Failed to fetch supplier' }
  }
}

export const handleUpdateSupplier = async (data) => {
  const { id, name, mobileNumber, nicNumber, address } = data || {}

  if (!id) {
    return { success: false, error: 'Supplier ID is required' }
  }

  const fieldErrors = validateSupplierFields({ name, mobileNumber, nicNumber, address })
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors }
  }

  try {
    const trimmedMobile = mobileNumber.trim()
    const normalizedNic = normalizeNic(nicNumber)

    const existingMobile = await Supplier.findOne({
      mobileNumber: trimmedMobile,
      _id: { $ne: id }
    })

    if (existingMobile) {
      return { success: false, fieldErrors: { mobileNumber: 'Mobile number already exists' } }
    }

    const existingNic = await Supplier.findOne({
      nicNumber: normalizedNic,
      _id: { $ne: id }
    })

    if (existingNic) {
      return { success: false, fieldErrors: { nicNumber: 'NIC number already exists' } }
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        mobileNumber: trimmedMobile,
        nicNumber: normalizedNic,
        address: address.trim()
      },
      { new: true, runValidators: true }
    ).lean()

    if (!updatedSupplier) {
      return { success: false, error: 'Supplier not found' }
    }

    return {
      success: true,
      message: 'Supplier updated successfully',
      supplier: serializeSupplier(updatedSupplier)
    }
  } catch (error) {
    console.error('Update supplier error:', error.message, error.code)

    const duplicateError = mapDuplicateError(error)
    if (duplicateError) return duplicateError

    const validationError = mapValidationError(error)
    if (validationError) return validationError

    return { success: false, error: 'Failed to update supplier' }
  }
}

export const handleDeleteSupplier = async (id) => {
  if (!id) {
    return { success: false, error: 'Supplier ID is required' }
  }

  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(id)

    if (!deletedSupplier) {
      return { success: false, error: 'Supplier not found' }
    }

    return { success: true, message: 'Supplier deleted successfully' }
  } catch (error) {
    console.error('Delete supplier error:', error)
    return { success: false, error: 'Failed to delete supplier' }
  }
}