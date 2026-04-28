import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const useLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [bootstrapMessage, setBootstrapMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const bootstrapTempAdmin = async () => {
      try {
        const res = await window.api.auth.bootstrapTempAdmin()

        if (res?.success && res.created && res.credentials) {
          setUsername(res.credentials.email)
          setPassword(res.credentials.password)
          setBootstrapMessage('Temporary admin created for first-time access. Logging you in now.')
          await handleLogin(null, res.credentials)
        }
      } catch (err) {
        console.error(err)
      }
    }

    bootstrapTempAdmin()
  }, [])

  // Validation
  const validate = (currentUsername, currentPassword) => {
    const errors = {}

    const trimmedUsername = currentUsername.trim()
    const trimmedPassword = currentPassword.trim()

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
  const handleLogin = async (e, overrides = {}) => {
    e?.preventDefault?.()

    setError('')
    setFieldErrors({})
    setBootstrapMessage('')

    const currentUsername = overrides.username ?? username
    const currentPassword = overrides.password ?? password

    if (!validate(currentUsername, currentPassword)) return

    setLoading(true)

    try {
      const payload = {
        username: currentUsername.trim(),
        password: currentPassword.trim(),
        loginTime: new Date().toISOString()
      }

      const res = await window.api.auth.login(payload)

      if (res?.success) {
        navigate('/dashboard')
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
    bootstrapMessage,
    handleLogin
  }
}
