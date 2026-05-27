import { useState, useCallback } from 'react'

const validateBrand = (form) => {
  const errors = {}

  const brandName = form.brandName?.trim()

  if (!brandName) {
    errors.brandName = 'Brand name is required'
  }

  return errors
}

export const useBrandHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const resetMessages = useCallback(() => {
    setError('')
    setFieldErrors({})
  }, [])

  // ── CREATE BRAND ──────────────────────────────────────────────────────────
  const createBrand = useCallback(async (form) => {
    resetMessages()
    const errors = validateBrand(form)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return { success: false, fieldErrors: errors }
    }

    setLoading(true)
    try {
      const payload = {
        brandName: form.brandName.trim(),
        ...(form.image ? { image: form.image } : {})
      }
      const res = await window.api.brand.create(payload)
      if (!res?.success) {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        else setError(res?.message || res?.error || 'Failed to create brand')
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

  // ── UPDATE BRAND ──────────────────────────────────────────────────────────
  const updateBrand = useCallback(async (form) => {
    resetMessages()
    const errors = validateBrand(form)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return { success: false, fieldErrors: errors }
    }

    setLoading(true)
    try {
      const payload = {
        id: form.id,
        brandName: form.brandName.trim(),
        image: form.image ?? ''
      }
      const res = await window.api.brand.update(payload)
      if (!res?.success) {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        else setError(res?.message || res?.error || 'Failed to update brand')
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

  // ── GET BRAND BY ID ───────────────────────────────────────────────────────
  const getBrandById = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.brand.getById(id)
      if (!res?.success) {
        setError(res?.message || res?.error || 'Failed to fetch brand')
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
  }, [])

  // ── GET ALL BRANDS ────────────────────────────────────────────────────────
  const getAllBrands = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.brand.getAll()
      if (!res?.success) {
        setError(res?.message || res?.error || 'Failed to fetch brands')
      }
      console.log('Fetched brands:', res)
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

  // ── DELETE BRAND ──────────────────────────────────────────────────────────
  const deleteBrand = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.brand.delete(id)
      if (!res?.success) {
        setError(res?.message || res?.error || 'Failed to delete brand')
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
  }, [])

  return {
    loading,
    error,
    fieldErrors,
    setFieldErrors,
    setError,
    createBrand,
    updateBrand,
    getBrandById,
    getAllBrands,
    deleteBrand,
    resetMessages
  }
}
