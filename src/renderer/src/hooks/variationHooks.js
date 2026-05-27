import { useState, useCallback } from 'react'

const validate = (form) => {
  const errors = {}
  if (!form.variationName?.trim()) errors.variationName = 'Variation name is required'
  return errors
}

export const useVariationHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const reset = useCallback(() => {
    setError('')
    setFieldErrors({})
  }, [])

  const createVariation = useCallback(async (form) => {
    reset()
    const errs = validate(form)
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return { success: false, fieldErrors: errs }
    }
    setLoading(true)
    try {
      const payload = { variationName: form.variationName.trim(), types: form.types ?? '' }
      const res = await window.api.variation.create(payload)
      if (!res?.success) setError(res?.message || res?.error || 'Failed to create variation')
      return res
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }, [reset])

  const updateVariation = useCallback(async (form) => {
    reset()
    const errs = validate(form)
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return { success: false, fieldErrors: errs }
    }
    setLoading(true)
    try {
      const payload = { id: form.id, variationName: form.variationName.trim(), types: form.types ?? '' }
      const res = await window.api.variation.update(payload)
      if (!res?.success) setError(res?.message || res?.error || 'Failed to update variation')
      return res
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }, [reset])

  const getVariationById = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.variation.getById(id)
      if (!res?.success) setError(res?.message || res?.error || 'Failed to fetch variation')
      return res
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllVariations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.variation.getAll()
      if (!res?.success) setError(res?.message || res?.error || 'Failed to fetch variations')
      return res
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteVariation = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.variation.delete(id)
      if (!res?.success) setError(res?.message || res?.error || 'Failed to delete variation')
      return res
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fieldErrors,
    reset,
    createVariation,
    updateVariation,
    getVariationById,
    getAllVariations,
    deleteVariation,
    setFieldErrors,
    setError
  }
}
