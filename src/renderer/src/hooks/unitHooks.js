import { useState, useCallback } from 'react'

const validate = (form) => {
  const errors = {}
  if (!form.unitName?.trim()) errors.unitName = 'Unit name is required'
  return errors
}

export const useUnitHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const reset = useCallback(() => {
    setError('')
    setFieldErrors({})
  }, [])

  const createUnit = useCallback(async (form) => {
    reset()
    const errs = validate(form)
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return { success: false, fieldErrors: errs }
    }
    setLoading(true)
    try {
      const payload = { unitName: form.unitName.trim(), shortName: form.shortName ?? '' }
      const res = await window.api.unit.create(payload)
      if (!res?.success) setError(res?.message || res?.error || 'Failed to create unit')
      return res
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }, [reset])

  const updateUnit = useCallback(async (form) => {
    reset()
    const errs = validate(form)
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return { success: false, fieldErrors: errs }
    }
    setLoading(true)
    try {
      const payload = { id: form.id, unitName: form.unitName.trim(), shortName: form.shortName ?? '' }
      const res = await window.api.unit.update(payload)
      if (!res?.success) setError(res?.message || res?.error || 'Failed to update unit')
      return res
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }, [reset])

  const getUnitById = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.unit.getById(id)
      if (!res?.success) setError(res?.message || res?.error || 'Failed to fetch unit')
      return res
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllUnits = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.unit.getAll()
      if (!res?.success) setError(res?.message || res?.error || 'Failed to fetch units')
      return res
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteUnit = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.unit.delete(id)
      if (!res?.success) setError(res?.message || res?.error || 'Failed to delete unit')
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
    createUnit,
    updateUnit,
    getUnitById,
    getAllUnits,
    deleteUnit,
    setFieldErrors,
    setError
  }
}
