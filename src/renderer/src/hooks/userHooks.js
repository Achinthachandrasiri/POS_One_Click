import { useState, useCallback } from 'react'

const validateUser = (form, isUpdate = false) => {
  const errors = {}

  const first_name = form.first_name?.trim()
  const last_name = form.last_name?.trim()
  const email = form.email?.trim()
  const mobile = form.mobile?.trim()
  const password = form.password?.trim()
  const role = form.role?.trim()

  if (!first_name) errors.first_name = 'First name is required'
  if (!last_name) errors.last_name = 'Last name is required'

  if (!email) {
    errors.email = 'Email is required'
  } else if (!email.endsWith('@gmail.com')) {
    errors.email = 'Email must be a @gmail.com address'
  }

  if (!mobile) {
    errors.mobile = 'Mobile number is required'
  } else {
    const cleanedMobile = mobile.replace(/\s+/g, '')
    if (!/^0\d{9}$/.test(cleanedMobile)) {
      errors.mobile = 'Mobile must be exactly 10 digits, start with 0 (e.g. 0771234567)'
    }
  }

  if (!isUpdate) {
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
  }

  if (!role) {
    errors.role = 'Role is required'
  } else if (!['super_admin', 'admin', 'user'].includes(role)) {
    errors.role = 'Role must be super_admin, admin or user'
  }

  return errors
}

export const useUserHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const resetMessages = useCallback(() => {
    setError('')
    setFieldErrors({})
  }, [])

  // Reusable stable handleChange
  const handleChange = useCallback((setForm) => (e) => {
    const { name, value } = e.target
    let finalValue = value

    if (name === 'mobile') {
      finalValue = value.replace(/[^0-9]/g, '').slice(0, 10)
    }

    setForm((prev) => ({ ...prev, [name]: finalValue }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }, [])

  // ── CREATE USER ──
  const createUser = useCallback(async (form) => {
    resetMessages()
    const errors = validateUser(form, false)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return { success: false, fieldErrors: errors }
    }

    setLoading(true)
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password.trim(),
        role: form.role.trim()
      }
      const res = await window.api.user.create(payload)
      if (!res?.success) {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        else setError(res?.error || 'Failed to create user')
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

  // ── UPDATE USER ──
  const updateUser = useCallback(async (id, form) => {
    resetMessages()
    const errors = validateUser(form, true)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return { success: false, fieldErrors: errors }
    }

    setLoading(true)
    try {
      const payload = {
        id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        role: form.role.trim()
      }
      const res = await window.api.user.update(payload)
      if (!res?.success) {
        if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
        else setError(res?.error || 'Failed to update user')
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

  // ── GET USER BY ID ──
  const getUserById = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.user.getById(id)
      if (!res?.success) {
        setError(res?.error || 'Failed to fetch user')
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

  // ── GET ALL USERS ──
  const getAllUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.user.getAll()
      if (!res?.success) {
        setError(res?.error || 'Failed to fetch users')
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

  // ── DELETE USER ──
  const deleteUser = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.user.delete(id)
      if (!res?.success) {
        setError(res?.error || 'Failed to delete user')
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

  // ── UNLOCK USER ──
  const unlockUser = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.api.user.unlock(id)
      if (!res?.success) {
        setError(res?.error || 'Failed to unlock user')
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
    handleChange,
    createUser,
    updateUser,
    getUserById,
    getAllUsers,
    deleteUser,
    unlockUser,
    resetMessages
  }
}
