import { useState } from 'react'

const validateSupplier = (form) => {
  const errors = {}

  const name = form.name?.trim()
  const mobileNumber = form.mobileNumber?.trim()
  const nicNumber = form.nicNumber?.trim().toUpperCase()
  const address = form.address?.trim()

  if (!name) {
    errors.name = 'Name is required'
  }

  if (!mobileNumber) {
    errors.mobileNumber = 'Mobile number is required'
  } else if (!/^\d+$/.test(mobileNumber)) {
    errors.mobileNumber = 'Mobile number must be integers only'
  } else if (!/^0\d{9}$/.test(mobileNumber)) {
    errors.mobileNumber = 'Mobile number must be 10 digits and start with 0'
  }

  if (!nicNumber) {
    errors.nicNumber = 'NIC number is required'
  } else if (!(/^\d{12}$/.test(nicNumber) || /^\d{9}V$/.test(nicNumber))) {
    errors.nicNumber = 'NIC must be 12 digits or 10 characters with ending V'
  }

  if (!address) {
    errors.address = 'Address is required'
  }

  return errors
}

export const useSupplierHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const resetMessages = () => {
    setError('')
    setFieldErrors({})
  }

  const createSupplier = async (form) => {
    resetMessages()
    const errors = validateSupplier(form)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return { success: false, fieldErrors: errors }
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        mobileNumber: form.mobileNumber.trim(),
        nicNumber: form.nicNumber.trim().toUpperCase(),
        address: form.address.trim()
      }

      const res = await window.api.supplier.create(payload)

      if (!res?.success) {
        if (res?.fieldErrors) {
          setFieldErrors(res.fieldErrors)
        } else {
          setError(res?.error || 'Failed to create supplier')
        }
      }

      return res
    } catch (err) {
      console.error(err)
      const message = 'An unexpected error occurred. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const updateSupplier = async (id, form) => {
    resetMessages()
    const errors = validateSupplier(form)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return { success: false, fieldErrors: errors }
    }

    setLoading(true)
    try {
      const payload = {
        id,
        name: form.name.trim(),
        mobileNumber: form.mobileNumber.trim(),
        nicNumber: form.nicNumber.trim().toUpperCase(),
        address: form.address.trim()
      }

      const res = await window.api.supplier.update(payload)

      if (!res?.success) {
        if (res?.fieldErrors) {
          setFieldErrors(res.fieldErrors)
        } else {
          setError(res?.error || 'Failed to update supplier')
        }
      }

      return res
    } catch (err) {
      console.error(err)
      const message = 'An unexpected error occurred. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const getSupplierById = async (id) => {
    setLoading(true)
    setError('')

    try {
      const res = await window.api.supplier.getById(id)
      if (!res?.success) {
        setError(res?.error || 'Failed to fetch supplier')
      }
      return res
    } catch (err) {
      console.error(err)
      const message = 'An unexpected error occurred. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const getAllSuppliers = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await window.api.supplier.getAll()
      if (!res?.success) {
        setError(res?.error || 'Failed to fetch suppliers')
      }
      return res
    } catch (err) {
      console.error(err)
      const message = 'An unexpected error occurred. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const deleteSupplier = async (id) => {
    setLoading(true)
    setError('')

    try {
      const res = await window.api.supplier.delete(id)
      if (!res?.success) {
        setError(res?.error || 'Failed to delete supplier')
      }
      return res
    } catch (err) {
      console.error(err)
      const message = 'An unexpected error occurred. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    fieldErrors,
    setFieldErrors,
    setError,
    createSupplier,
    updateSupplier,
    getSupplierById,
    getAllSuppliers,
    deleteSupplier
  }
}