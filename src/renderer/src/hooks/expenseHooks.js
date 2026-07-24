import { useState, useCallback } from 'react'
import { getCurrentUser } from '../utils/session'

export const useExpenseHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getAllExpenses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.expense.getAll()
      if (!res?.success) {
        setError(res?.error || 'Failed to load expenses')
      }
      return res
    } catch (err) {
      console.error('getAllExpenses error:', err)
      setError('Failed to load expenses')
      return { success: false, error: 'Failed to load expenses' }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetches a single expense by id — used by the edit page to preload the
  // form. Mirrors the same shape as handleGetExpenseById in the controller.
  const getExpenseById = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.expense.getById(id)
      if (!res?.success) {
        setError(res?.error || 'Failed to load expense')
      }
      return res
    } catch (err) {
      console.error('getExpenseById error:', err)
      setError('Failed to load expense')
      return { success: false, error: 'Failed to load expense' }
    } finally {
      setLoading(false)
    }
  }, [])

  // data: { date, reason, amount, note } — added_by is injected here from the
  // logged-in user, the caller doesn't need to know about it.
  const createExpense = useCallback(async (data) => {
    setLoading(true)
    setError('')
    try {
      const currentUser = getCurrentUser()
      const added_by = currentUser?._id || currentUser?.id

      if (!added_by) {
        console.warn('createExpense: no user in session. localStorage "user" =', localStorage.getItem('user'))
        setError('Your session has expired. Please log in again.')
        return { success: false, error: 'Your session has expired. Please log in again.' }
      }

      const res = await window.api.expense.create({ ...data, added_by })
      if (!res?.success && !res?.fieldErrors) {
        setError(res?.error || 'Failed to create expense')
      }
      return res
    } catch (err) {
      console.error('createExpense error:', err?.message || err, err)
      setError(err?.message || 'Failed to create expense')
      return { success: false, error: err?.message || 'Failed to create expense' }
    } finally {
      setLoading(false)
    }
  }, [])

  // data: { id, date, reason, amount, note } — userId/userRole are injected
  // here so the controller can check edit permission.
  const updateExpense = useCallback(async (data) => {
    setLoading(true)
    setError('')
    try {
      const currentUser = getCurrentUser()
      const userId = currentUser?._id || currentUser?.id
      const userRole = currentUser?.role

      if (!userId) {
        console.warn('updateExpense: no user in session. localStorage "user" =', localStorage.getItem('user'))
        setError('Your session has expired. Please log in again.')
        return { success: false, error: 'Your session has expired. Please log in again.' }
      }

      const res = await window.api.expense.update({ ...data, userId, userRole })
      if (!res?.success && !res?.fieldErrors) {
        setError(res?.error || 'Failed to update expense')
      }
      return res
    } catch (err) {
      console.error('updateExpense error:', err)
      setError('Failed to update expense')
      return { success: false, error: 'Failed to update expense' }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteExpense = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const currentUser = getCurrentUser()
      const userId = currentUser?._id || currentUser?.id
      const userRole = currentUser?.role

      const res = await window.api.expense.delete(id, userId, userRole)
      if (!res?.success) {
        setError(res?.error || 'Failed to delete expense')
      }
      return res
    } catch (err) {
      console.error('deleteExpense error:', err)
      setError('Failed to delete expense')
      return { success: false, error: 'Failed to delete expense' }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    getAllExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    loading,
    error
  }
}
