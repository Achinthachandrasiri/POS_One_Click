import { useState, useCallback } from 'react'
import { getCurrentUser } from '../utils/session'

// Mirrors useExpenseHooks.js conventions: { loading, error } state,
// try/catch/finally around each window.api call, functions return
// the raw IPC result object so callers can check `.success` themselves.
export const useServiceHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // data: { service_name, service_code, category, description, cost, price,
  // tax_rate, status } — added_by is injected here from the logged-in user,
  // the caller doesn't need to know about it. Services are not store-scoped.
  const createService = useCallback(async (data) => {
    setLoading(true)
    setError(null)
    try {
      const currentUser = getCurrentUser()
      const added_by = currentUser?._id || currentUser?.id

      const res = await window.api.service.create({ ...data, added_by })
      if (!res?.success && !res?.fieldErrors) setError(res?.error || 'Failed to create service')
      return res
    } catch (err) {
      const message = err?.message || 'Failed to create service'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  // params: { page, limit, category, status, search }
  // limit: 'all' (or omit) for no pagination — see serviceController.getServices
  const getAllServices = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.api.service.getAll(params)
      if (!res?.success) setError(res?.error || 'Failed to fetch services')
      return res
    } catch (err) {
      const message = err?.message || 'Failed to fetch services'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const getServiceById = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.api.service.getById(id)
      if (!res?.success) setError(res?.error || 'Failed to fetch service')
      return res
    } catch (err) {
      const message = err?.message || 'Failed to fetch service'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateService = useCallback(async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.api.service.update(data)
      if (!res?.success) setError(res?.error || 'Failed to update service')
      return res
    } catch (err) {
      const message = err?.message || 'Failed to update service'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteService = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.api.service.delete(id)
      if (!res?.success) setError(res?.error || 'Failed to delete service')
      return res
    } catch (err) {
      const message = err?.message || 'Failed to delete service'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
  }
}
