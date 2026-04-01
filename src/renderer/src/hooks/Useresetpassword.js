import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export const useResetPassword = () => {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const inputRefs = useRef([])

  // ── OTP box handlers ──────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return

    const updated = [...otp]
    updated[index] = value
    setOtp(updated)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // ── Send OTP ──────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const trimmed = username.trim()

    if (!trimmed) {
      setFieldErrors({ username: 'Username is required' })
      return
    }
    if (!trimmed.endsWith('@gmail.com')) {
      setFieldErrors({ username: 'Username must be a Gmail address' })
      return
    }

    setLoading(true)

    try {
      const res = await window.api.auth.sendOtp({ username: trimmed })

      if (res?.success) {
        setStep('otp')
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      } else {
        setFieldErrors({ username: res?.error || 'User not found' })
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Verify OTP ────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')

    const code = otp.join('')

    if (code.length < 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)

    try {
      const res = await window.api.auth.verifyOtp({ username: username.trim(), otp: code })

      if (res?.success) {
        setStep('newPassword')
      } else {
        setError(res?.error || 'Invalid OTP. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Change Password ───────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (!newPassword) {
      setFieldErrors({ newPassword: 'New password is required' })
      return
    }
    if (newPassword.length < 8) {
      setFieldErrors({ newPassword: 'Password must be at least 8 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' })
      return
    }

    setLoading(true)

    try {
      const res = await window.api.auth.changePassword({
        username: username.trim(),
        newPassword
      })

      if (res?.success) {
        navigate('/')
      } else {
        setError(res?.error || 'Failed to change password. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResend = async () => {
    setOtp(['', '', '', '', '', ''])
    setError('')
    setLoading(true)

    try {
      await window.api.auth.sendOtp({ username: username.trim() })
      inputRefs.current[0]?.focus()
    } catch (err) {
      console.error(err)
      setError('Failed to resend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setStep('email')
    setOtp(['', '', '', '', '', ''])
    setError('')
    setFieldErrors({})
  }

  return {
    username,
    setUsername: (val) => setUsername(val.trimStart()),
    otp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    step,
    loading,
    error,
    fieldErrors,
    inputRefs,
    handleSendOtp,
    handleVerifyOtp,
    handleChangePassword,
    handleOtpChange,
    handleOtpKeyDown,
    handleResend,
    goBack
  }
}
