import { useState } from 'react'

export const useStoreHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // CREATE STORE
  const createStore = async (data) => {
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const res = await window.api.store.create(data)

      if (res?.success) return res

      if (res?.fieldErrors) {
        setFieldErrors(res.fieldErrors)
        return res
      }

      setError(res?.error || 'Failed to create store')
      return res

    } catch (err) {
      console.error(err)
      setError('Unexpected error occurred')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  // GET ALL STORES
  const getAllStores = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await window.api.store.getAll()

      if (!res?.success) {
        setError(res?.error || 'Failed to fetch stores')
      }

      return res
    } catch (err) {
      console.error(err)
      setError('Unexpected error occurred')
      return { success: false, stores: [] }
    } finally {
      setLoading(false)
    }
  }

  // GET STORE BY ID
  const getStoreById = async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.store.getById(id)
      if (!res?.success) setError(res?.error || 'Failed to fetch store')
      return res
    } catch (err) {
      console.error(err)
      setError('Unexpected error occurred')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  // UPDATE STORE
  const updateStore = async (data) => {
    setLoading(true)
    setError('')
    setFieldErrors({})
    try {
      const res = await window.api.store.update(data)
      if (!res?.success) setError(res?.error || 'Failed to update store')
      return res
    } catch (err) {
      console.error(err)
      setError('Unexpected error occurred')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  // DELETE STORE
  const deleteStore = async (id) => {
    setLoading(true)
    setError('')

    try {
      const res = await window.api.store.delete(id)

      if (!res?.success) {
        setError(res?.error || 'Failed to delete store')
      }

      return res
    } catch (err) {
      console.error(err)
      setError('Unexpected error occurred')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return {
    createStore,
    getAllStores,
    deleteStore,
    getStoreById,
    updateStore,
    loading,
    error,
    setError,
    fieldErrors,
    setFieldErrors
  }
}
