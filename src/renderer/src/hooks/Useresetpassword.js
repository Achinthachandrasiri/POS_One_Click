import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const OTP_EXPIRE_SECONDS = 10 * 60
const MAX_ATTEMPTS = 3

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
  const [countdown, setCountdown] = useState(OTP_EXPIRE_SECONDS)
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
  const [blocked, setBlocked] = useState(false)
  const inputRefs = useRef([])
  const timerRef = useRef(null)

  // ── Countdown timer ───────────────────────────────────────────
  const startCountdown = () => {
    setCountdown(OTP_EXPIRE_SECONDS)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setBlocked(true)
          setError('OTP has expired. Please request a new one.')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  // ── OTP box handlers ──────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const updated = [...otp]
    updated[index] = value
    setOtp(updated)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
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
        setAttemptsLeft(MAX_ATTEMPTS)
        setBlocked(false)
        setOtp(['', '', '', '', '', ''])
        startCountdown()
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

    if (blocked) {
      setError("OTP has expired or you have exceeded the maximum attempts. Please request a new one.")
      return
    }

    const code = otp.join('')
    if (code.length < 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)

    try {
      const res = await window.api.auth.verifyOtp({ username: username.trim(), otp: code })

      if (res?.success) {
        clearInterval(timerRef.current)
        setStep('newPassword')
      } else {
        const remaining = attemptsLeft - 1
        setAttemptsLeft(remaining)

        if (remaining <= 0) {
          setBlocked(true)
          clearInterval(timerRef.current)
          setError('Too many failed attempts. Please request a new OTP.')
        } else {
          setError(`Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`)
        }

        setOtp(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
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
    setBlocked(false)
    setAttemptsLeft(MAX_ATTEMPTS)
    setLoading(true)

    try {
      const res = await window.api.auth.sendOtp({ username: username.trim() })
      if (res?.success) {
        startCountdown()
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      } else {
        setError(res?.error || 'Failed to resend. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to resend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    clearInterval(timerRef.current)
    setStep('email')
    setOtp(['', '', '', '', '', ''])
    setError('')
    setFieldErrors({})
    setAttemptsLeft(MAX_ATTEMPTS)
    setBlocked(false)
    setCountdown(OTP_EXPIRE_SECONDS)
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
    countdown,
    attemptsLeft,
    blocked,
    formatTime,
    handleSendOtp,
    handleVerifyOtp,
    handleChangePassword,
    handleOtpChange,
    handleOtpKeyDown,
    handleResend,
    goBack
  }
}
