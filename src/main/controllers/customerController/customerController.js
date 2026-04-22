import { Customer } from '../../models/customersModel'

const normalizeNic = (nic) => nic.trim().toUpperCase()

const serializeCustomer = (customer) => {
  if (!customer) return null

  const plain = typeof customer.toObject === 'function' ? customer.toObject() : customer
  return {
    ...plain,
    _id: plain?._id?.toString ? plain._id.toString() : plain?._id
  }
}

const validateCustomerFields = ({ name, mobileNumber, nicNumber, address }) => {
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

export const handleCreateCustomer = async (data) => {
  const { name, mobileNumber, nicNumber, address } = data || {}

  const fieldErrors = validateCustomerFields({ name, mobileNumber, nicNumber, address })
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors }
  }

  try {
    const existingMobile = await Customer.findOne({ mobileNumber: mobileNumber.trim() })
    if (existingMobile) {
      return { success: false, fieldErrors: { mobileNumber: 'Mobile number already exists' } }
    }

    const nic = normalizeNic(nicNumber)
    const existingNic = await Customer.findOne({ nicNumber: nic })
    if (existingNic) {
      return { success: false, fieldErrors: { nicNumber: 'NIC number already exists' } }
    }

    const customer = await Customer.create({
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      nicNumber: nic,
      address: address.trim()
    })

    return {
      success: true,
      message: 'Customer created successfully',
      customer: serializeCustomer(customer)
    }
  } catch (error) {
    console.error('Create customer error:', error.message, error.code)

    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0]
      if (duplicateField === 'mobileNumber') {
        return { success: false, fieldErrors: { mobileNumber: 'Mobile number already exists' } }
      }
      if (duplicateField === 'nicNumber') {
        return { success: false, fieldErrors: { nicNumber: 'NIC number already exists' } }
      }
      return { success: false, fieldErrors: { error: 'Duplicate entry' } }
    }

    if (error.name === 'ValidationError') {
      const validationErrors = {}
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors: validationErrors }
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export const handleGetAllCustomers = async () => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 }).lean()
    return { success: true, customers: customers.map(serializeCustomer) }
  } catch (error) {
    console.error('Get all customers error:', error)
    return { success: false, error: 'Failed to fetch customers' }
  }
}

export const handleGetCustomerById = async (id) => {
  if (!id) {
    return { success: false, error: 'Customer ID is required' }
  }

  try {
    const customer = await Customer.findById(id).lean()
    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    return { success: true, customer: serializeCustomer(customer) }
  } catch (error) {
    console.error('Get customer by id error:', error)
    return { success: false, error: 'Failed to fetch customer' }
  }
}

export const handleUpdateCustomer = async (data) => {
  const { id, name, mobileNumber, nicNumber, address } = data || {}

  if (!id) {
    return { success: false, error: 'Customer ID is required' }
  }

  const fieldErrors = validateCustomerFields({ name, mobileNumber, nicNumber, address })
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors }
  }

  try {
    const trimmedMobile = mobileNumber.trim()
    const normalizedNic = normalizeNic(nicNumber)

    const existingMobile = await Customer.findOne({
      mobileNumber: trimmedMobile,
      _id: { $ne: id }
    })

    if (existingMobile) {
      return { success: false, fieldErrors: { mobileNumber: 'Mobile number already exists' } }
    }

    const existingNic = await Customer.findOne({
      nicNumber: normalizedNic,
      _id: { $ne: id }
    })

    if (existingNic) {
      return { success: false, fieldErrors: { nicNumber: 'NIC number already exists' } }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        mobileNumber: trimmedMobile,
        nicNumber: normalizedNic,
        address: address.trim()
      },
      { new: true, runValidators: true }
    ).lean()

    if (!updatedCustomer) {
      return { success: false, error: 'Customer not found' }
    }

    return {
      success: true,
      message: 'Customer updated successfully',
      customer: serializeCustomer(updatedCustomer)
    }
  } catch (error) {
    console.error('Update customer error:', error.message, error.code)

    // Handle duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0]
      if (duplicateField === 'mobileNumber') {
        return { success: false, fieldErrors: { mobileNumber: 'Mobile number already exists' } }
      }
      if (duplicateField === 'nicNumber') {
        return { success: false, fieldErrors: { nicNumber: 'NIC number already exists' } }
      }
      return { success: false, fieldErrors: { error: 'Duplicate entry' } }
    }

    if (error.name === 'ValidationError') {
      const validationErrors = {}
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors: validationErrors }
    }

    return { success: false, error: 'Failed to update customer' }
  }
}

export const handleDeleteCustomer = async (id) => {
  if (!id) {
    return { success: false, error: 'Customer ID is required' }
  }

  try {
    const deletedCustomer = await Customer.findByIdAndDelete(id)

    if (!deletedCustomer) {
      return { success: false, error: 'Customer not found' }
    }

    return { success: true, message: 'Customer deleted successfully' }
  } catch (error) {
    console.error('Delete customer error:', error)
    return { success: false, error: 'Failed to delete customer' }
  }
}
