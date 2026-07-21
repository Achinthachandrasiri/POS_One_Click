import { useState, useCallback } from 'react'
import { getCurrentUser } from '../utils/session'

export const useWarrantyTypeHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getAllWarrantyTypes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.warrantyType.getAll()
      if (!res?.success) {
        setError(res?.error || 'Failed to load warranty types')
      }
      return res
    } catch (err) {
      console.error('getAllWarrantyTypes error:', err)
      setError('Failed to load warranty types')
      return { success: false, error: 'Failed to load warranty types' }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetches a single warranty type by id — used by the edit page to preload
  // the form. Mirrors the same shape as handleGetWarrantyTypeById in the controller.
  const getWarrantyTypeById = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.warrantyType.getById(id)
      if (!res?.success) {
        setError(res?.error || 'Failed to load warranty type')
      }
      return res
    } catch (err) {
      console.error('getWarrantyTypeById error:', err)
      setError('Failed to load warranty type')
      return { success: false, error: 'Failed to load warranty type' }
    } finally {
      setLoading(false)
    }
  }, [])

  // data: { warranty_name, coverage_type, terms } — added_by is injected here
  // from the logged-in user, the caller doesn't need to know about it.
  const createWarrantyType = useCallback(async (data) => {
    setLoading(true)
    setError('')
    try {
      const currentUser = getCurrentUser()
      const added_by = currentUser?._id || currentUser?.id

      if (!added_by) {
        console.warn('createWarrantyType: no user in session. localStorage "user" =', localStorage.getItem('user'))
        setError('Your session has expired. Please log in again.')
        return { success: false, error: 'Your session has expired. Please log in again.' }
      }

      const res = await window.api.warrantyType.create({ ...data, added_by })
      if (!res?.success && !res?.fieldErrors) {
        setError(res?.error || 'Failed to create warranty type')
      }
      return res
    } catch (err) {
      console.error('createWarrantyType error:', err?.message || err, err)
      setError(err?.message || 'Failed to create warranty type')
      return { success: false, error: err?.message || 'Failed to create warranty type' }
    } finally {
      setLoading(false)
    }
  }, [])

  // data: { _id, warranty_name, coverage_type, terms }
  const updateWarrantyType = useCallback(async (data) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.warrantyType.update(data)
      if (!res?.success && !res?.fieldErrors) {
        setError(res?.error || 'Failed to update warranty type')
      }
      return res
    } catch (err) {
      console.error('updateWarrantyType error:', err)
      setError('Failed to update warranty type')
      return { success: false, error: 'Failed to update warranty type' }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteWarrantyType = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.warrantyType.delete(id)
      if (!res?.success) {
        setError(res?.error || 'Failed to delete warranty type')
      }
      return res
    } catch (err) {
      console.error('deleteWarrantyType error:', err)
      setError('Failed to delete warranty type')
      return { success: false, error: 'Failed to delete warranty type' }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    getAllWarrantyTypes,
    getWarrantyTypeById,
    createWarrantyType,
    updateWarrantyType,
    deleteWarrantyType,
    loading,
    error
  }
}
