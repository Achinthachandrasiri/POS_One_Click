import { useState, useCallback } from 'react'

const validate = (form) => {
  const errors = {}
  if (!form.unitName?.trim()) errors.unitName = 'Unit name is required'
  if (!form.unitType || !['quantity', 'measurable'].includes(form.unitType))
    errors.unitType = 'Unit type is required'

  // Only validate subUnit fields if the user has started filling them in
  const hasSubUnitShortName = !!form.subUnit?.shortName?.trim()
  const hasSubUnitFactor = !!form.subUnit?.conversionFactor

  if (hasSubUnitShortName && !hasSubUnitFactor) {
    errors['subUnit.conversionFactor'] = 'Conversion factor is required when a sub-unit symbol is set'
  }
  if (hasSubUnitFactor && !hasSubUnitShortName) {
    errors['subUnit.shortName'] = 'Sub-unit symbol is required when a conversion factor is set'
  }
  if (hasSubUnitFactor && Number(form.subUnit.conversionFactor) <= 0) {
    errors['subUnit.conversionFactor'] = 'Conversion factor must be greater than 0'
  }

  return errors
}

// Returns null if neither subUnit field was filled, otherwise returns the object
// (controller will further validate).
const buildSubUnit = (subUnit) => {
  if (!subUnit?.shortName?.trim() && !subUnit?.conversionFactor) return null
  return {
    shortName: subUnit.shortName?.trim() ?? '',
    conversionFactor: Number(subUnit.conversionFactor)
  }
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
      const payload = {
        unitName: form.unitName.trim(),
        shortName: form.shortName ?? '',
        unitType: form.unitType,
        subUnit: buildSubUnit(form.subUnit)
      }
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
      const payload = {
        id: form.id,
        unitName: form.unitName.trim(),
        shortName: form.shortName ?? '',
        unitType: form.unitType,
        // send null explicitly to clear a previously-saved sub-unit
        subUnit: buildSubUnit(form.subUnit)
      }
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
