import { useState } from 'react'

export const useLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Validation
  const validate = () => {
    const errors = {}

    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()

    // Username validation
    if (!trimmedUsername) {
      errors.username = 'Username is required'
    } else if (!trimmedUsername.endsWith('@gmail.com')) {
      errors.username = 'Username must be a Gmail address (example@gmail.com)'
    }

    // Password validation
    if (!trimmedPassword) {
      errors.password = 'Password is required'
    } else if (trimmedPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    setFieldErrors(errors)

    return Object.keys(errors).length === 0
  }

  // Submit
  const handleLogin = async (e) => {
    e.preventDefault()

    setError('')
    setFieldErrors({})

    if (!validate()) return

    setLoading(true)

    try {
      const payload = {
        username: username.trim(),
        password: password.trim(),
        loginTime: new Date().toISOString()
      }

      const res = await window.api.auth.login(payload)

      if (res?.success) {
        alert(`Logged in as ${res.user.username}`)
      } else {
        if (res?.fieldErrors) {
          setFieldErrors(res.fieldErrors)
        } else {
          setError(res?.error || 'Invalid credentials')
        }
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return {
    username,
    setUsername: (val) => setUsername(val.trimStart()),
    password,
    setPassword: (val) => setPassword(val.trimStart()),
    error,
    fieldErrors,
    loading,
    handleLogin
  }
}
