import { useState, useCallback } from 'react'

const validateCategory = (form) => {
  const errors = {}

  const categoryName = form.categoryName?.trim()

  if (!categoryName) {
    errors.categoryName = 'Category name is required'
  }

  return errors
}

export const useCategoryHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const resetMessages = useCallback(() => {
    setError('')
    setFieldErrors({})
  }, [])

  // ── CREATE CATEGORY ───────────────────────────────────────────────────────
  const createCategory = useCallback(async (form) => {
    resetMessages()
    const errors = validateCategory(form)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return { success: false, fieldErrors: errors }
    }

    setLoading(true)
    try {
      const payload = {
        categoryName: form.categoryName.trim(),
        ...(form.image ? { image: form.image } : {})
      }
      const res = await window.api.category.create(payload)
      if (!res?.success) {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        else setError(res?.message || res?.error || 'Failed to create category')
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

  // ── UPDATE CATEGORY ───────────────────────────────────────────────────────
  const updateCategory = useCallback(async (form) => {
    resetMessages()
    const errors = validateCategory(form)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return { success: false, fieldErrors: errors }
    }

    setLoading(true)
    try {
      const payload = {
        id: form.id,
        categoryName: form.categoryName.trim(),
        image: form.image ?? ''
      }
      const res = await window.api.category.update(payload)
      if (!res?.success) {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        else setError(res?.message || res?.error || 'Failed to update category')
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

  // ── GET CATEGORY BY ID ────────────────────────────────────────────────────
  const getCategoryById = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.category.getById(id)
      if (!res?.success) {
        setError(res?.message || res?.error || 'Failed to fetch category')
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

  // ── GET ALL CATEGORIES ────────────────────────────────────────────────────
  const getAllCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.category.getAll()
      if (!res?.success) {
        setError(res?.message || res?.error || 'Failed to fetch categories')
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

  // ── DELETE CATEGORY ───────────────────────────────────────────────────────
  const deleteCategory = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.category.delete(id)
      if (!res?.success) {
        setError(res?.message || res?.error || 'Failed to delete category')
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
    createCategory,
    updateCategory,
    getCategoryById,
    getAllCategories,
    deleteCategory,
    resetMessages
  }
}
