import { useState, useCallback } from 'react'

export const useProductHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const resetMessages = useCallback(() => {
    setError('')
    setFieldErrors({})
  }, [])

  const getAllProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.product.getAll()
      if (!res?.success) setError(res?.error || 'Failed to fetch products')
      return res
    } catch (err) {
      console.error(err)
      const message = 'An unexpected error occurred. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const getProductById = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.product.getById(id)
      if (!res?.success) setError(res?.error || 'Failed to fetch product')
      return res
    } catch (err) {
      console.error(err)
      const message = 'An unexpected error occurred. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const createProduct = useCallback(async (form) => {
    resetMessages()
    setLoading(true)
    try {
      const res = await window.api.product.create(form)
      if (!res?.success) {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        else setError(res?.error || 'Failed to create product')
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
  }, [resetMessages])

  const updateProduct = useCallback(async (form) => {
    resetMessages()
    setLoading(true)
    try {
      const res = await window.api.product.update(form)
      if (!res?.success) {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        else setError(res?.error || 'Failed to update product')
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
  }, [resetMessages])

  const deleteProduct = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.product.delete(id)
      if (!res?.success) setError(res?.error || 'Failed to delete product')
      return res
    } catch (err) {
      console.error(err)
      const message = 'An unexpected error occurred. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProductStatus = useCallback(async (id, status) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.product.updateStatus({ id, status })
      if (!res?.success) setError(res?.error || 'Failed to update product status')
      return res
    } catch (err) {
      console.error(err)
      const message = 'An unexpected error occurred. Please try again.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fieldErrors,
    setFieldErrors,
    setError,
    resetMessages,
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStatus
  }
}
