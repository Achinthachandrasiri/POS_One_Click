import { useState } from 'react'

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
  } else if (!/^0\d{9}$/.test(mobile)) {
    errors.mobile = 'Mobile must be 10 digits and start with 0'
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

  const resetMessages = () => {
    setError('')
    setFieldErrors({})
  }

  // ── CREATE USER ──
  const createUser = async (form) => {
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
  }

  // ── UPDATE USER ──
  const updateUser = async (id, form) => {
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
  }

  // ── GET USER BY ID ──
  const getUserById = async (id) => {
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
  }

  // ── GET ALL USERS ──
  const getAllUsers = async () => {
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
  }

  // ── DELETE USER ──
  const deleteUser = async (id) => {
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
  }

  // ── UNLOCK USER ──
  const unlockUser = async (id) => {
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
  }

  return {
    loading,
    error,
    fieldErrors,
    setFieldErrors,
    setError,
    createUser,
    updateUser,
    getUserById,
    getAllUsers,
    deleteUser,
    unlockUser
  }
}
